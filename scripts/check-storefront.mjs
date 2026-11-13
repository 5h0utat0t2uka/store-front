const storeDomain = "store-front-9clxicd4.myshopify.com";
const apiVersion = "2026-10";

const query = `
  query CheckStorefront {
    shop {
      name
    }
    products(first: 3) {
      nodes {
        id
        title
        handle
        availableForSale
        featuredImage {
          url
          altText
          width
          height
        }
      }
    }
  }
`;

try {
  const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim();

  if (!token) {
    throw new Error("SHOPIFY_STOREFRONT_PRIVATE_TOKEN が設定されていません。");
  }

  const response = await fetch(
    `https://${storeDomain}/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Shopify-Storefront-Private-Token": token,
      },
      body: JSON.stringify({ query }),
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Storefront API が HTTP ${response.status} を返しました。`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  if (
    !result.data?.shop?.name ||
    !Array.isArray(result.data?.products?.nodes)
  ) {
    throw new Error(
      "Storefront API から想定した形式のデータが返りませんでした。",
    );
  }

  console.log(JSON.stringify(result.data, null, 2));

  if (result.data.products.nodes.length === 0) {
    console.warn(
      "接続は成功しましたが、取得できる商品がありません。商品のステータスと Headless 販売チャネルへの公開設定を確認してください。",
    );
  }
} catch (error) {
  console.error(
    "Storefront API の接続確認に失敗しました:",
    error instanceof Error ? error.message : "不明なエラー",
  );
  process.exitCode = 1;
}
