import type { Metadata } from "next";
import { CartContents } from "@/components/cart/contents";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

// カートの内容はルートレイアウトがサーバーで読み、CartProvider 経由で届く。
// ヘッダーのパネルと同じ内容を、1 ページとして表示する。
export default function CartPage() {
  return (
    <main className={styles.main}>
      <h1>Cart</h1>
      <CartContents />
    </main>
  );
}
