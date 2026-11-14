import type { Metadata } from "next";
import { io } from "next/cache";
import { Suspense } from "react";
import { ItemCard } from "@/components/card/item";
import { getHomeProducts } from "@/lib/shopify";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Home",
};

async function Products() {
  // ビルド時ではなく、実行環境のトークンを使って商品を取得する。
  await io();
  const products = await getHomeProducts();

  if (products.length === 0) {
    return <p className={styles.message}>現在、掲載中の商品はありません。</p>;
  }

  return (
    <ul className={styles.products}>
      {products.map((product, index) => (
        <li key={product.id}>
          <ItemCard product={product} prioritizeImage={index === 0} />
        </li>
      ))}
    </ul>
  );
}

export default function Home(props: PageProps<"/">) {
  return (
    <main className={styles.main}>
      <h1>Products</h1>
      <Suspense
        fallback={
          <p className={styles.message} role="status">
            商品を読み込んでいます…
          </p>
        }
      >
        <Products />
      </Suspense>
    </main>
  );
}
