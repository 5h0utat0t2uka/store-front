import type { ProductSummary } from "@/lib/shopify";
import { PRODUCT_CARD_SIZES } from "@/styles/image-sizes";
import { type CardHeading, ItemCard } from "./item";
import styles from "./grid.module.css";

// 最大幅72remのグリッドで先頭行を埋める枚数。
const EAGER_PRODUCT_IMAGE_COUNT = 4;

export function ProductGrid({ products, heading = "h3" }: { products: ProductSummary[]; heading?: CardHeading }) {
  return (
    // list-style: none による Safari のリスト認識の喪失を防ぐ。
    <ul className={styles.products} role="list">
      {products.map((product, index) => (
        <li key={product.id}>
          <ItemCard
            product={product}
            heading={heading}
            sizes={PRODUCT_CARD_SIZES}
            loading={index < EAGER_PRODUCT_IMAGE_COUNT ? "eager" : "lazy"}
          />
        </li>
      ))}
    </ul>
  );
}
