import styles from "./index.module.css";

type Props = {
  title: string;
  html: string;
};

export function ContentBody({ html }: { html: string }) {
  return (
    <div
      className={styles.body}
      // Shopify 管理画面で編集された HTML を表示するため。
      // oxlint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }} // nosemgrep
    />
  );
}

export function Content({ title, html }: Props) {
  return (
    <main className={styles.main}>
      <article>
        <h1>{title}</h1>
        <ContentBody html={html} />
      </article>
    </main>
  );
}
