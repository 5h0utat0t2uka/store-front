import "server-only";
import {
  createShopifyRequestContext,
  createStorefrontClient,
} from "@shopify/hydrogen";

export function createCatalogClient() {
  const storeDomain = process.env.PUBLIC_STORE_DOMAIN?.trim();
  if (!storeDomain) {
    throw new Error("PUBLIC_STORE_DOMAIN required in environment variables.");
  }
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
      storeDomain: storeDomain,
      apiVersion: "2026-10",
      privateStorefrontToken: token,
      defaultTimeoutInMs: 15_000,
      // 非公開トークンを別のURLへ転送しない。
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, redirect: "error" }),
    },
  });
}
