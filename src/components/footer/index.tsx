import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/header";
import { NewsletterForm } from "@/components/newsletter/form";
import styles from "./index.module.css";

type Props = {
  name: string;
  // Shopify の管理画面（設定 → ポリシー）で作成済みのポリシー。
  policies?: { handle: string; title: string }[];
};

export function Footer({ name, policies = [] }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={styles.newsletter}>
        <Image src="/bg.webp" width={1600} height={1067} alt="" loading="lazy" />
        <section className={styles.form}>
          <hgroup>
            <h2>Subscribe to our Newsletter</h2>
            <p>Stay in the loop with drops, events, and in-stock alerts.</p>
          </hgroup>
          <NewsletterForm />
        </section>
      </div>
      {/*<div className={styles.subscribe}>
        <div>
          <p>Join our newsletter</p>
          <span>Subscribe</span>
        </div>
      </div>*/}
      <div className={styles.common}>
        <div className={styles.content}>
          <section className={styles.store}>
            <Logo name={name} className={styles.logo} />
            <address>
              <p>
                Mozilla Foundation
                <br />
                331 E Evelyn Ave Mountain View, CA 94041 USA
              </p>
              <p>+1 (415) 555‑0132</p>
            </address>
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
                <Link href={`/`}>Instagram</Link>
              </li>
              <li>
                <Link href={`/`}>Facebook</Link>
              </li>
              <li>
                <Link href={`/`}>Discord</Link>
              </li>
            </ul>
          </section>
        </div>
        <small className={styles.copy}>© 2026 {name}</small>
      </div>
    </footer>
  );
}
