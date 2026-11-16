import Link from "next/link";
import styles from "./page.module.css";

export default function ProductLoading() {
  return (
    <main className={styles.main}>
      <Link className={styles.backLink} href="/">
        トップページへ戻る
      </Link>
      <div className={styles.product}>
        <div className={styles.frame}>
          <p className={styles.message} role="status">
            商品情報を読み込んでいます…
          </p>
        </div>
        <div aria-hidden="true">{/* UIに合わせてスケルトンを実装 */}</div>
      </div>
    </main>
  );
}
