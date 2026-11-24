import "server-only";
import { gql, type SelectedOption, type StorefrontApi } from "@shopify/hydrogen";
import { cacheLife } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createCatalogClient } from "./client";
import { PRODUCT_CARD_FRAGMENT, PRODUCT_VARIANT_FRAGMENT } from "./product";

const SHOP_METADATA_QUERY = gql(`
  query ShopMetadata {
    shop {
      name
      description
    }
  }
`);

const PRODUCT_PAGE_FRAGMENT = gql(
  `
  fragment ProductPageFields on ProductConnection {
    pageInfo {
      startCursor
      endCursor
      hasPreviousPage
      hasNextPage
    }
    nodes {
      ...ProductCardFields
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);

const HOME_PRODUCTS_QUERY = gql(
  `
  query HomeProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 4) {
      nodes { ...ProductCardFields }
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);

const CATALOG_INDEX_QUERY = gql(`
  query CatalogIndex($after: String, $query: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 250, after: $after, query: $query) {
      edges { cursor node { id } }
      pageInfo { hasNextPage endCursor }
    }
  }
`);

const PRODUCT_CARDS_BY_ID_QUERY = gql(
  `
  query ProductCardsById($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      __typename
      ...ProductCardFields
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);

const PRODUCT_CARD_QUERY = gql(
  `
  query ProductCardByHandle($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductCardFields
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
);

const COLLECTION_QUERY = gql(
  `
  query CollectionPage(
    $handle: String!
    $first: Int
    $after: String
    $last: Int
    $before: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      handle
      title
      isCampaign: metafield(namespace: "custom", key: "is_campaign") {
        value
      }
      description
      descriptionHtml
      image {
        url
        altText
        width
        height
      }
      seo {
        title
        description
      }
      products(first: $first, after: $after, last: $last, before: $before) {
        ...ProductPageFields
      }
    }
  }
`,
  [PRODUCT_PAGE_FRAGMENT],
);

const COLLECTION_LIST_QUERY = gql(`
  query CollectionList($first: Int!, $after: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: $first, after: $after, sortKey: TITLE) {
      nodes {
        handle
        title
        isCampaign: metafield(namespace: "custom", key: "is_campaign") {
          value
        }
        image {
          url
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

// requiresSellingPlan から adjacentVariants までは、Hydrogen の商品フォーム
// （バリアントの解決とカートへの追加）が使う。
const PRODUCT_QUERY = gql(
  `
  query ProductDetails(
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
    $includeRelatedProducts: Boolean!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      relatedProducts: metafield(
        namespace: "shopify--discovery--product_recommendation"
        key: "related_products"
      ) @include(if: $includeRelatedProducts) {
        # list.product_reference の上限まで、選択された商品をまとめて取得する。
        references(first: 128) {
          nodes {
            __typename
            ...ProductCardFields
          }
        }
      }
      tags
      vendor
      requiresSellingPlan
      encodedVariantExistence
      encodedVariantAvailability
      options {
        name
        optionValues {
          name
          firstSelectableVariant {
            ...ProductVariantFields
          }
        }
      }
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions) {
        ...ProductVariantFields
      }
      adjacentVariants(selectedOptions: $selectedOptions) {
        ...ProductVariantFields
      }
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
      images(first: 20) {
        nodes {
          url
          altText
          width
          height
        }
      }
      seo {
        title
        description
      }
    }
  }
`,
  [PRODUCT_VARIANT_FRAGMENT, PRODUCT_CARD_FRAGMENT],
);

// オンラインストアの「ページ」（管理画面のオンラインストア → ページ）。body は HTML で返る。
const PAGE_QUERY = gql(`
  query PageDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      id
      handle
      title
      body
      bodySummary
      seo {
        title
        description
      }
    }
  }
`);

const PAGE_HANDLES_QUERY = gql(`
  query PageHandles($first: Int!) {
    pages(first: $first) {
      nodes {
        handle
      }
    }
  }
