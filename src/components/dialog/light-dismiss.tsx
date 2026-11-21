"use client";

import { type ComponentPropsWithoutRef, type RefObject, useEffect, useRef } from "react";
import { cx } from "@/utils/class";
import styles from "./light-dismiss.module.css";

type Props = Omit<ComponentPropsWithoutRef<"dialog">, "closedby"> & { ref: RefObject<HTMLDialogElement | null> };

export function LightDismissDialog({ ref, className, ...props }: Props) {
  const pressedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    // ::backdrop のイベントは dialog に届く。ダイアログ自身の余白や枠線と区別する。
    const isOnBackdrop = (event: MouseEvent) => {
      if (event.target !== dialog) return false;
      const rect = dialog.getBoundingClientRect();
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      );
    };

    const trackPress = (event: PointerEvent) => {
      pressedOnBackdrop.current = event.isPrimary && event.button === 0 && isOnBackdrop(event);
    };
    const closeOnBackdropClick = (event: MouseEvent) => {
      // 画像のドラッグやテキスト選択で外側まで移動した場合は閉じない。
      const shouldClose = pressedOnBackdrop.current && isOnBackdrop(event);
      pressedOnBackdrop.current = false;
      if (shouldClose) dialog.close();
    };
    dialog.addEventListener("pointerdown", trackPress);
    dialog.addEventListener("click", closeOnBackdropClick);
    return () => {
      dialog.removeEventListener("pointerdown", trackPress);
      dialog.removeEventListener("click", closeOnBackdropClick);
    };
  }, [ref]);

  return <dialog {...props} ref={ref} className={cx(styles.dialog, className)} closedby="any" />;
}
