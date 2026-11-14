import { formatMoney } from "@shopify/hydrogen";
import Image from "next/image";
import Link from "next/link";
import type { ProductSummary } from "@/lib/shopify";
import { cx } from "@/utils/class";
import styles from "./item.module.css";

type ItemCardProps = {
  product: ProductSummary;
  sizes: string;
  loading?: "eager" | "lazy";
};

function ItemLink({
  product,
  className,
  children,
}: {
  product: ProductSummary;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      className={cx(styles.link, className)}
      href={`/products/${encodeURIComponent(product.handle)}`}
    >
      {children}
    </Link>
  );
}

export function ItemCard({ product, sizes, loading = "lazy" }: ItemCardProps) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const featuredImage = product.featuredImage;
  const imageSrc = featuredImage?.url ?? "/placehold.svg";
  const imageAlt = featuredImage
    ? featuredImage.altText?.trim() || product.title
    : `${product.title}（商品画像なし）`;
  const price = formatMoney([minVariantPrice, maxVariantPrice], {
    locale: "ja-JP",
  }).toString();

  return (
    <article className={styles.card}>
      <ItemLink product={product} className={styles.frame}>
        <Image
          className={styles.image}
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes={sizes}
          loading={loading}
        />
      </ItemLink>
      <div className={styles.details}>
        <p className={styles.category}>
          {product.category?.name ?? "カテゴリ未設定"}
        </p>
        <h2 className={styles.title}>
          <ItemLink product={product}>{product.title}</ItemLink>
        </h2>
        <p className={styles.price}>{price}</p>
      </div>
      <p className={styles.availability}>
        {product.availableForSale ? "販売中" : "現在購入できません"}
      </p>
    </article>
  );
}
