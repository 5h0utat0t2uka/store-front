"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

type Props = {
  error: unknown;
  retry: () => void;
};

// Server Component 由来のエラーは、本番では詳細を伏せた定型文と digest だけが届く。
// digest でサーバーログの該当エラーと突き合わせる。
function describeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error), digest: undefined };
  }
  const digest = "digest" in error && typeof error.digest === "string" ? error.digest : undefined;
  return { message: error.message, digest };
}

export default function ErrorPage({ error, retry }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const { message, digest } = describeError(error);

  return (
    <main className={styles.main} lang="en">
      <h1>Error occurred</h1>
      <p>Please try again after some time.</p>
      <dl className={styles.details}>
        {message && (
          <div>
            <dt>Message</dt>
            <dd>{message}</dd>
          </div>
        )}
        {digest && (
          <div>
            <dt>Error ID</dt>
            <dd>{digest}</dd>
          </div>
        )}
      </dl>
      <button className={styles.retry} onClick={() => retry()} type="button">
        Retry
      </button>
    </main>
  );
}
