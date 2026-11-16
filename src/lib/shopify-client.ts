import "server-only";
import {
  createShopifyRequestContext,
  createStorefrontClient,
} from "@shopify/hydrogen";

const I18N = { country: "JP", language: "JA" } as const;

function readConfig() {
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
  return {
    storeDomain,
    apiVersion: "2026-10",
    privateStorefrontToken: token,
    defaultTimeoutInMs: 15_000,
    // 非公開トークンを別のURLへ転送しない。
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, redirect: "error" }),
  };
}

export function createCatalogClient() {
  // 全訪問者に共通の情報だけを取得し、購入者のヘッダーを共有キャッシュに持ち込まない。
  const requestContext = createShopifyRequestContext({
    request: { headers: new Headers() },
    i18n: I18N,
  });
  return createStorefrontClient({
    type: "private_no_buyer_context",
    requestContext,
    config: readConfig(),
  });
}

// Vercel は x-forwarded-for を接続元の IP で上書きするため、先頭の値を購入者の IP として扱う。
// ヘッダーがない環境（プロキシを挟まないローカル実行など）ではループバックを使う。
function readBuyerIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
}

type BuyerRequest = Parameters<
  typeof createShopifyRequestContext
>[0]["request"];

// カートなど購入者ごとの操作に使う。リクエストの Cookie と IP を Storefront API に渡すため、
// 結果をキャッシュする処理では使わない。
export function createBuyerRequestContext(request: BuyerRequest) {
  return createShopifyRequestContext({
    request,
    i18n: I18N,
    buyerIp: readBuyerIp(request.headers),
  });
}

export function createBuyerClient(
  requestContext: ReturnType<typeof createBuyerRequestContext>,
) {
  return createStorefrontClient({
    type: "private",
    requestContext,
    config: readConfig(),
  });
}
