import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PaginatedProducts, readListingParams } from "@/components/card/listing";
import { createPageMetadata } from "@/lib/metadata";
import { getProductPage } from "@/lib/shopify";
import styles from "@/components/card/listing.module.css";

type ProductsProps = PageProps<"/products">;

export async function generateMetadata({ searchParams }: ProductsProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { tag, after, before } = readListingParams(await searchParams);
  const title = tag ? `「${tag}」` : "All Products";
  const query = new URLSearchParams();
  if (tag) query.set("tag", tag);
  if (after) query.set("after", after);
  if (before) query.set("before", before);
  const url = query.size ? `/products?${query}` : "/products";
  const description = tag ? `「${tag}」タグが付いた商品を掲載しています。` : undefined;
  return createPageMetadata({ title, description, url }, parent);
}

async function ProductResults({ searchParams }: Pick<ProductsProps, "searchParams">) {
  const { tag, after, before } = readListingParams(await searchParams);
  const page = await getProductPage({ tag, after, before });

  return (
    <>
      <h1>{tag ? `${tag}` : "All Products"}</h1>
      <PaginatedProducts page={page} pathname="/products" tag={tag} after={after} before={before} />
      {tag && <Link href="/products">すべての商品を見る</Link>}
    </>
  );
}

export default function ProductsPage({ searchParams }: ProductsProps) {
  return (
    <main className={styles.main}>
      <Suspense fallback={<p role="status">商品を読み込んでいます…</p>}>
        <ProductResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
