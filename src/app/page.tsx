import { io } from "next/cache";
import Image from "next/image";
import { Suspense } from "react";
import { getHomeProducts } from "@/lib/shopify";
import styles from "./page.module.css";

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
        <li className={styles.product} key={product.id}>
          <div className={styles.imageFrame}>
            {product.featuredImage ? (
              <Image
                className={styles.image}
                src={product.featuredImage.url}
                alt={product.featuredImage.altText?.trim() || product.title}
                // width={product.featuredImage.width}
                // height={product.featuredImage.height}
                fill
                sizes="(min-width: 1152px) 384px, (max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            ) : (
              <span className={styles.noImage}>画像なし</span>
            )}
          </div>
          <h2>{product.title}</h2>
          <p className={styles.availability}>
            {product.availableForSale ? "販売中" : "現在購入できません"}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.brand}>store-front</p>
        <h1>商品</h1>
      </header>
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
