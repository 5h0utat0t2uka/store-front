import Image from "next/image";
import { formatPriceRange } from "@/lib/money";
import type { ProductSummary } from "@/lib/shopify";
import styles from "./item.module.css";
import { ItemLink } from "./item-link";

type ItemCardProps = {
  product: ProductSummary;
  sizes: string;
  loading?: "eager" | "lazy";
};

export function ItemCard({ product, sizes, loading = "lazy" }: ItemCardProps) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const featuredImage = product.featuredImage;
  const imageSrc = featuredImage?.url ?? "/placehold.svg";
  // 商品名は直後の見出しで伝えるため、固有の代替テキストがない画像は装飾として扱う。
  const imageAlt = featuredImage?.altText?.trim() ?? "";
  const price = formatPriceRange(minVariantPrice, maxVariantPrice);

  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        <Image
          className={styles.image}
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes={sizes}
          loading={loading}
          // ローカルの代替画像は Shopify CDN のリサイズ対象外。
          unoptimized={!featuredImage}
        />
      </div>
      <div className={styles.details}>
        <p className={styles.category}>
          {product.category?.name ?? "カテゴリ未設定"}
        </p>
        <h2 className={styles.title}>
          {/* カード内のリンクはこの1つだけ。::after でカード全体をクリック可能にする。 */}
          <ItemLink className={styles.link} handle={product.handle}>
            {product.title}
          </ItemLink>
        </h2>
        <p className={styles.price}>{price}</p>
      </div>
      <p className={styles.availability}>
        {product.availableForSale ? "販売中" : "現在購入できません"}
      </p>
    </article>
  );
}
