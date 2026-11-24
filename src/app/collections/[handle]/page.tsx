import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PaginatedProducts, readListingParams } from "@/components/card/listing";
import { ContentBody } from "@/components/content";
import { createPageMetadata } from "@/lib/metadata";
import { getCollectionHandles, getCollectionPage } from "@/lib/shopify";
import { parseHandle } from "@/lib/shopify/handle";
import { MAIN_WIDTH } from "@/styles/image-sizes";
import styles from "@/components/card/listing.module.css";

type CollectionProps = PageProps<"/collections/[handle]">;

// Cache Components では generateStaticParams が空配列を返せない。公開件数が 0 のときだけ使う。
const PLACEHOLDER_HANDLE = "__placeholder__";

export async function generateStaticParams() {
  const handles = await getCollectionHandles();
  return handles.length > 0 ? handles : [{ handle: PLACEHOLDER_HANDLE }];
}

async function readCollection({ params, searchParams }: CollectionProps) {
  const handle = parseHandle((await params).handle);
  if (!handle || handle === PLACEHOLDER_HANDLE) notFound();
  const { after, before } = readListingParams(await searchParams);
  const collection = await getCollectionPage(handle, after, before);
  if (!collection) notFound();
  const pathname = `/collections/${encodeURIComponent(collection.handle)}` as const;
  return { collection, pathname, after, before };
}

export async function generateMetadata(props: CollectionProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { collection, pathname, after, before } = await readCollection(props);
  const query = new URLSearchParams();
  if (after) query.set("after", after);
  if (before) query.set("before", before);
  const url = query.size ? `${pathname}?${query}` : pathname;
  const title = collection.seo.title?.trim() || collection.title;
  const description = collection.seo.description?.trim() || collection.description.trim().slice(0, 160) || undefined;
  const image = collection.image;
  const images = image ? [{ url: image.url, alt: image.altText?.trim() || collection.title }] : undefined;
  return createPageMetadata({ title, description, url, images }, parent);
}

async function CampaignHero(props: CollectionProps) {
  const { collection } = await readCollection(props);
  if (collection.isCampaign?.value !== "true") return null;
  const heroImage = collection.image;
  if (!heroImage) return null;
  return (
    <div className={styles.hero}>
      <Image
        className={styles.collectionImage}
        src={heroImage.url}
        alt={heroImage.altText?.trim() ?? ""}
        fill
        sizes={MAIN_WIDTH}
        loading="eager"
        fetchPriority="high"
      />
      <hgroup className={styles.heroContent}>
        <h1>{collection.title}</h1>
        {collection.descriptionHtml && <ContentBody html={collection.descriptionHtml} />}
      </hgroup>
    </div>
  );
}

async function CollectionResults(props: CollectionProps) {
  const { collection, pathname, after, before } = await readCollection(props);
  const isCampaign = collection.isCampaign?.value === "true";
  const heroImage = isCampaign ? collection.image : null;
  return (
    <>
      {/*{isCampaign ? (
        <header className={styles.hero}>
          {heroImage && (
            <Image
              className={styles.collectionImage}
              src={heroImage.url}
              alt={heroImage.altText?.trim() ?? ""}
              fill
              sizes={MAIN_WIDTH}
              loading="eager"
              fetchPriority="high"
            />
          )}
          <div className={styles.heroContent}>
            <h1>{collection.title}</h1>
            {collection.descriptionHtml && <ContentBody html={collection.descriptionHtml} />}
          </div>
        </header>
      ) : (
        <h1>{collection.title}</h1>
      )}*/}
      {!isCampaign && <h1>{collection.title}</h1>}
      {isCampaign && <h2>Collection Items</h2>}
      <PaginatedProducts
        page={collection.products}
        pathname={pathname}
        after={after}
        before={before}
        prioritizeFirstRow={!heroImage}
      />
      <Link href="/products">All Products</Link>
    </>
  );
}

export default function CollectionPage(props: CollectionProps) {
  return (
    <>
      <Suspense fallback={null}>
        <CampaignHero {...props} />
      </Suspense>
      <main className={styles.main}>
        <Suspense fallback={<p role="status">商品を読み込んでいます…</p>}>
          <CollectionResults {...props} />
        </Suspense>
      </main>
    </>
  );
}
