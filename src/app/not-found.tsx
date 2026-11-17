import type { Metadata } from "next";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "ページが見つかりません",
};

// どのルートにも一致しない URL で表示する。
export default function NotFound() {
  return (
    <main className={styles.main}>
      <h1>ページが見つかりません</h1>
      <p>お探しのページは削除されたか、現在公開されていない可能性があります。</p>
      <Link className={styles.backLink} href="/">
        トップページへ戻る
      </Link>
    </main>
  );
}
