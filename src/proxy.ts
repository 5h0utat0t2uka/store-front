import { createHash, timingSafeEqual } from "node:crypto";
import { handleShopifyRoutes } from "@shopify/hydrogen";
import { type NextRequest, NextResponse, type ProxyConfig } from "next/server";
import { cartHandlers } from "@/lib/shopify/cart-handlers";
import { createBuyerClient, createBuyerRequestContext } from "@/lib/shopify/client";
import { predictiveSearchHandlers } from "@/lib/shopify/search-handlers";

export const config: ProxyConfig = {
  matcher: [
    // Next.js のアセットと、画像拡張子で終わるパスを除外する（拡張子の大文字・小文字は区別しない）。
    "/((?!_next/static|_next/image|.*\\.(?:[wW][eE][bB][pP]|[aA]?[pP][nN][gG]|[jJ][pP][eE]?[gG]|[sS][vV][gG][zZ]?|[gG][iI][fF]|[aA][vV][iI][fF]|[iI][cC][oO]|[bB][mM][pP]|[tT][iI][fF][fF]?)$).*)",
  ],
};

const REALM = "Store Front";

// 長さの違いも含めて比較時間から内容を推測されないよう、ハッシュ同士を比較する。
function isEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function readCredentials(request: NextRequest): string | null {
  const [scheme, encoded] = request.headers.get("authorization")?.split(" ") ?? [];
  if (scheme?.toLowerCase() !== "basic" || !encoded) return null;
  return Buffer.from(encoded, "base64").toString("utf8");
}

// 認証を通過したリクエストのうち、/api/cart や /api/predictive-search など Hydrogen が担当する経路を先に処理する。
// 該当しない場合は null が返るので、通常のページへ進める。
function handleStorefront(request: NextRequest) {
  const requestContext = createBuyerRequestContext(request);
  const shopifyRoute = handleShopifyRoutes({
    request,
    requestContext,
    storefrontClient: createBuyerClient(requestContext),
    handlers: [cartHandlers, predictiveSearchHandlers],
  });
  if (shopifyRoute) return shopifyRoute;

  const response = NextResponse.next({
    request: { headers: requestContext.getForwardedRequestHeaders() },
  });
  requestContext.applyResponseHeaders(response.headers);
  return response;
}

export function proxy(request: NextRequest) {
  const username = process.env.CREDENTIAL_USERNAME;
  const password = process.env.CREDENTIAL_PASSWORD;
  if (!username || !password) {
    console.error("CREDENTIAL_USERNAME and CREDENTIAL_PASSWORD are required.");
    return new NextResponse("Authentication is not configured.", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const credentials = readCredentials(request);
  if (credentials && isEqual(credentials, `${username}:${password}`)) {
    // /__shopify/ などが Shopify に転送するヘッダーから、このサイト専用の認証情報を除く。
    request.headers.delete("authorization");
    return handleStorefront(request);
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });
}
