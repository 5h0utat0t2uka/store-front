import type { ProductSummary } from "@/lib/shopify";
import { ItemCard } from "./item";
import styles from "./grid.module.css";

// 1枚が最も広いのは3列に増える直前。最大gapでも (3 × 12rem + 1.75rem) / 2 ≒ 19rem。
const PRODUCT_IMAGE_SIZES = "min(50vw, 19rem)";
// 現在のページの最大幅72remでは、左右の余白を除くと先頭行に5枚収まる。
const EAGER_PRODUCT_IMAGE_COUNT = 5;

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    // list-style: none による Safari のリスト認識の喪失を防ぐ。
    <ul className={styles.products} role="list">
      {products.map((product, index) => (
        <li key={product.id}>
          <ItemCard
            product={product}
            sizes={PRODUCT_IMAGE_SIZES}
            loading={index < EAGER_PRODUCT_IMAGE_COUNT ? "eager" : "lazy"}
          />
        </li>
      ))}
    </ul>
  );
}
