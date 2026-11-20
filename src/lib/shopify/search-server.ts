import "server-only";
import { gql, type StorefrontApi } from "@shopify/hydrogen";
import { headers } from "next/headers";
import { createBuyerClient, createBuyerRequestContext } from "./client";
import { PRODUCT_CARD_FRAGMENT } from "./product";
import type { SearchCursor } from "./search";

// 検索結果の1ページあたりの件数。
const SEARCH_RESULT_COUNT = 3;

// 商品の項目はカタログ一覧とそろえ、同じ商品カードで表示する。
// search は商品以外（記事・ページ）も返せる union なので、__typename で商品だけを取り出す。
const SEARCH_PRODUCTS_QUERY = gql(
  `
  query SearchProducts(
    $term: String!
    $first: Int
    $after: String
    $last: Int
    $before: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    search(
      query: $term
      first: $first
      after: $after
      last: $last
      before: $before
      types: [PRODUCT]
      unavailableProducts: LAST
    ) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasPreviousPage
        hasNextPage
      }
      nodes {
        __typename
        ...ProductCardFields
      }
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);

type SearchConnection = StorefrontApi.ResultOf<typeof SEARCH_PRODUCTS_QUERY>["search"];
type SearchNode = SearchConnection["nodes"][number];

export type SearchProduct = Extract<SearchNode, { __typename: "Product" }>;

export type SearchProductsResult = {
  products: SearchProduct[];
  // カーソルの位置にかかわらず、キーワードに一致した商品の総数。
  totalCount: number;
  pageInfo: SearchConnection["pageInfo"];
};

// 検索結果はキーワードごとに変わるため "use cache" には入れず、リクエストごとに問い合わせる。
// 入力中の候補（/api/predictive-search）と同じく、購入者の IP を Storefront API に渡す。
export async function searchProducts(term: string, cursor?: SearchCursor): Promise<SearchProductsResult> {
  const requestContext = createBuyerRequestContext({
    headers: await headers(),
  });
  const storefront = createBuyerClient(requestContext);
  const result = await storefront.graphql(SEARCH_PRODUCTS_QUERY, {
    variables: {
      term,
      ...cursor,
      ...(cursor && "before" in cursor ? { last: SEARCH_RESULT_COUNT } : { first: SEARCH_RESULT_COUNT }),
    },
  });
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  const search = result.data?.search;
  if (!search || !Array.isArray(search.nodes)) {
    throw new Error("Failed to search products from Shopify Storefront API: Invalid response format.");
  }
  return {
    products: search.nodes.filter((node): node is SearchProduct => node.__typename === "Product"),
    totalCount: search.totalCount,
    pageInfo: search.pageInfo,
  };
}
