"use client";

import { Children, type ReactNode, useEffect, useId, useRef, useState } from "react";
import styles from "./index.module.css";

function offsetFromCenter(track: HTMLElement, slide: Element) {
  const trackRect = track.getBoundingClientRect();
  const slideRect = slide.getBoundingClientRect();
  return slideRect.left + slideRect.width / 2 - (trackRect.left + trackRect.width / 2);
}

export function CarouselTrack({ children }: { children: ReactNode }) {
  const trackId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const pendingTarget = useRef<number | null>(null);
  const settledIndexRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState("");
  const slideCount = Children.count(children);

  useEffect(() => {
    // CSS の @supports と同じ条件。対応ブラウザーでは位置の監視も不要。
    if (CSS.supports("selector(::scroll-marker)")) return;
    const track = trackRef.current;
    if (!track) return;

    const getCurrentIndex = () => {
      let index = 0;
      let distance = Number.POSITIVE_INFINITY;
      Array.from(track.children).forEach((slide, slideIndex) => {
        const offset = Math.abs(offsetFromCenter(track, slide));
        if (offset < distance) {
          index = slideIndex;
          distance = offset;
        }
      });
      return index;
    };

    const syncPosition = () => {
      const index = getCurrentIndex();
      settledIndexRef.current = index;
      setCurrentIndex(index);
    };
    syncPosition();
    const supportsScrollEnd = "onscrollend" in track;

    const settle = () => {
      const target = pendingTarget.current;
      // 連続クリックで新しい移動が始まった直後の、古い scrollend は採用しない。
      if (target !== null && Math.abs(offsetFromCenter(track, track.children[target])) > 1) return;
      pendingTarget.current = null;
      const index = getCurrentIndex();
      setCurrentIndex(index);
      // 初期表示は読み上げず、移動が完了したときだけ通知する。
      if (index !== settledIndexRef.current) {
        settledIndexRef.current = index;
        setStatus(`スライド ${index + 1} / ${slideCount}`);
      }
    };

    const onScroll = () => {
      if (pendingTarget.current === null && frameRef.current === null) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null;
          if (pendingTarget.current === null) setCurrentIndex(getCurrentIndex());
        });
      }
      // scrollend に未対応の Safari でも、スクロールが落ち着いてから通知する。
      if (!supportsScrollEnd) {
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(settle, 150);
      }
    };
    const interrupt = () => {
      pendingTarget.current = null;
    };

    const observer = new ResizeObserver(() => {
      // リサイズ後は移動予定よりも、実際に表示されている位置を優先する。
      pendingTarget.current = null;
      syncPosition();
    });
    observer.observe(track);
    track.addEventListener("scroll", onScroll, { passive: true });
    if (supportsScrollEnd) track.addEventListener("scrollend", settle);
    track.addEventListener("pointerdown", interrupt, { passive: true });
    track.addEventListener("wheel", interrupt, { passive: true });
    track.addEventListener("keydown", interrupt);

    return () => {
      observer.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("scrollend", settle);
      track.removeEventListener("pointerdown", interrupt);
      track.removeEventListener("wheel", interrupt);
      track.removeEventListener("keydown", interrupt);
      pendingTarget.current = null;
    };
  }, [slideCount]);

  const showSlide = (index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index];
    if (!track || !slide) return;
    const offset = offsetFromCenter(track, slide);
    setCurrentIndex(index);
    pendingTarget.current = Math.abs(offset) > 1 ? index : null;
    // ページ全体を動かさず、トラックだけを移動する。
    // auto は既存 CSS の scroll-behavior と prefers-reduced-motion に従う。
    track.scrollBy({ left: offset, behavior: "auto" });
  };

  return (
    <>
      {/* list-style: none による Safari のリスト認識の喪失を防ぐ。 */}
      <ul ref={trackRef} id={trackId} className={styles.list} role="list">
        {children}
      </ul>
      <div className={styles.markers} role="group" aria-label="表示するスライドを選択">
        {Children.map(children, (_, index) => (
          <button
            className={styles.marker}
            type="button"
            aria-label={`スライド ${index + 1} / ${slideCount} を表示`}
            aria-controls={trackId}
            aria-current={currentIndex === index ? "true" : undefined}
            onClick={() => showSlide(index)}
          />
        ))}
        <p className={styles.status} role="status" aria-atomic="true">
          {status}
        </p>
      </div>
    </>
  );
}
