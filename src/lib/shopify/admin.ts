import "server-only";

type AdminToken = { value: string; expiresAt: number };
let cachedToken: AdminToken | undefined;
let pendingToken: Promise<AdminToken> | undefined;

async function issueToken(origin: string): Promise<AdminToken> {
  const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID;
  const secret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("Shopify Admin API credentials are missing.");

  const response = await fetch(`${origin}/admin/oauth/access_token`, {
    method: "POST",
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: secret }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Shopify token request failed (HTTP ${response.status}).`);
  const { access_token, expires_in } = await response.json();
  if (typeof access_token !== "string" || !access_token || typeof expires_in !== "number" || expires_in <= 0) {
    throw new Error("Invalid Shopify token response.");
  }
  return { value: access_token, expiresAt: Date.now() + expires_in * 1_000 };
}

async function getToken(origin: string) {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) return cachedToken.value;
  pendingToken ??= issueToken(origin).finally(() => {
    pendingToken = undefined;
  });
  cachedToken = await pendingToken;
  return cachedToken.value;
}

export async function adminGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const domain = process.env.PUBLIC_STORE_DOMAIN?.trim();
  if (!domain || !/^[a-z0-9-]+\.myshopify\.com$/i.test(domain)) throw new Error("Invalid Shopify store domain.");
  const origin = `https://${domain}`;
  const send = (token: string) =>
    fetch(`${origin}/admin/api/2026-10/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });

  const token = await getToken(origin);
  let response = await send(token);
  if (response.status === 401) {
    if (cachedToken?.value === token) cachedToken = undefined;
    response = await send(await getToken(origin));
  }
  if (!response.ok) throw new Error(`Shopify Admin API request failed (HTTP ${response.status}).`);
  const result: { data?: T; errors?: { extensions?: { code?: string } }[] } = await response.json();
  if (!result.data || result.errors?.length) {
    // エラーメッセージには顧客の入力値が含まれることがあるため、識別情報だけを記録する。
    const code = result.errors?.[0]?.extensions?.code ?? "no data";
    throw new Error(`Shopify Admin API error (${code}, request ${response.headers.get("x-request-id")}).`);
  }
  return result.data;
}
