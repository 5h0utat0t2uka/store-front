import styles from "./loading.module.css";

export default function ProductLoading() {
  return (
    <main className={styles.main}>
      <div className={styles.product}>
        <div className={styles.images}></div>
        <div className={styles.details}></div>
      </div>
    </main>
  );
}
