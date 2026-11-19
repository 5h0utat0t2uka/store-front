import "server-only";
import { gql, type StorefrontApi } from "@shopify/hydrogen";
import { headers } from "next/headers";
import { createBuyerClient, createBuyerRequestContext } from "./client";

// 一度に表示する件数。ページ送りは実装していない。
const SEARCH_RESULT_COUNT = 24;

// 商品の項目はカタログ一覧とそろえ、同じ商品カードで表示する。
// search は商品以外（記事・ページ）も返せる union なので、__typename で商品だけを取り出す。
const SEARCH_PRODUCTS_QUERY = gql(`
  query SearchProducts(
    $term: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    search(
      query: $term
      first: $first
      types: [PRODUCT]
      unavailableProducts: LAST
    ) {
      totalCount
      nodes {
        __typename
        ... on Product {
          id
          handle
          title
          availableForSale
          category {
            name
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
`);

type SearchNode = StorefrontApi.ResultOf<typeof SEARCH_PRODUCTS_QUERY>["search"]["nodes"][number];

export type SearchProduct = Extract<SearchNode, { __typename: "Product" }>;

export type SearchProductsResult = {
  products: SearchProduct[];
  // 一致した商品の総数。products は先頭の SEARCH_RESULT_COUNT 件まで。
  totalCount: number;
};

// 検索結果はキーワードごとに変わるため "use cache" には入れず、リクエストごとに問い合わせる。
// 入力中の候補（/api/predictive-search）と同じく、購入者の IP を Storefront API に渡す。
export async function searchProducts(term: string): Promise<SearchProductsResult> {
  const requestContext = createBuyerRequestContext({
    headers: await headers(),
  });
  const storefront = createBuyerClient(requestContext);
  const result = await storefront.graphql(SEARCH_PRODUCTS_QUERY, {
    variables: { term, first: SEARCH_RESULT_COUNT },
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
  };
}