`);

const SHOP_POLICY_FRAGMENT = gql(`
  fragment ShopPolicyFields on ShopPolicy {
    id
    handle
    title
    body
  }
`);

// 管理画面の設定 → ポリシーで管理する文書。未作成のものは null で返る。
// subscriptionPolicy は未作成でも Shopify の既定の文面が返り、作成済みかどうかを区別できないため含めない。
const SHOP_POLICIES_QUERY = gql(
  `
  query ShopPolicies($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...ShopPolicyFields
      }
      refundPolicy {
        ...ShopPolicyFields
      }
      shippingPolicy {
        ...ShopPolicyFields
      }
      termsOfService {
        ...ShopPolicyFields
      }
      termsOfSale {
        ...ShopPolicyFields
      }
      legalNotice {
        ...ShopPolicyFields
      }
      contactInformation {
        ...ShopPolicyFields
      }
    }
  }
`,
  [SHOP_POLICY_FRAGMENT],
);

export type ProductSummary = StorefrontApi.ResultOf<typeof HOME_PRODUCTS_QUERY>["products"]["nodes"][number];

export type ShopMetadata = {
  name: string;
  description?: string | null;
};

export type ProductDetail = NonNullable<StorefrontApi.ResultOf<typeof PRODUCT_QUERY>["product"]>;

export type ContentPage = NonNullable<StorefrontApi.ResultOf<typeof PAGE_QUERY>["page"]>;

export type ShopPolicy = NonNullable<StorefrontApi.ResultOf<typeof SHOP_POLICIES_QUERY>["shop"]["privacyPolicy"]>;

// 各関数の結果はビルド時の静的生成に含まれ、cacheLife の revalidate の間隔で再検証される。
// expire を 5 分未満、stale を 30 秒未満、revalidate を 0 にすると静的生成から外れ、
// その部分はリクエストごとの描画になる。
// stale が 5 分未満の結果は静的生成には含まれるが、App Shell（遷移時に先に表示する共通部分）からは外れる。
// ショップ情報はルートレイアウトのメタデータに使うため、stale を 5 分にして App Shell に含める。
// 5 分未満にすると、/cart のように本文がすべて App Shell に入るページで
// メタデータだけが遅れることになり、Next.js がエラーにする。
async function fetchShopMetadata(): Promise<ShopMetadata> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(SHOP_METADATA_QUERY);
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  const shop = result.data?.shop;
  if (!shop) {
    throw new Error("Failed to fetch shop metadata from Shopify Storefront API: Invalid response format.");
  }
  return shop;
}

function getFallbackShopMetadata(): ShopMetadata | null {
  const name = process.env.PUBLIC_STORE_NAME?.trim();
  if (!name) return null;
  return {
    name,
    description: process.env.PUBLIC_STORE_DESCRIPTION?.trim() || null,
  };
}

// ショップ情報は全ページのレイアウトで使うため、取得に失敗しても環境変数の値で表示を続ける。
// 失敗した結果をキャッシュしないよう、フォールバックはキャッシュ関数の外で行う。
export async function getShopMetadata(): Promise<ShopMetadata> {
  try {
    return await fetchShopMetadata();
  } catch (error) {
    // Next.js が制御に使う内部エラーは握りつぶさない。
    unstable_rethrow(error);
    const fallback = getFallbackShopMetadata();
    if (!fallback) throw error;
    console.error("Failed to fetch shop metadata. Falling back to PUBLIC_STORE_NAME.", error);
    return fallback;
  }
}

export async function getHomeProducts(): Promise<ProductSummary[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const result = await createCatalogClient().graphql(HOME_PRODUCTS_QUERY);
  if (result.errors?.length) throw new Error(result.errors.map((error) => error.message).join("\n"));
  const nodes = result.data?.products?.nodes;
  if (!nodes) throw new Error("Missing home products in Shopify response.");
  return nodes;
}

// const CATALOG_PAGE_SIZE = 24;
const CATALOG_PAGE_SIZE = 8;

async function getCatalogIndexBatch(query?: string, after?: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const result = await createCatalogClient().graphql(CATALOG_INDEX_QUERY, { variables: { query, after } });
  if (result.errors?.length) throw new Error(result.errors.map((error) => error.message).join("\n"));
  const products = result.data?.products;
  if (!products) throw new Error("Missing catalog index in Shopify response.");
  return products;
}

export async function getProductPage({
  tag,
  after,
  before,
  pageSize = CATALOG_PAGE_SIZE,
}: {
  tag?: string;
  after?: string;
  before?: string;
  pageSize?: number;
}) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  // タグ全体を1つの検索値として渡す。空白、引用符、* などを検索演算子として扱わせない。
  const query = tag ? `tag:"${tag.replace(/[\\":()*]/g, "\\$&")}"` : undefined;
  // ProductConnection は総件数を返さない。カードの並びとページ数を同じ索引から決める。
  let batch = await getCatalogIndexBatch(query);
  const entries = [...batch.edges];
  while (batch.pageInfo.hasNextPage) {
    const cursor = batch.pageInfo.endCursor;
    if (!cursor) throw new Error("Missing catalog continuation cursor.");
    batch = await getCatalogIndexBatch(query, cursor);
    if (batch.pageInfo.endCursor === cursor) throw new Error("Shopify did not advance the catalog cursor.");
    entries.push(...batch.edges);
  }

  const cursor = before ?? after;
  const boundary = cursor ? entries.findIndex((entry) => entry.cursor === cursor) : 0;
  // 件数が変わった古いリンクでも、移動先の商品を含むページの先頭から表示する。
  const target = boundary + (before ? -1 : after ? 1 : 0);
  const hasPage = boundary >= 0 && target >= 0 && target < entries.length;
  const start = Math.floor(target / pageSize) * pageSize;
  const visible = hasPage ? entries.slice(start, start + pageSize) : [];
  const nodes: ProductSummary[] = [];
  if (visible.length) {
    const ids = visible.map(({ node }) => node.id);
    const result = await createCatalogClient().graphql(PRODUCT_CARDS_BY_ID_QUERY, { variables: { ids } });
    if (result.errors?.length) throw new Error(result.errors.map((error) => error.message).join("\n"));
    if (!result.data?.nodes) throw new Error("Missing product cards in Shopify response.");
    for (const node of result.data.nodes) {
      if (node?.__typename === "Product") nodes.push(node);
    }
  }
  return {
    nodes,
    pageInfo: {
      startCursor: visible.at(0)?.cursor ?? null,
      endCursor: visible.at(-1)?.cursor ?? null,
      hasPreviousPage: hasPage && start > 0,
      hasNextPage: hasPage && start + visible.length < entries.length,
    },
    pagination: hasPage ? { current: start / pageSize + 1, total: Math.ceil(entries.length / pageSize) } : undefined,
  };
}

