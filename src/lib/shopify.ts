import "server-only";
import { gql, type StorefrontApi } from "@shopify/hydrogen";
import { cacheLife } from "next/cache";
import { unstable_rethrow } from "next/navigation";
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

// requiresSellingPlan から adjacentVariants までは、Hydrogen の商品フォーム
// （バリアントの解決とカートへの追加）が使う。バリアントの項目は 3 か所で同じ内容にそろえる。
const PRODUCT_QUERY = gql(`
  query ProductDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      description
      availableForSale
      vendor
      requiresSellingPlan
      encodedVariantExistence
      encodedVariantAvailability
      options {
        name
        optionValues {
          name
          firstSelectableVariant {
            id
            title
            availableForSale
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            product {
              handle
              title
            }
            sku
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
      selectedOrFirstAvailableVariant {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        product {
          handle
          title
        }
        sku
        image {
          url
          altText
          width
          height
        }
      }
      adjacentVariants {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        product {
          handle
          title
        }
        sku
        image {
          url
          altText
          width
          height
        }
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
`);

export type ProductSummary = StorefrontApi.ResultOf<
  typeof HOME_PRODUCTS_QUERY
>["products"]["nodes"][number];

export type ShopMetadata = {
  name: string;
  description?: string | null;
};

export type ProductDetail = NonNullable<
  StorefrontApi.ResultOf<typeof PRODUCT_QUERY>["product"]
>;

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
    throw new Error(
      "Failed to fetch shop metadata from Shopify Storefront API: Invalid response format.",
    );
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
    console.error(
      "Failed to fetch shop metadata. Falling back to PUBLIC_STORE_NAME.",
      error,
    );
    return fallback;
  }
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
