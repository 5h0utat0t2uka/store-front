import { formatMoney } from "@shopify/hydrogen";
import type { Metadata } from "next";
import { io } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/shopify";
import styles from "./page.module.css";

// page.module.css の最大幅・余白・列間隔と対応させる。
const HERO_IMAGE_SIZES = [
  "(min-width: 48rem) calc((min(100vw, 72rem) - clamp(2rem, 8vw, 6rem) - 2rem) / 2)",
  "calc(100vw - clamp(2rem, 8vw, 6rem))",
].join(", ");

const GALLERY_IMAGE_SIZES = [
  "(min-width: 48rem) calc((min(100vw, 72rem) - clamp(2rem, 8vw, 6rem) - 2rem) / 3)",
  "calc((100vw - clamp(2rem, 8vw, 6rem) - 1rem) / 2)",
].join(", ");

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  await io();
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const title = product.seo.title?.trim() || product.title;
  const description =
    product.seo.description?.trim() ||
    product.description.trim().slice(0, 160) ||
    undefined;
  const url = `/products/${encodeURIComponent(product.handle)}`;
  const image = product.featuredImage ?? product.images.nodes[0];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: image
        ? [
            {
              url: image.url,
              alt: image.altText?.trim() || product.title,
              width: image.width ?? undefined,
              height: image.height ?? undefined,
            },
          ]
        : [],
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[handle]">) {
  // loading.tsx の Suspense 境界内で、実行環境のトークンを使って取得する。
  await io();
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();
  const primaryImage = product.featuredImage ?? product.images.nodes[0];
  const imageSrc = primaryImage?.url ?? "/placehold.svg";
  const imageAlt = primaryImage
    ? primaryImage.altText?.trim() || product.title
    : `${product.title}（商品画像なし）`;
  const additionalImages = product.images.nodes.filter(
    (image) => image.url !== primaryImage?.url,
  );
  const price = formatMoney(
    [product.priceRange.minVariantPrice, product.priceRange.maxVariantPrice],
    { locale: "ja-JP" },
  ).toString();

  return (
    <main className={styles.main}>
      <Link className={styles.backLink} href="/">
        トップページへ戻る
      </Link>

      <article className={styles.product}>
        <div className={styles.frame}>
          <Image
            className={styles.image}
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes={HERO_IMAGE_SIZES}
            loading="eager"
            fetchPriority={primaryImage ? "high" : "auto"}
          />
        </div>

        <div className={styles.details}>
          <h1>{product.title}</h1>
          <p className={styles.price}>{price}</p>
          <dl className={styles.attributes}>
            <div>
              <dt>販売状況</dt>
              <dd>
                {product.availableForSale ? "購入可能" : "現在購入できません"}
              </dd>
            </div>
            <div>
              <dt>カテゴリ</dt>
              <dd>{product.category?.name ?? "カテゴリ未設定"}</dd>
            </div>
            {product.vendor.trim() && (
              <div>
                <dt>販売元</dt>
                <dd>{product.vendor}</dd>
              </div>
            )}
          </dl>
          <section className={styles.descriptionSection}>
            <h2>商品説明</h2>
            <p className={styles.description}>
              {product.description.trim() ||
                "商品説明はまだ登録されていません。"}
            </p>
          </section>
        </div>

        {additionalImages.length > 0 && (
          <section className={styles.gallery} aria-labelledby="product-images">
            <h2 id="product-images">商品画像</h2>
            {/* biome-ignore lint/a11y/noRedundantRoles: list-style: none による Safari のリスト認識の喪失を防ぐ。 */}
            <ul className={styles.imageList} role="list">
              {additionalImages.map((image, index) => (
                <li className={styles.frame} key={image.url}>
                  <Image
                    className={styles.image}
                    src={image.url}
                    alt={
                      image.altText?.trim() ||
                      `${product.title}（画像 ${index + 2}）`
                    }
                    fill
                    sizes={GALLERY_IMAGE_SIZES}
                    loading="lazy"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
