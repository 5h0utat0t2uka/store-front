import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/app/products/_components/add-to-cart";
import { ProductGallery } from "@/app/products/_components/product-gallery";
import { ProductGrid } from "@/components/card/grid";
import { ContentBody } from "@/components/content";
import { createPageMetadata } from "@/lib/metadata";
import { getHomeProducts, getProductByHandle, type ProductDetail } from "@/lib/shopify";
import { parseHandle } from "@/lib/shopify/handle";
// import { UNASSIGNED_CATEGORY_LABEL } from "@/lib/shopify/product";
import styles from "./page.module.css";

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
  const relatedProducts =
    product.relatedProducts?.references?.nodes.filter((node) => node.__typename === "Product") ?? [];
  const primaryImage = product.featuredImage ?? product.images.nodes[0];
  const images = primaryImage
    ? [primaryImage, ...product.images.nodes.filter((image) => image.url !== primaryImage.url)]
    : [];

  return (
    <main className={styles.main}>
      <article className={styles.product}>
        <ProductGallery
          key={product.id}
          title={product.title}
          images={images.map(({ url, altText }, index) => ({
            src: url,
            alt: altText?.trim() || (index === 0 ? product.title : `${product.title}（画像 ${index + 1}）`),
          }))}
        />

        <div className={styles.details}>
          <h1>{product.title}</h1>
          <Suspense fallback={<p role="status">購入オプションを読み込んでいます…</p>}>
            <ProductPurchase product={product} searchParams={searchParams} />
          </Suspense>
          {product.descriptionHtml && (
            <section aria-label="商品説明" className={styles.description}>
              <ContentBody html={product.descriptionHtml} />
            </section>
          )}
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
      {relatedProducts.length > 0 && (
        <section aria-labelledby="related-products-heading" className={styles.relatedProducts}>
          <h2 id="related-products-heading">Related Products</h2>
          <ProductGrid products={relatedProducts} prioritizeFirstRow={false} />
        </section>
      )}
    </main>
  );
}
