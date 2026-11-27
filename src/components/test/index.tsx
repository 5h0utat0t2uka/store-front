import Image from "next/image";
import styles from "./index.module.css";

export function NotchedImage({ time, heading, alt = "" }: { time: string; heading: string; alt?: string }) {
  return (
    <article className={styles.article}>
      <div className={styles.frame}>
        <Image
          className={styles.image}
          src="/bg.webp"
          width={1600}
          height={1067}
          alt={alt}
          loading="lazy"
          sizes="auto"
        />
      </div>
      <time className={styles.time}>{time}</time>
      <h3 className={styles.heading}>{heading}</h3>
    </article>
  );
}
