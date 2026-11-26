import { notFound } from "next/navigation";
import type { getProductPage } from "@/lib/shopify";

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

type ListingLinkOptions = {
  page: Pick<CatalogPage, "pageInfo"> & { pagination?: CatalogPage["pagination"] };
  pathname: "/products" | `/collections/${string}`;
  tag?: string;
  after?: string;
  before?: string;
};

export function getListingLinks({ page: { pageInfo, pagination }, pathname, tag, after, before }: ListingLinkOptions) {
  const filter = tag ? { tag } : {};
  // 総ページ数を持たないコレクションでは、現在のカーソルから逆方向へ戻れる。
  const previous = (pageInfo.hasPreviousPage || (!pagination && after)) && pageInfo.startCursor;
  const next = (pageInfo.hasNextPage || (!pagination && before)) && pageInfo.endCursor;
  return {
    firstHref: { pathname, query: filter },
    previousHref: previous ? { pathname, query: { ...filter, before: previous } } : undefined,
    nextHref: next ? { pathname, query: { ...filter, after: next } } : undefined,
  };
}
