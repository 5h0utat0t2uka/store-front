import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { features } from "./_data";
import styles from "./page.module.css";

type FeaturesProps = PageProps<"/features">;

const PAGE_SIZE = 3;
const PAGE_COUNT = Math.max(1, Math.ceil(features.length / PAGE_SIZE));

async function getPageNumber(searchParams: FeaturesProps["searchParams"]) {
  const { page = "1" } = await searchParams;
  if (typeof page !== "string" || !/^[1-9]\d*$/.test(page)) notFound();
  const number = Number(page);
  if (number > PAGE_COUNT) notFound();
  return number;
}

function getPageUrl(page: number) {
  return page === 1 ? "/features" : (`/features?page=${page}` as const);
}

export async function generateMetadata({ searchParams }: FeaturesProps, parent: ResolvingMetadata): Promise<Metadata> {
  const page = await getPageNumber(searchParams);
  const title = page === 1 ? "Features" : `Features（${page}ページ目）`;
  return createPageMetadata({ title, url: getPageUrl(page) }, parent);
}

async function FeatureResults({ searchParams }: Pick<FeaturesProps, "searchParams">) {
  const page = await getPageNumber(searchParams);
  const start = (page - 1) * PAGE_SIZE;
  return (
    <>
      <ul className={styles.entries}>
        {features.slice(start, start + PAGE_SIZE).map(({ date, title, href, image }, index) => (
          <li key={href} className={styles.entry}>
            <Image {...image} alt="" unoptimized loading={index === 0 ? "eager" : "lazy"} />
            <time dateTime={date}>{date}</time>
            <h2>
              <Link href={href}>{title}</Link>
            </h2>
          </li>
        ))}
      </ul>
      {PAGE_COUNT > 1 && (
        <nav className={styles.pagination} aria-label="特集一覧のページ送り">
          {page > 1 && <Link href={getPageUrl(page - 1)}>前のページ</Link>}
          <span aria-current="page">
            {page} / {PAGE_COUNT}
          </span>
          {page < PAGE_COUNT && <Link href={getPageUrl(page + 1)}>次のページ</Link>}
        </nav>
      )}
    </>
  );
}

export default function FeaturesPage({ searchParams }: FeaturesProps) {
  return (
    <main>
      <h1>Features</h1>
      <Suspense fallback={<p role="status">特集を読み込んでいます…</p>}>
        <FeatureResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
