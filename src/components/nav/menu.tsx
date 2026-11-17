"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./menu.module.css";

// type Props = {
//   children?: ReactNode;
// };

// export function Menu({ children }: Props) { })
export function Menu() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // パネルの外側で押し始めたかどうか。描画には使わない値なので、state ではなく ref で持つ。
  const pressedOutsideRef = useRef(false);

  // showModal() で開くと、ブラウザがダイアログの外側（#root を含むページ全体）を inert として扱い、
  // フォーカスの閉じ込め、Esc や戻る操作での閉じる動作、閉じたあとのフォーカスの復帰まで処理する。
  // そのため inert の付け外しや開閉の状態は自分で持たない。
  const open = () => dialogRef.current?.showModal();

  // <dialog> は画面全体を覆うため、パネルの外側のクリックも <dialog> 自身へのクリックとして届く。
  // 中身は外から渡されるので、リンクごとではなくダイアログでまとめてクリックを受ける。
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // パネルの中で押して外側で離した操作（文字の選択など）では閉じないよう、押した位置も見る。
    const trackPress = (event: PointerEvent) => {
      pressedOutsideRef.current = event.target === dialog;
    };

    const closeOnClick = (event: MouseEvent) => {
      const outside = pressedOutsideRef.current && event.target === dialog;
      // ダイアログはレイアウトにあり、ページを移動しても残るため、リンクで移動するときは自分で閉じる。
      const link = event.target instanceof Element && event.target.closest("a[href]");
      if (outside || link) dialog.close();
    };

    dialog.addEventListener("pointerdown", trackPress);
    dialog.addEventListener("click", closeOnClick);
    return () => {
      dialog.removeEventListener("pointerdown", trackPress);
      dialog.removeEventListener("click", closeOnClick);
    };
  }, []);

  return (
    <>
      <button type="button" className={styles.menu} onClick={open} aria-label="Open Menu" aria-haspopup="dialog">
        <svg role="img" aria-hidden="true" width={24} height={24} viewBox="0 0 24 24">
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.72 5.19h18.56M2.72 11.94h18.56M2.72 18.81h18.56"
          ></path>
        </svg>
        <span className={styles.label}>Menu</span>
      </button>

      <dialog ref={dialogRef} className={styles.dialog} aria-label="Menu">
        {/* 開くボタンはダイアログの外側にあり操作できなくなるため、同じ位置に閉じるボタンを重ねる。
            パネルより前に置き、中身の量にかかわらず、開いたときのフォーカスをこのボタンに当てる。 */}
        <form method="dialog">
          <button type="submit" className={styles.menu} aria-label="Close menu">
            <svg role="img" aria-hidden="true" width={24} height={24} viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                <path d="m5 5 14 14"></path>
                <path d="M19 5 5 19"></path>
              </g>
            </svg>
            <span className={styles.label}>Menu</span>
          </button>
        </form>
        <nav className={styles.nav}>
          <ul className={styles.list}>
            <li>Home</li>
            <li>Product</li>
            <li>Feature</li>
            <li>Category</li>
            <li>Blog</li>
            <li>
              {/* Shopify のオンラインストアの「ページ」（ハンドル: contact）を表示する。 */}
              <Link href="/pages/contact">Contact</Link>
            </li>
            {/*<li>Policy</li>*/}
          </ul>
        </nav>
        {/*<div className={styles.panel}>{children}</div>*/}
      </dialog>
    </>
  );
}
