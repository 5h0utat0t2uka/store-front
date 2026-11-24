"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CarouselTrack } from "@/components/carousel/track";
import { LightDismissDialog } from "@/components/dialog/light-dismiss";
import { PRODUCT_GALLERY_SIZES, PRODUCT_HERO_SIZES } from "@/styles/image-sizes";
import { cx } from "@/utils/class";
import styles from "./product-gallery.module.css";
import carouselStyles from "@/components/carousel/index.module.css";

type GalleryImage = { src: string; alt: string };
type Selection = { image: GalleryImage; trigger: HTMLButtonElement };

export function ProductGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const hasGallery = images.length > 1;

  useEffect(() => {
    if (!selection) return;
    // レイアウトの切り替えで起動ボタンが非表示になったら、拡大表示も終了する。
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === 0) dialogRef.current?.close();
    });
    observer.observe(selection.trigger);
    return () => observer.disconnect();
  }, [selection]);

  function openImage(image: GalleryImage, trigger: HTMLButtonElement) {
    // マウスクリックでボタンにフォーカスしないブラウザーでも、閉じたときは元の画像に戻す。
    trigger.focus({ preventScroll: true });
    setSelection({ image, trigger });
    dialogRef.current?.showModal();
  }

  function renderImage(image: GalleryImage | undefined, index: number) {
    const isMain = index === 0;
    return (
      <>
        <Image
          className={styles.image}
          src={image?.src ?? "/placehold.svg"}
          alt={image?.alt ?? `${title}（商品画像なし）`}
          fill
          sizes={isMain ? PRODUCT_HERO_SIZES : PRODUCT_GALLERY_SIZES}
          loading={isMain ? "eager" : "lazy"}
          fetchPriority={isMain && image ? "high" : "auto"}
          unoptimized={!image}
        />
        {image && (
          <button
            type="button"
            className={styles.zoom}
            aria-label={`${title}の商品画像 ${index + 1} を拡大`}
            aria-haspopup="dialog"
            onClick={(event) => openImage(image, event.currentTarget)}
          />
        )}
      </>
    );
  }

  return (
    <section className={cx(styles.images, hasGallery && carouselStyles.productGallery)} aria-label="商品画像">
      {hasGallery ? (
        <CarouselTrack>
          {images.map((image, index) => (
            <li className={styles.frame} key={image.src}>
              {renderImage(image, index)}
            </li>
          ))}
        </CarouselTrack>
      ) : (
        <div className={styles.frame}>{renderImage(images[0], 0)}</div>
      )}
      {images.length > 0 && (
        <LightDismissDialog
          ref={dialogRef}
          className={styles.dialog}
          aria-label={`${title}の商品画像を拡大表示`}
          onClose={(event) => {
            if (!event.currentTarget.open) setSelection(null);
          }}
        >
          {selection && <Image className={styles.image} {...selection.image} fill sizes="80vmin" loading="eager" />}
          <form method="dialog" className={styles.close}>
            {/*<button type="submit">閉じる</button>*/}
            <button type="submit" aria-label="閉じる">
              <svg role="img" aria-hidden="true" width={20} height={20} viewBox="0 0 24 24">
                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                  <path d="m5 5 14 14"></path>
                  <path d="M19 5 5 19"></path>
                </g>
              </svg>
            </button>
          </form>
        </LightDismissDialog>
      )}
    </section>
  );
}
