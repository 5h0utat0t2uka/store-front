import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemCard } from "@/components/card/item";
import { Carousel } from "@/components/carousel";
import { getHomeProducts } from "@/lib/shopify";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Home",
  // canonical はレイアウトに置くと未指定の子ページへ継承されるため、ページごとに指定する。
  alternates: { canonical: "/" },
};

// sizes は画面幅が基準なので、main の左右余白（最大3.5rem）を含めて列幅を見積もる。
const PRODUCT_IMAGE_SIZES = "(min-width: 57.5rem) min(16rem, 25vw), (min-width: 43.5rem) 33vw, 50vw";

// 最大4列の先頭行に合わせ、先頭4枚は遅延しない。
const EAGER_PRODUCT_IMAGE_COUNT = 4;

async function Products() {
  // キャッシュした結果をビルド時に静的シェルへ含め、cacheLife の間隔で再検証する。
  const products = await getHomeProducts();
  if (products.length === 0) {
    return <p className={styles.message}>現在、掲載中の商品はありません。</p>;
  }

  return (
    // list-style: none による Safari のリスト認識の喪失を防ぐ。
    <ul className={styles.products} role="list">
      {products.map((product, index) => (
        <li key={product.id}>
          <ItemCard
            product={product}
            sizes={PRODUCT_IMAGE_SIZES}
            loading={index < EAGER_PRODUCT_IMAGE_COUNT ? "eager" : "lazy"}
          />
        </li>
      ))}
    </ul>
  );
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
        <h2>Products</h2>
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
