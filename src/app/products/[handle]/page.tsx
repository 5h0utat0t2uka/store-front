import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/app/products/_components/add-to-cart";
import { CarouselTrack } from "@/components/carousel/track";
import { createPageMetadata } from "@/lib/metadata";
import { getHomeProducts, getProductByHandle, type ProductDetail } from "@/lib/shopify";
import { parseHandle } from "@/lib/shopify/handle";
import { UNASSIGNED_CATEGORY_LABEL } from "@/lib/shopify/product";
import { PRODUCT_GALLERY_SIZES, PRODUCT_HERO_SIZES } from "@/styles/image-sizes";
import { cx } from "@/utils/class";
import styles from "./page.module.css";
import carouselStyles from "@/components/carousel/index.module.css";

// ビルド時に 1 件も生成できないとビルドが失敗するため、商品が 0 件のときに使う。
// このハンドルの商品は存在しないので、404 のページとして生成される。
const PLACEHOLDER_HANDLE = "__placeholder__";

// トップページに掲載する商品だけをビルド時に生成する。
// それ以外の商品は、最初のアクセスでは loading.tsx を先に返して内容をストリームで届け、
// 裏で生成が終わった後は静的に配信される。
// 応答を先に返すため、存在しない商品への最初のアクセスは 200 になる（404 の画面と noindex は出力される）。
export async function generateStaticParams() {
  const products = await getHomeProducts();
  if (products.length === 0) return [{ handle: PLACEHOLDER_HANDLE }];
  return products.map((product) => ({ handle: product.handle }));
}

async function getProduct(params: PageProps<"/products/[handle]">["params"]) {
  const handle = parseHandle((await params).handle);
  if (!handle) notFound();
  const product = await getProductByHandle(handle);
  if (!product) notFound();
  return product;
}

export async function generateMetadata(
  { params }: PageProps<"/products/[handle]">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const product = await getProduct(params);
  const title = product.seo.title?.trim() || product.title;
  const description = product.seo.description?.trim() || product.description.trim().slice(0, 160) || undefined;
  const url = `/products/${encodeURIComponent(product.handle)}`;
  const image = product.featuredImage ?? product.images.nodes[0];
  const images = image
    ? [
        {
          url: image.url,
          alt: image.altText?.trim() || product.title,
          width: image.width ?? undefined,
          height: image.height ?? undefined,
        },
      ]
    : undefined;
  return createPageMetadata({ title, description, url, images }, parent);
}

async function ProductPurchase({
  product,
  searchParams,
}: {
  product: ProductDetail;
  searchParams: PageProps<"/products/[handle]">["searchParams"];
}) {
  let selection = product;
  if (product.options.some((option) => option.optionValues.length > 1)) {
    const query = await searchParams;
    // 商品に登録された名前・値だけを、Shopify と同じ順序でキャッシュキーに使う。
    const selectedOptions = product.options.flatMap(({ name, optionValues }) => {
      const value = query[name];
      return typeof value === "string" && optionValues.some((option) => option.name === value) ? [{ name, value }] : [];
    });
    if (selectedOptions.length > 0) {
      selection = (await getProductByHandle(product.handle, selectedOptions)) ?? notFound();
    }
  }
  return (
    <AddToCart
      product={{
        id: selection.id,
        title: selection.title,
        handle: selection.handle,
        vendor: selection.vendor,
        priceRange: selection.priceRange,
        requiresSellingPlan: selection.requiresSellingPlan,
        encodedVariantExistence: selection.encodedVariantExistence,
        encodedVariantAvailability: selection.encodedVariantAvailability,
        options: selection.options,
        selectedOrFirstAvailableVariant: selection.selectedOrFirstAvailableVariant,
        adjacentVariants: selection.adjacentVariants,
      }}
    />
  );
}

export default async function ProductPage({ params, searchParams }: PageProps<"/products/[handle]">) {
  const product = await getProduct(params);
  const primaryImage = product.featuredImage ?? product.images.nodes[0];
  const imageSrc = primaryImage?.url ?? "/placehold.svg";
  const imageAlt = primaryImage ? primaryImage.altText?.trim() || product.title : `${product.title}（商品画像なし）`;
  const additionalImages = product.images.nodes.filter((image) => image.url !== primaryImage?.url);
  const hasGallery = additionalImages.length > 0;
  const hero = (
    <Image
      className={styles.image}
      src={imageSrc}
      alt={imageAlt}
      fill
      sizes={PRODUCT_HERO_SIZES}
      loading="eager"
      fetchPriority={primaryImage ? "high" : "auto"}
      unoptimized={!primaryImage}
    />
  );

  return (
    <main className={styles.main}>
      <article className={styles.product}>
        <section className={cx(styles.images, hasGallery && carouselStyles.productGallery)} aria-label="商品画像">
          {hasGallery ? (
            <CarouselTrack key={product.id}>
              <li className={styles.frame}>{hero}</li>
              {additionalImages.map((image, index) => (
                <li className={styles.frame} key={image.url}>
                  <Image
                    className={styles.image}
                    src={image.url}
                    alt={image.altText?.trim() || `${product.title}（画像 ${index + 2}）`}
                    fill
                    sizes={PRODUCT_GALLERY_SIZES}
                    loading="lazy"
                  />
                </li>
              ))}
            </CarouselTrack>
          ) : (
            <div className={styles.frame}>{hero}</div>
          )}
        </section>

        <div className={styles.details}>
          <hgroup className={styles.heading}>
            <p>{product.category?.name ?? UNASSIGNED_CATEGORY_LABEL}</p>
            <h1>{product.title}</h1>
          </hgroup>
          <Suspense fallback={<p role="status">購入オプションを読み込んでいます…</p>}>
            <ProductPurchase product={product} searchParams={searchParams} />
          </Suspense>
          {/*<dl className={styles.attributes}>
            <div>
              <dt>カテゴリ</dt>
              <dd>{product.category?.name ?? UNASSIGNED_CATEGORY_LABEL}</dd>
            </div>
            {product.vendor.trim() && (
              <div>
                <dt>販売元</dt>
                <dd>{product.vendor}</dd>
              </div>
            )}
          </dl>*/}
          <section className={styles.descriptionSection}>
            {/*<h2>商品説明</h2>*/}
            <p className={styles.description}>{product.description.trim() || "商品説明はまだ登録されていません。"}</p>
          </section>
          {product.tags.length > 0 && (
            <nav aria-label="商品タグ" className={styles.tags}>
              <ul className={styles.list} role="list">
                {product.tags.map((tag) => (
                  <li key={tag} className={styles.item}>
                    <Link href={{ pathname: "/products", query: { tag } }} prefetch={false}>
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </article>
    </main>
  );
}
