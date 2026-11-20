import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/card/grid";
import { createPageMetadata } from "@/lib/metadata";
import { getProductPage } from "@/lib/shopify";
import styles from "./page.module.css";

type ProductsProps = PageProps<"/products">;

// タグとカーソルはそれぞれ単一の値として扱う。
function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) || undefined;
}

function readListing(params: Awaited<ProductsProps["searchParams"]>) {
  const tag = firstParam(params.tag);
  const after = firstParam(params.after);
  const before = firstParam(params.before);
  if (after && before) notFound();

  // return { tag, after, before, title: tag ? `「${tag}」一覧` : "商品一覧" };
  return { tag, after, before, title: tag ? `「${tag}」` : "Products" };
}

export async function generateMetadata({ searchParams }: ProductsProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { tag, after, before, title } = readListing(await searchParams);
  const query = new URLSearchParams();
  if (tag) query.set("tag", tag);
  if (after) query.set("after", after);
  if (before) query.set("before", before);
  const url = query.size ? `/products?${query}` : "/products";
  const description = tag ? `「${tag}」タグが付いた商品を掲載しています。` : undefined;
  return createPageMetadata({ title, description, url }, parent);
}

async function ProductResults({ searchParams }: Pick<ProductsProps, "searchParams">) {
  const { tag, after, before, title } = readListing(await searchParams);
  const { nodes, pageInfo } = await getProductPage({ tag, after, before });
  const filter = tag ? { tag } : {};
  const previous = (after || pageInfo.hasPreviousPage) && pageInfo.startCursor;
  const next = (before || pageInfo.hasNextPage) && pageInfo.endCursor;

  return (
    <>
      <h1>{title}</h1>
      {nodes.length > 0 ? (
        <ProductGrid products={nodes} heading="h2" />
      ) : (
        <p>{after || before ? "このページには商品がありません。" : "該当する商品はありません。"}</p>
      )}
      {(previous || next) && (
        <nav className={styles.pagination} aria-label="商品一覧のページ送り">
          {previous && <Link href={{ pathname: "/products", query: { ...filter, before: previous } }}>前のページ</Link>}
          {next && <Link href={{ pathname: "/products", query: { ...filter, after: next } }}>次のページ</Link>}
        </nav>
      )}
      {nodes.length === 0 && (after || before) && (
        <Link href={{ pathname: "/products", query: filter }}>最初のページへ</Link>
      )}
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
