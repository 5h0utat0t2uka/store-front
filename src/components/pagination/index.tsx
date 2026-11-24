import Link, { type LinkProps } from "next/link";
import styles from "./index.module.css";

type PaginationProps<T extends string> = {
  label: string;
  previousHref?: LinkProps<T>["href"];
  nextHref?: LinkProps<T>["href"];
  page?: { current: number; total: number };
  prefetch?: boolean;
};

export function Pagination<T extends string>({ label, previousHref, nextHref, page, prefetch }: PaginationProps<T>) {
  if (!previousHref && !nextHref) return null;

  const links = [
    { rel: "prev", label: "前のページ", href: previousHref },
    { rel: "next", label: "次のページ", href: nextHref },
  ];

  return (
    <nav className={styles.pagination} aria-label={label}>
      <div className={styles.controls}>
        {links.map(({ rel, label: linkLabel, href }) =>
          href ? (
            <Link<T> key={rel} href={href} rel={rel} aria-label={linkLabel} prefetch={prefetch} />
          ) : (
            <span key={rel} aria-hidden="true" />
          ),
        )}
      </div>
      {page && (
        <span className={styles.count} aria-current="page">
          {page.current} / {page.total}
        </span>
      )}
    </nav>
  );
}
