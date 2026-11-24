import type { Metadata, ResolvingMetadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/card/grid";
import { createPageMetadata } from "@/lib/metadata";
import { getProductCardByHandle } from "@/lib/shopify";
import Header from "../_components/header";
import { getFeatureByHref } from "../_data";
import styles from "./page.module.css";

const pathname = "/features/2026-11-23";
const feature = getFeatureByHref(pathname);
const relatedFeatures = feature.related.map((href) => getFeatureByHref(href));
console.log(relatedFeatures);

export function generateMetadata(_props: PageProps<typeof pathname>, parent: ResolvingMetadata): Promise<Metadata> {
  return createPageMetadata({ title: feature.title, url: feature.href }, parent);
}

async function FeaturedProduct() {
  const product = await getProductCardByHandle("essential-long-sleeve-t-shirt");
  if (!product) return null;

  return (
    <section className={styles.product}>
      <h2>Products</h2>
      <ProductGrid products={[product]} prioritizeFirstRow={false} />
    </section>
  );
}

export default function Page() {
  return (
    <main>
      <Header feature={feature} />
      <Suspense fallback={null}>
        <p>このページはNext.jsで自由に作成できる非CMS管理のLPで、商品データをShopifyから取得・掲載が可能です。</p>
        <FeaturedProduct />
      </Suspense>
      {/*{relatedFeatures.length > 0 && (
        <section className={styles.related}>
          <h2>Related Features</h2>
          <ul className={styles.entries}>
            {relatedFeatures.map(({ date, title, href, image }) => (
              <li key={href} className={styles.entry}>
                <Image {...image} alt="" unoptimized loading="lazy" />
                <time dateTime={date}>{date}</time>
                <h3>
                  <Link href={href}>{title}</Link>
                </h3>
              </li>
            ))}
          </ul>
        </section>
      )}*/}
    </main>
  );
}
