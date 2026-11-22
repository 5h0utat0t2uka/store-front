import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/card/grid";
import { Carousel } from "@/components/carousel";
import { getHomeProducts } from "@/lib/shopify";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Home",
  // canonical はレイアウトに置くと未指定の子ページへ継承されるため、ページごとに指定する。
  alternates: { canonical: "/" },
};

async function Products() {
  // キャッシュした結果をビルド時に静的シェルへ含め、cacheLife の間隔で再検証する。
  const products = await getHomeProducts();
  if (products.length === 0) {
    return <p className={styles.message}>現在、掲載中の商品はありません。</p>;
  }

  return <ProductGrid products={products} />;
}

export default function Home(_props: PageProps<"/">) {
  return (
    <>
      {/*<section>
        <hgroup>
          <h1>Shopify Online Store with Next.js</h1>
          <p>This is a Shopify Storefront application built with Next.js and Hydrogen.</p>
        </hgroup>
      </section>*/}
      <Carousel />
      <main className={styles.main}>
        <h2>New Arrivals</h2>
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
    </>
  );
}
