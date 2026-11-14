import "server-only";
import {
  createShopifyRequestContext,
  createStorefrontClient,
  gql,
  type StorefrontApi,
} from "@shopify/hydrogen";
import { cacheLife } from "next/cache";

const SHOP_METADATA_QUERY = gql(`
  query ShopMetadata {
    shop {
      name
      description
    }
  }
`);

const HOME_PRODUCTS_QUERY = gql(`
  query HomeProducts {
    products(first: 6) {
      nodes {
        id
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

export type ProductSummary = StorefrontApi.ResultOf<
  typeof HOME_PRODUCTS_QUERY
>["products"]["nodes"][number];

function createCatalogClient() {
  const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "SHOPIFY_STOREFRONT_PRIVATE_TOKEN required in environment variables.",
    );
  }

  // 全訪問者に共通の情報だけを取得し、購入者のヘッダーを共有キャッシュに持ち込まない。
  const requestContext = createShopifyRequestContext({
    request: { headers: new Headers() },
    i18n: { country: "JP", language: "JA" },
  });
  return createStorefrontClient({
    type: "private_no_buyer_context",
    requestContext,
    config: {
      storeDomain: "store-front-9clxicd4.myshopify.com",
      apiVersion: "2026-10",
      privateStorefrontToken: token,
      defaultTimeoutInMs: 15_000,
      // 非公開トークンを別のURLへ転送しない。
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, redirect: "error" }),
    },
  });
}

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
