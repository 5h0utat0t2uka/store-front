import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ProductGrid } from "@/components/card/grid";
import { createPageMetadata } from "@/lib/metadata";
import { getProductCardByHandle } from "@/lib/shopify";
import { getFeatureByHref } from "../_data";
import styles from "./page.module.css";

const pathname = "/features/2026-11-23";
const feature = getFeatureByHref(pathname);

export function generateMetadata(_props: PageProps<typeof pathname>, parent: ResolvingMetadata): Promise<Metadata> {
  return createPageMetadata({ title: feature.title, url: feature.href }, parent);
}

async function FeaturedProduct() {
  const product = await getProductCardByHandle("essential-long-sleeve-t-shirt");
  if (!product) return null;

  return (
    <section className={styles.product}>
      <h2>掲載商品</h2>
      <ProductGrid products={[product]} prioritizeFirstRow={false} />
    </section>
  );
}

export default function Page() {
  return (
    <main>
      <header className={styles.header}>
        <h1>{feature.title}</h1>
        <Image
          src={feature.image.src}
          alt=""
          width={feature.image.width}
          height={feature.image.height}
          loading="eager"
        />
      </header>
      <Suspense fallback={null}>
        <FeaturedProduct />
      </Suspense>
    </main>
  );
}
