import Link from "next/link";
import { Logo } from "@/components/header";
import { NewsletterForm } from "@/components/newsletter";
import styles from "./index.module.css";

type Props = {
  name: string;
  // Shopify の管理画面（設定 → ポリシー）で作成済みのポリシー。
  policies?: { handle: string; title: string }[];
};

export function Footer({ name, policies = [] }: Props) {
  return (
    <footer className={styles.footer}>
      {/*<div className={styles.subscribe}>
        <div>
          <p>Join our newsletter</p>
          <span>Subscribe</span>
        </div>
      </div>*/}
      <div>
        <div className={styles.content}>
          <section className={styles.newsletter}>
            <Logo name={name} className={styles.logo} />
            <NewsletterForm />
            <p>Subscribe to our weekly newsletter for updates on our latest products.</p>
          </section>
          <section className={styles.legal}>
            <h4 className={styles.heading}>Legal</h4>
            {policies.length > 0 && (
              <nav aria-label="ポリシー" className={styles.nav}>
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
          </section>
          <section className={styles.social}>
            <h4 className={styles.heading}>Social</h4>
            <ul>
              <li>
                <Link href={`/`}>TikTok</Link>
              </li>
              <li>
                <Link href={`/`}>Instagram</Link>
              </li>
              <li>
                <Link href={`/`}>Facebook</Link>
              </li>
            </ul>
          </section>
          <section className={styles.store}>
            <h4 className={styles.heading}>Store</h4>
            <address>
              <p>
                Mozilla Foundation
                <br />
                331 E Evelyn Ave
                <br />
                Mountain View, CA 94041
                <br />
                USA
              </p>
              <p>+1 (415) 555‑0132</p>
            </address>
          </section>
        </div>
        <small className={styles.copy}>© 2016 {name}</small>
      </div>
    </footer>
  );
}
