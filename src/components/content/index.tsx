import styles from "./index.module.css";

type Props = {
  title: string;
  // Shopify の管理画面で編集した本文の HTML。
  html: string;
};

// Shopify の「ページ」と「ポリシー」に共通の、見出しと本文の表示。
export function Content({ title, html }: Props) {
  return (
    <main className={styles.main}>
      <article>
        <h1>{title}</h1>
        {html.trim() ? (
          <div
            className={styles.body}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Shopify 管理画面で編集された HTML を表示するため。
            dangerouslySetInnerHTML={{ __html: html }} // nosemgrep
          />
        ) : (
          <p className={styles.body}>本文はまだ登録されていません。</p>
        )}
      </article>
    </main>
  );
}

// 動的なパスで、内容が届くまで先に表示する。
export function ContentLoading() {
  return (
    <main className={styles.main}>
      <p role="status">読み込んでいます…</p>
    </main>
  );
}
