import "server-only";
import { gql, type StorefrontApi } from "@shopify/hydrogen";
import { cacheLife } from "next/cache";
import { createCatalogClient } from "./shopify-client";

const SHOP_METADATA_QUERY = gql(`
  query ShopMetadata {
    shop {
      name
      description
    }
  }
`);

const HOME_PRODUCTS_QUERY = gql(`
  query HomeProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 6) {
      nodes {
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
`);

const PRODUCT_QUERY = gql(`
  query ProductDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      handle
      title
      description
      availableForSale
      vendor
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
`);

export type ProductSummary = StorefrontApi.ResultOf<
  typeof HOME_PRODUCTS_QUERY
>["products"]["nodes"][number];

export type ProductDetail = NonNullable<
  StorefrontApi.ResultOf<typeof PRODUCT_QUERY>["product"]
>;

// 各関数の結果はビルド時の静的生成に含まれ、cacheLife の revalidate の間隔で再検証される。
// expire を 5 分未満、stale を 30 秒未満、revalidate を 0 にすると静的生成から外れ、
// ensureStatic = "navigation" を設定した商品ページのビルドが失敗する。
export async function getShopMetadata() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3_600 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(SHOP_METADATA_QUERY);
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  const shop = result.data?.shop;
  if (!shop) {
    throw new Error(
      "Failed to fetch shop metadata from Shopify Storefront API: Invalid response format.",
    );
  }
  return shop;
}

export async function getHomeProducts(): Promise<ProductSummary[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(HOME_PRODUCTS_QUERY);
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  const products = result.data?.products?.nodes;
  if (!Array.isArray(products)) {
    throw new Error(
      "Failed to fetch products from Shopify Storefront API: Invalid response format.",
    );
  }
  return products;
}

export async function getProductByHandle(
  handle: string,
): Promise<ProductDetail | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const storefront = createCatalogClient();
  const result = await storefront.graphql(PRODUCT_QUERY, {
    variables: { handle },
  });
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  // 正常な null（商品なし）だけを呼び出し側で notFound() に変換する。
  // 通信障害や不正なレスポンスを商品なしとしてキャッシュしない。
  if (!result.data || result.data.product === undefined) {
    throw new Error(
      "Failed to fetch product from Shopify Storefront API: Invalid response format.",
    );
  }
  return result.data.product;
}
