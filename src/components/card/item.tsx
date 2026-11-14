import Image from "next/image";
import type { ProductSummary } from "@/lib/shopify";
import styles from "./item.module.css";

type ItemCardProps = {
  product: ProductSummary;
  prioritizeImage?: boolean;
};

export function ItemCard({ product, prioritizeImage = false }: ItemCardProps) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const priceFormatter = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: minVariantPrice.currencyCode,
  });
  const minPrice = Number(minVariantPrice.amount);
  const maxPrice = Number(maxVariantPrice.amount);
  const price =
    minPrice === maxPrice
      ? priceFormatter.format(minPrice)
      : `${priceFormatter.format(minPrice)} ～ ${priceFormatter.format(maxPrice)}`;

  return (
    <article className={styles.card}>
      <div className={styles.imageFrame}>
        {product.featuredImage ? (
          <Image
            className={styles.image}
            src={product.featuredImage.url}
            alt={product.featuredImage.altText?.trim() || product.title}
            fill
            sizes="(min-width: 1152px) 384px, (max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
            loading={prioritizeImage ? "eager" : "lazy"}
            fetchPriority={prioritizeImage ? "high" : "auto"}
          />
        ) : (
          <span className={styles.noImage}>画像なし</span>
        )}
      </div>
      <div className={styles.details}>
        <p className={styles.category}>
          {product.category?.name ?? "カテゴリ未設定"}
        </p>
        <h2 className={styles.title}>{product.title}</h2>
        <p className={styles.price}>{price}</p>
      </div>
      <p className={styles.availability}>
        {product.availableForSale ? "販売中" : "現在購入できません"}
      </p>
    </article>
  );
}
