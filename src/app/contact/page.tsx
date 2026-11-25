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
        <h1 id="contact-heading">Contact</h1>
        <ContactForm />
      </article>
    </main>
  );
}
