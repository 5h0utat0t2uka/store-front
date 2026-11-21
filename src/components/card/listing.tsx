import Link from "next/link";
import { notFound } from "next/navigation";
import type { getProductPage } from "@/lib/shopify";
import { ProductGrid } from "./grid";
import styles from "./listing.module.css";

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) || undefined;
}

// Shopify のページ送りでは、前後どちらか一方のカーソルだけを指定する。
export function readListingParams(params: Record<string, string | string[] | undefined>) {
  const after = firstParam(params.after);
  const before = firstParam(params.before);
  if (after && before) notFound();
  return { tag: firstParam(params.tag), after, before };
}

type ListingProps = {
  page: Awaited<ReturnType<typeof getProductPage>>;
  pathname: "/products" | `/collections/${string}`;
  tag?: string;
  after?: string;
  before?: string;
  prioritizeFirstRow?: boolean;
};

export function PaginatedProducts({
  page: { nodes, pageInfo },
  pathname,
  tag,
  after,
  before,
  prioritizeFirstRow,
}: ListingProps) {
  const filter = tag ? { tag } : {};
  if (nodes.length === 0) {
    return after || before ? (
      <>
        <p>このページには商品がありません。</p>
        <Link href={{ pathname, query: filter }}>最初のページへ</Link>
      </>
    ) : (
      <p>該当する商品はありません。</p>
    );
  }
  const previous = (after || pageInfo.hasPreviousPage) && pageInfo.startCursor;
  const next = (before || pageInfo.hasNextPage) && pageInfo.endCursor;
  return (
    <>
      <ProductGrid products={nodes} heading="h2" prioritizeFirstRow={prioritizeFirstRow} />
      {(previous || next) && (
        <nav className={styles.pagination} aria-label="商品一覧のページ送り">
          {previous && <Link href={{ pathname, query: { ...filter, before: previous } }}>前のページ</Link>}
          {next && <Link href={{ pathname, query: { ...filter, after: next } }}>次のページ</Link>}
        </nav>
      )}
    </>
  );
}
