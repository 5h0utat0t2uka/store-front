import Image from "next/image";
import Link from "next/link";
import styles from "./index.module.css";

export function Carousel() {
  return (
    // 名前のない <section> は役割を持たず、aria-roledescription を付けられないため、名前はここに付ける。
    <section className={styles.carousel} aria-roledescription="carousel" aria-label="Recommended Products">
      <ul
        className={styles.slides}
        // list-style: none による Safari のリスト認識の喪失を防ぐ。
        role="list"
      >
        <li className={styles.item}>
          <Image src="/carousel/c1.webp" alt="" fill unoptimized loading="eager" fetchPriority="high" decoding="sync" />
          <div className={styles.caption}>
            <h2 className={styles.heading}>Shopify with Next.js</h2>
            <p className={styles.description}>
              This is a Shopify Storefront application built with Next.js and Hydrogen.
            </p>
            <Link
              className={styles.link}
              href="https://vercel.com/templates/next.js/shopify-online-store-with-next-js"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More
            </Link>
          </div>
        </li>
        <li className={styles.item}>
          <Image src="/carousel/c2.webp" alt="" fill unoptimized loading="lazy" fetchPriority="auto" decoding="auto" />
          <div className={styles.caption}>
            <h2 className={styles.heading}>Gift Card</h2>
            <p className={styles.description}>This is a gift card for the store</p>
            <Link className={styles.link} href="/products/gift-card">
              View Item
            </Link>
          </div>
        </li>
        <li className={styles.item}>
          <Image src="/carousel/c3.webp" alt="" fill unoptimized loading="lazy" fetchPriority="auto" decoding="auto" />
          <div className={styles.caption}>
            <h2 className={styles.heading}>The Complete Snowboard</h2>
            <p className={styles.description}>This PREMIUM snowboard is so SUPERDUPER awesome.</p>
            <Link className={styles.link} href="/products/the-complete-snowboard">
              View Item
            </Link>
          </div>
        </li>
      </ul>
    </section>
  );
}
