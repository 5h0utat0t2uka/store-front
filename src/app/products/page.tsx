import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/card/grid";
import { Pagination } from "@/components/pagination";
import { Skelton } from "@/components/skelton";
import { createPageMetadata } from "@/lib/metadata";
import { getProductPage } from "@/lib/shopify";
import { getListingLinks, readListingParams } from "@/lib/shopify/listing";
import styles from "./page.module.css";

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
  const { firstHref, previousHref, nextHref } = getListingLinks({ pathname: "/products", page, tag, after, before });

  return (
    <main className={styles.main}>
      <h1>{tag ? `${tag}` : "All Products"}</h1>
      {page.nodes.length > 0 ? (
        <>
          <ProductGrid products={page.nodes} heading="h2" />
          <Pagination
            label="商品一覧のページ送り"
            page={page.pagination}
            previousHref={previousHref}
            nextHref={nextHref}
          />
        </>
      ) : (
        <>
          <p>{after || before ? "このページには商品がありません。" : "該当する商品はありません。"}</p>
          {(after || before) && <Link href={firstHref}>最初のページへ</Link>}
        </>
      )}
      {tag && (
        <Link href="/products" className={styles.link}>
          All Products
        </Link>
      )}
    </main>
  );
}

export default function ProductsPage({ searchParams }: ProductsProps) {
  return (
    <Suspense fallback={<Skelton />}>
      <ProductResults searchParams={searchParams} />
    </Suspense>
  );
  // return (
  //   <main className={styles.main}>
  //     <Suspense fallback={<p role="status">商品を読み込んでいます…</p>}>
  //       <ProductResults searchParams={searchParams} />
  //     </Suspense>
  //   </main>
  // );
}
