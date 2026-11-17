import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Content } from "@/components/content";
import { getPageByHandle, getPageHandles } from "@/lib/shopify";
import { parseHandle } from "@/lib/shopify/handle";

// ビルド時に 1 件も生成できないとビルドが失敗するため、ページが 0 件のときに使う。
// このハンドルのページは存在しないので、404 のページとして生成される。
const PLACEHOLDER_HANDLE = "__placeholder__";

// Shopify のオンラインストアの「ページ」を、標準と同じ /pages/:handle で表示する。
// 公開中のページをビルド時に生成する。あとから追加したページは、最初のアクセスでは
// loading.tsx を先に返して内容をストリームで届け、裏で生成が終わった後は静的に配信される。
export async function generateStaticParams() {
  const handles = await getPageHandles();
  if (handles.length === 0) return [{ handle: PLACEHOLDER_HANDLE }];
  return handles.map((handle) => ({ handle }));
}

async function getPage(params: PageProps<"/pages/[handle]">["params"]) {
  const handle = parseHandle((await params).handle);
  if (!handle) notFound();
  const page = await getPageByHandle(handle);
  if (!page) notFound();
  return page;
}

export async function generateMetadata({ params }: PageProps<"/pages/[handle]">): Promise<Metadata> {
  const page = await getPage(params);

  return {
    title: page.seo?.title?.trim() || page.title,
    description: page.seo?.description?.trim() || page.bodySummary.trim().slice(0, 160) || undefined,
    alternates: { canonical: `/pages/${encodeURIComponent(page.handle)}` },
  };
}

export default async function ContentPage({ params }: PageProps<"/pages/[handle]">) {
  const page = await getPage(params);
  return <Content title={page.title} html={page.body} />;
}
