import "server-only";
import { cacheLife } from "next/cache";

type ProductSummary = {
  id: string;
  title: string;
  availableForSale: boolean;
  featuredImage: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
};

type ProductsResponse = {
  data?: { products: { nodes: ProductSummary[] } };
  errors?: { message: string }[];
};

const endpoint =
  "https://store-front-9clxicd4.myshopify.com/api/2026-10/graphql.json";

export async function getHomeProducts(): Promise<ProductSummary[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim();
  if (!token) {
    throw new Error("SHOPIFY_STOREFRONT_PRIVATE_TOKEN が設定されていません。");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shopify-Storefront-Private-Token": token,
    },
    body: JSON.stringify({
      query: `
        query HomeProducts {
          products(first: 6) {
            nodes {
              id
              title
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
      `,
    }),
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Storefront API が HTTP ${response.status} を返しました。`);
  }

  const result: ProductsResponse = await response.json();
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  }

  const products = result.data?.products?.nodes;
  if (!Array.isArray(products)) {
    throw new Error("Storefront API から商品データが返りませんでした。");
  }
  return products;
}
