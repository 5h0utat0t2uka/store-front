"use client";

import Link from "next/link";
import { useState } from "react";

type ItemLinkProps = {
  handle: string;
  className?: string;
  children: React.ReactNode;
};

// 一覧に並ぶ全カードで商品ごとの内容を先読みすると、カードの数だけ要求が発生する。
// 表示時は全商品で共通の App Shell だけを取得し、ホバーやフォーカスで
// 遷移の意図が見えた商品だけ、その商品の内容まで先読みする。
export function ItemLink({ handle, className, children }: ItemLinkProps) {
  const [hasIntent, setHasIntent] = useState(false);

  return (
    <Link
      className={className}
      href={`/products/${encodeURIComponent(handle)}`}
      prefetch={hasIntent ? true : "auto"}
      onPointerEnter={() => setHasIntent(true)}
      onFocus={() => setHasIntent(true)}
    >
      {children}
    </Link>
  );
}
