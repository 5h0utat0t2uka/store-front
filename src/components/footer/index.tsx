import Link from "next/link";
import styles from "./index.module.css";

type Props = {
  name: string;
  // Shopify の管理画面（設定 → ポリシー）で作成済みのポリシー。
  policies?: { handle: string; title: string }[];
};

export function Footer({ name, policies = [] }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={styles.subscribe}>
        <div>
          <p>Join our newsletter</p>
          <span>Subscribe</span>
        </div>
      </div>
      <div className={styles.content}>
        {policies.length > 0 && (
          <nav aria-label="ポリシー">
            {/* list-style: none による Safari のリスト認識の喪失を防ぐ。 */}
            <ul role="list">
              {policies.map((policy) => (
                <li key={policy.handle}>
                  <Link href={`/policies/${encodeURIComponent(policy.handle)}`}>{policy.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <p>© 2016 {name}</p>
      </div>
    </footer>
  );
}
