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

// page.module.css の列数・余白と item.module.css のカード内余白・枠線に合わせる。
const PRODUCT_IMAGE_SIZES = [
  "(width: 60rem) calc((min(100vw, 72rem) - clamp(2rem, 8vw, 6rem) - 2rem) / 3 - 3rem - 2px)",
  "(width: 40rem) calc((100vw - clamp(2rem, 8vw, 6rem) - 1rem) / 2 - 3rem - 2px)",
  "calc(100vw - clamp(2rem, 8vw, 6rem) - 3rem - 2px)",
].join(", ");

// 一覧は最大3列。先頭行のどの画像もLCPになり得るため、先頭3枚は遅延しない。
const EAGER_PRODUCT_IMAGE_COUNT = 3;

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
      <Carousel />
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
    </>
  );
}
