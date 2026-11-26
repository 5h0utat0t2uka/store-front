import type { Metadata } from "next";
import { ContactForm } from "./_components/form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  robots: { index: false, follow: false },
};

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <article>
        <hgroup>
          <h1 id="contact-heading">Contact</h1>
          <p>お問い合わせいただいた内容は、確認後3営業日以内に入力されたメールアドレス宛に返信します。</p>
        </hgroup>
        <ContactForm />
      </article>
    </main>
  );
}
