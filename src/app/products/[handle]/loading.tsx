import styles from "./page.module.css";

export default function ProductLoading() {
  return (
    <main className={styles.main}>
      <div className={styles.product}>
        <div className={styles.images}>
          <div className={styles.frame}>
            <p role="status">商品情報を読み込んでいます…</p>
          </div>
        </div>
      </div>
    </main>
  );
}