export async function getCollectionPage(handle: string, after?: string, before?: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(COLLECTION_QUERY, {
    variables: {
      handle,
      ...(before ? { last: CATALOG_PAGE_SIZE, before } : { first: CATALOG_PAGE_SIZE, after }),
    },
  });
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }
  if (result.data?.collection === undefined) {
    throw new Error("Failed to fetch collection from Shopify Storefront API: Invalid response format.");
  }
  return result.data.collection;
}

export async function getProductCardByHandle(handle: string): Promise<ProductSummary | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(PRODUCT_CARD_QUERY, { variables: { handle } });
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }
  if (result.data?.product === undefined) {
    throw new Error("Failed to fetch product card from Shopify Storefront API: Invalid response format.");
  }
  return result.data.product;
}

export async function getProductByHandle(
  handle: string,
  selectedOptions: SelectedOption[] = [],
): Promise<ProductDetail | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(PRODUCT_QUERY, {
    // バリアントの再取得時は、ページに表示済みの関連商品を取り直さない。
    variables: { handle, selectedOptions, includeRelatedProducts: selectedOptions.length === 0 },
  });
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  // 正常な null（商品なし）だけを呼び出し側で notFound() に変換する。
  // 通信障害や不正なレスポンスを商品なしとしてキャッシュしない。
  if (!result.data || result.data.product === undefined) {
    throw new Error("Failed to fetch product from Shopify Storefront API: Invalid response format.");
  }
  return result.data.product;
}

