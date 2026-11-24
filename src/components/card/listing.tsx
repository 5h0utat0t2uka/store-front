import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/pagination";
import type { getProductPage } from "@/lib/shopify";
import { ProductGrid } from "./grid";

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

type CatalogPage = Awaited<ReturnType<typeof getProductPage>>;

type ListingProps = {
  page: Pick<CatalogPage, "nodes" | "pageInfo"> & { pagination?: CatalogPage["pagination"] };
  pathname: "/products" | `/collections/${string}`;
  tag?: string;
  after?: string;
  before?: string;
  prioritizeFirstRow?: boolean;
};

export function PaginatedProducts({
  page: { nodes, pageInfo, pagination },
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
  const previous = (pageInfo.hasPreviousPage || (!pagination && after)) && pageInfo.startCursor;
  const next = (pageInfo.hasNextPage || (!pagination && before)) && pageInfo.endCursor;
  return (
    <>
      <ProductGrid products={nodes} heading="h2" prioritizeFirstRow={prioritizeFirstRow} />
      <Pagination
        label="商品一覧のページ送り"
        page={pagination}
        previousHref={previous ? { pathname, query: { ...filter, before: previous } } : undefined}
        nextHref={next ? { pathname, query: { ...filter, after: next } } : undefined}
      />
    </>
  );
}
