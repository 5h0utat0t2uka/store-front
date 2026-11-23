import Link from "next/link";
import { NewsletterForm } from "./newsletter";
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
      <div className={styles.content}>
        <div className={styles.newsletter}>
          <p>Newsletter</p>
          <p>Subscribe to our weekly newsletter for exclusive offers and updates on our latest products.</p>
          <NewsletterForm />
        </div>
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
        <div className={styles.sns}>
          <svg role="img" aria-label="TikTok" width={24} height={24} viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
              <path d="M21 8v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5"></path>
              <path d="M10 12a3 3 0 1 0 3 3V6c.333 1 1.6 3 4 3"></path>
            </g>
          </svg>
          <svg role="img" aria-label="Instagram" width={24} height={24} viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12c0 5.333 8 5.333 8 0m0 0c0-5.333-8-5.333-8 0m9-5h.01M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z"
            ></path>
          </svg>
          <svg role="img" aria-label="X" width={24} height={24} viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
              <path d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12.001 2.5c4.478 0 6.717 0 8.108 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.717 0-8.109-1.391c-1.39-1.392-1.39-3.63-1.39-8.109"></path>
              <path d="m7 17l4.194-4.193M17 7l-4.193 4.194m0 0L9.777 7H7l4.194 5.807m1.613-1.614L17 17h-2.778l-3.028-4.193"></path>
            </g>
          </svg>
        </div>
        <small className={styles.copy}>© 2016 {name}</small>
      </div>
    </footer>
  );
}