// ビルド時に生成するページの上限。超えた分は最初のアクセスで生成される。
const STATIC_PAGE_COUNT = 50;

async function getCollectionListPage(after?: string) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(COLLECTION_LIST_QUERY, { variables: { first: STATIC_PAGE_COUNT, after } });
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  const collections = result.data?.collections;
  if (!collections?.pageInfo || !Array.isArray(collections.nodes)) {
    throw new Error("Failed to fetch collections from Shopify Storefront API: Invalid response format.");
  }
  return collections;
}

export async function getCollectionHandles() {
  const { nodes } = await getCollectionListPage();
  return nodes.map(({ handle }) => ({ handle }));
}

export async function getCollectionLinks() {
  let page = await getCollectionListPage();
  const links = [...page.nodes];
  while (page.pageInfo.hasNextPage) {
    const cursor = page.pageInfo.endCursor;
    if (!cursor) throw new Error("Shopify returned a collection page without a continuation cursor.");
    page = await getCollectionListPage(cursor);
    links.push(...page.nodes);
  }
  return links.filter(({ isCampaign }) => isCampaign?.value !== "true");
}

export async function getPageHandles(): Promise<string[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(PAGE_HANDLES_QUERY, {
    variables: { first: STATIC_PAGE_COUNT },
  });
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  const pages = result.data?.pages?.nodes;
  if (!Array.isArray(pages)) {
    throw new Error("Failed to fetch pages from Shopify Storefront API: Invalid response format.");
  }
  return pages.map((page) => page.handle);
}

export async function getPageByHandle(handle: string): Promise<ContentPage | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(PAGE_QUERY, {
    variables: { handle },
  });
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  // 正常な null（ページなし）だけを呼び出し側で notFound() に変換する。
  // 通信障害や不正なレスポンスをページなしとしてキャッシュしない。
  if (!result.data || result.data.page === undefined) {
    throw new Error("Failed to fetch page from Shopify Storefront API: Invalid response format.");
  }
  return result.data.page;
}

// 作成済みのポリシーを、フッターに並べる順で返す。
// フッターは全ページのレイアウトで使うため、ショップ情報と同じく stale を 5 分にして App Shell に含める。
export async function getShopPolicies(): Promise<ShopPolicy[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(SHOP_POLICIES_QUERY);
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  const shop = result.data?.shop;
  if (!shop) {
    throw new Error("Failed to fetch shop policies from Shopify Storefront API: Invalid response format.");
  }
  return [
    shop.termsOfService,
    shop.termsOfSale,
    shop.privacyPolicy,
    shop.refundPolicy,
    shop.shippingPolicy,
    shop.legalNotice,
    shop.contactInformation,
  ].filter((policy) => policy != null);
}

// フッターのリンク用。取得に失敗しても、リンクを出さずにページの表示を続ける。
// 失敗した結果をキャッシュしないよう、フォールバックはキャッシュ関数の外で行う。
export async function getShopPolicyLinks(): Promise<Pick<ShopPolicy, "handle" | "title">[]> {
  try {
    const policies = await getShopPolicies();
    return policies.map(({ handle, title }) => ({ handle, title }));
  } catch (error) {
    // Next.js が制御に使う内部エラーは握りつぶさない。
    unstable_rethrow(error);
    console.error("Failed to fetch shop policies.", error);
    return [];
  }
}
