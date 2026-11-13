"use client";

import styles from "./error.module.css";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className={styles.main}>
      <h1>商品を読み込めませんでした</h1>
      <p>時間をおいて、もう一度お試しください。</p>
      <button className={styles.retry} onClick={() => retry()} type="button">
        再読み込み
      </button>
    </main>
  );
}
