import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { getCollectionLinks } from "@/lib/shopify";
import styles from "./page.module.css";

const TITLE = "Categories";

export function generateMetadata(_props: PageProps<"/collections">, parent: ResolvingMetadata): Promise<Metadata> {
  return createPageMetadata({ title: TITLE, url: "/collections" }, parent);
}

async function CollectionLinks() {
  const collections = await getCollectionLinks();
  if (!collections.length) return <p>現在、一覧に表示するコレクションはありません。</p>;

  return (
    <ul className={styles.list}>
      {collections.map(({ handle, title, image }) => (
        <li key={handle}>
          <Link href={`/collections/${encodeURIComponent(handle)}`}>
            {image && <Image src={image.url} alt="" width={80} height={80} />}
            <span>{title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function CollectionsPage() {
  return (
    <main className={styles.main}>
      <h1>{TITLE}</h1>
      <Suspense fallback={<p role="status">コレクションを読み込んでいます…</p>}>
        <CollectionLinks />
      </Suspense>
    </main>
  );
}
