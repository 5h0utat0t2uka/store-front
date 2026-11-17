import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Content } from "@/components/content";
import { getShopPolicies } from "@/lib/shopify";
import { parseHandle } from "@/lib/shopify/handle";

// ビルド時に 1 件も生成できないとビルドが失敗するため、ポリシーが 0 件のときに使う。
// このハンドルのポリシーは存在しないので、404 のページとして生成される。
const PLACEHOLDER_HANDLE = "__placeholder__";

// Shopify の管理画面（設定 → ポリシー）で作成したポリシーを、標準と同じ /policies/:handle で表示する。
// 作成済みのポリシーはすべてビルド時に生成する。
export async function generateStaticParams() {
  const policies = await getShopPolicies();
  if (policies.length === 0) return [{ handle: PLACEHOLDER_HANDLE }];
  return policies.map((policy) => ({ handle: policy.handle }));
}

// ポリシーは種類が決まっているため 1 回の問い合わせでまとめて取得し、その中から探す。
async function getPolicy(params: PageProps<"/policies/[handle]">["params"]) {
  const handle = parseHandle((await params).handle);
  if (!handle) notFound();
  const policies = await getShopPolicies();
  const policy = policies.find((item) => item.handle === handle);
  if (!policy) notFound();
  return policy;
}

export async function generateMetadata({ params }: PageProps<"/policies/[handle]">): Promise<Metadata> {
  const policy = await getPolicy(params);

  return {
    title: policy.title,
    alternates: {
      canonical: `/policies/${encodeURIComponent(policy.handle)}`,
    },
  };
}

export default async function PolicyPage({ params }: PageProps<"/policies/[handle]">) {
  const policy = await getPolicy(params);
  return <Content title={policy.title} html={policy.body} />;
}
