import { ShopifyImage } from "@/components/image/shopify";
import type { ProductSummary } from "@/lib/shopify";
import { formatPriceRange } from "@/lib/shopify/money";
import { UNASSIGNED_CATEGORY_LABEL } from "@/lib/shopify/product";
import { ItemLink } from "./link";
import styles from "./item.module.css";

export type CardHeading = "h2" | "h3";

type ItemCardProps = {
  product: ProductSummary;
  heading: CardHeading;
  sizes: string;
  loading?: "eager" | "lazy";
};

export function ItemCard({ product, heading: Heading, sizes, loading = "lazy" }: ItemCardProps) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const featuredImage = product.featuredImage;
  const imageSrc = featuredImage?.url ?? "/placehold.svg";
  // 商品名は直後の見出しで伝えるため、固有の代替テキストがない画像は装飾として扱う。
  const imageAlt = featuredImage?.altText?.trim() ?? "";
  const price = formatPriceRange(minVariantPrice, maxVariantPrice);

  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        <ShopifyImage
          className={styles.image}
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes={loading === "eager" ? sizes : "auto"}
          loading={loading}
        />
      </div>
      <div className={styles.details}>
        <p className={styles.category}>{product.category?.name ?? UNASSIGNED_CATEGORY_LABEL}</p>
        <Heading className={styles.title}>
          {/* カード内のリンクはこの1つだけ。::after でカード全体をクリック可能にする。 */}
          <ItemLink className={styles.link} handle={product.handle}>
            {product.title}
          </ItemLink>
        </Heading>
        <p className={styles.price}>{price}</p>
      </div>
      {/*<p className={styles.availability}>{product.availableForSale ? "販売中" : "現在購入できません"}</p>*/}
    </article>
  );
}
