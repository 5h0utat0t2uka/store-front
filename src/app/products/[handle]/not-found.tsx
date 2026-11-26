import Link from "next/link";
import styles from "@/app/not-found.module.css";

export default function ProductNotFound() {
  return (
    <main className={styles.main}>
      <h1>商品が見つかりません</h1>
      <p>商品が削除されたか、現在公開されていない可能性があります。</p>
      <Link className={styles.link} href="/">
        Home
      </Link>
    </main>
  );
}
