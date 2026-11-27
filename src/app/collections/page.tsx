import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShopifyImage } from "@/components/image/shopify";
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
        <li key={handle} className={styles.item}>
          <Link href={`/collections/${encodeURIComponent(handle)}`} className={styles.link}>
            {image && <ShopifyImage src={image.url} alt="" width={80} height={80} loading="lazy" sizes="auto" />}
            <h2>{title}</h2>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Skelton() {
  return (
    <ul className={styles.skelton}>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className={styles.item}>
          <div></div>
          <p></p>
        </li>
      ))}
    </ul>
  );
}

export default function CollectionsPage() {
  return (
    <main className={styles.main}>
      <h1>{TITLE}</h1>
      <Suspense fallback={<Skelton />}>
        <CollectionLinks />
      </Suspense>
    </main>
  );
}
