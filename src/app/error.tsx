"use client";

import styles from "./error.module.css";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className={styles.main}>
      <h1>Error occurred</h1>
      <p>Please try again after some time.</p>
      <button className={styles.retry} onClick={() => retry()} type="button">
        Retry
      </button>
    </main>
  );
}
