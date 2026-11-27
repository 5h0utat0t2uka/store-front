import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/card/grid";
import { getHomeProducts } from "@/lib/shopify";
import { getInformationEntries } from "@/lib/shopify/information";
import { HomeCarousel } from "./_components/home-carousel";
import { features } from "./features/_data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Home",
  // canonical はレイアウトに置くと未指定の子ページへ継承されるため、ページごとに指定する。
  alternates: { canonical: "/" },
};

async function Information() {
  const entries = await getInformationEntries();
  if (!entries.length) return null;

  return (
    <section data-section="information">
      <h2>Information</h2>
      <div>
        <ul className={styles.list}>
          {entries.map(({ id, publishedAt, displayDate, title, summary, pageHandle }) => (
            <li key={id} className={styles.item}>
              <time dateTime={publishedAt}>{displayDate}</time>
              <div>
                <h3>{pageHandle ? <Link href={`/pages/${encodeURIComponent(pageHandle)}`}>{title}</Link> : title}</h3>
                <p>{summary}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

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
      <HomeCarousel />

      <main className={styles.main}>
        <Suspense fallback={null}>
          <Information />
        </Suspense>
        <section data-section="features">
          <h2>Features</h2>
          <ul className={styles.cards}>
            {features.slice(0, 3).map(({ date, title, href, image }) => (
              <li key={href} className={styles.card}>
                <div className={styles.frame}>
                  <Image {...image} alt="" sizes="auto" loading="lazy" />
                </div>
                <div className={styles.meta}>
                  <time dateTime={date}>{date}</time>
                  <h3 className={styles.title}>
                    <Link href={href} className={styles.link}>
                      {title}
                    </Link>
                  </h3>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/features" className={styles.link} aria-label="View all features">
            View All
          </Link>
        </section>

        <section data-section="products">
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
          <Link href={"/products"} className={styles.link}>
            View All
          </Link>
        </section>

        {/*<section data-section="newsletter">
          <Image src="/bg.webp" width={1600} height={1067} alt="" unoptimized loading="lazy" />
          <div className={styles.form}>
            <h2>Newsletter</h2>
            <p>Subscribe to our weekly newsletter for updates on our latest products.</p>
            <NewsletterForm />
          </div>
        </section>*/}
      </main>
    </>
  );
}
