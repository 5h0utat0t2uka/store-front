"use client";

import Link from "next/link";
import { useId, useRef } from "react";
import { CartContents } from "@/components/cart/contents";
import { useCart } from "@/lib/shopify/cart";
import styles from "./index.module.css";

export function Cart() {
  const popoverId = useId();
  // const headingId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  // 追加・変更の直後から、サーバーの確定を待たずに反映される。
  const quantity = useCart((state) => state.data.totalQuantity);

  // 開閉・外側のクリック・Esc での閉じる動作は、popovertarget と popover 属性でブラウザが処理する。
  // ヘッダーはページを移動しても残るため、パネル内のリンクで移動するときは自分で閉じる。
  const close = () => popoverRef.current?.hidePopover();

  return (
    <>
      <button
        type="button"
        aria-label={quantity > 0 ? `カート（${quantity}点）` : "カート"}
        className={styles.cart}
        popoverTarget={popoverId}
      >
        <svg role="img" aria-hidden="true" width={24} height={24} viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
            <path d="M3.977 9.84A2 2 0 0 1 5.971 8h12.058a2 2 0 0 1 1.994 1.84l.803 10A2 2 0 0 1 18.833 22H5.167a2 2 0 0 1-1.993-2.16z"></path>
            <path d="M16 11V6a4 4 0 0 0-4-4v0a4 4 0 0 0-4 4v5"></path>
          </g>
        </svg>
        {quantity > 0 && (
          <span className={styles.count} aria-hidden="true">
            {quantity}
          </span>
        )}
      </button>

      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        role="dialog"
        // aria-labelledby={headingId}
        aria-label="カート"
        className={styles.popover}
      >
        {/*<h2 id={headingId}>カート</h2>*/}
        <CartContents onNavigate={close} />
        <Link className={styles.link} href="/cart" onClick={close}>
          カートのページを開く
        </Link>
      </div>
    </>
  );
}
