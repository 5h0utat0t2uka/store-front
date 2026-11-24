import Image from "next/image";
import Link from "next/link";
import { CarouselTrack } from "@/components/carousel/track";
import { getHomeCarouselSlides } from "@/lib/shopify/carousel";
import styles from "./home-carousel.module.css";

export async function HomeCarousel() {
  const slides = await getHomeCarouselSlides();
  if (slides.length === 0) return null;

  return (
    <section className={styles.carousel} aria-roledescription="carousel" aria-label="Recommended Products">
      <CarouselTrack>
        {slides.map(({ id, title, description, image, link, linkLabel }, index) => (
          <li key={id} className={styles.item}>
            <Image
              src={image.url}
              alt={image.altText ?? ""}
              fill
              sizes="(min-width: 85rem) 71.4rem, 84vw"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding={index === 0 ? "sync" : "auto"}
            />
            <div className={styles.caption}>
              <h2 className={styles.heading}>{title}</h2>
              {description && <p className={styles.description}>{description}</p>}
              {typeof link === "string" ? (
                <a className={styles.link} href={link} target="_blank" rel="noopener noreferrer">
                  {linkLabel}
                </a>
              ) : (
                <Link className={styles.link} href={link} prefetch={index === 0 ? true : "auto"}>
                  {linkLabel}
                </Link>
              )}
            </div>
          </li>
        ))}
      </CarouselTrack>
    </section>
  );
}
