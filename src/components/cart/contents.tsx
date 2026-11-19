"use client";

import { sanitizeQuantity } from "@shopify/hydrogen";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useId } from "react";
import { useCart, useCartForm, useSuspenseCart } from "@/lib/shopify/cart";
import type { CartLine } from "@/lib/shopify/cart-handlers";
import { formatPrice } from "@/lib/shopify/money";
import styles from "./contents.module.css";

type Props = {
  // パネル内のリンクでページを移動するときに呼ぶ。popover を閉じるために使う。
  onNavigate?: () => void;
};

const MAX_QUANTITY = 99;
// オプションのない商品に Shopify が付けるバリアント名。表示しない。
const DEFAULT_VARIANT_TITLE = "Default Title";

// ヘッダーの popover とカートのページで共有する。
export function CartContents({ onNavigate }: Props) {
  return (
    <Suspense fallback={<p role="status">カートを読み込んでいます…</p>}>
      <CartBody onNavigate={onNavigate} />
    </Suspense>
  );
}

function CartBody({ onNavigate }: Props) {
  // サーバーで読んだカートが届くまでは、上の fallback を表示する。
  const cart = useSuspenseCart((state) => state.data);
  const pending = useCart((state) => state.pending);
  const revalidating = useCart((state) => state.revalidating);
  const errors = useCart((state) => state.errors);
  const lines = cart.lines.nodes;

  // 行に表示できないエラー（通信エラー、カート全体のエラー、既にない行のエラー）をまとめて表示する。
  const lineIds = new Set(lines.map((line) => line.id));
  const bannerMessages = [
    ...errors.network.map((error) => error.message),
    ...errors.cart.userErrors.map((error) => error.message),
    ...[...errors.lines]
      .filter(([lineId]) => !lineIds.has(lineId))
      .flatMap(([, group]) => group.userErrors.map((error) => error.message)),
  ];

  // 行の変更が確定するまで、合計は直前の確定値を薄く表示する。
  const isCostPending = Boolean(pending.cost || revalidating);

  return (
    <div className={styles.contents}>
      {bannerMessages.length > 0 && (
        <div className={styles.error} role="alert">
          {bannerMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      {lines.length === 0 ? (
        <p>カートに商品はありません。</p>
      ) : (
        <>
          {/* list-style: none による Safari のリスト認識の喪失を防ぐ。 */}
          <ul className={styles.lines} role="list">
            {lines.map((line) => (
              <li key={line.id}>
                <Line line={line} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>

          <dl className={styles.summary}>
            <dt>小計</dt>
            <dd data-pending={isCostPending || undefined}>{formatPrice(cart.cost.subtotalAmount)}</dd>
          </dl>

          {cart.checkoutUrl && (
            // Shopify のチェックアウトは別ドメインなので、通常のリンクで移動する。
            <a className={styles.checkout} href={cart.checkoutUrl}>
              購入手続きへ進む
            </a>
          )}
        </>
      )}
    </div>
  );
}

function Line({ line, onNavigate }: Props & { line: CartLine }) {
  const { formProps, register } = useCartForm();
  const isPending = useCart((state) => state.pending.lines.has(line.id));
  const lineErrors = useCart((state) => state.errors.lines.get(line.id));
  const errorId = useId();

  const merchandise = line.merchandise;
  const title = merchandise?.product.title ?? "商品";
  const handle = merchandise?.product.handle;
  const variantTitle = merchandise?.title && merchandise.title !== DEFAULT_VARIANT_TITLE ? merchandise.title : null;
  const messages = lineErrors ? [...lineErrors.userErrors, ...lineErrors.warnings].map((error) => error.message) : [];
  const hasError = messages.length > 0;

  return (
    <div className={styles.line}>
      <div className={styles.thumb}>
        {merchandise?.image && (
          // 隣に商品名があるため、画像は装飾として扱う。
          <Image className={styles.image} src={merchandise.image.url} alt="" width={80} height={80} />
        )}
      </div>

      <div className={styles.lineDetails}>
        <p className={styles.lineTitle}>
          {handle ? (
            <Link href={`/products/${encodeURIComponent(handle)}`} onClick={onNavigate}>
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        {variantTitle && <p>{variantTitle}</p>}
        <p className={styles.price} data-pending={isPending || undefined}>
          {formatPrice(line.cost.totalAmount)}
        </p>

        {/* 数量の入力・増減・削除は Hydrogen のフォームの形に合わせる。JavaScript が無効でも送信できる。 */}
        <form
          className={styles.controls}
          {...formProps({
            beforeSubmit: (event) => {
              const input = event.currentTarget.elements.namedItem("quantity");
              if (input instanceof HTMLInputElement) {
                input.value = String(sanitizeQuantity(input.value, { min: 0, max: MAX_QUANTITY }));
              }
            },
          })}
        >
          {/* 数量の入力欄で Enter を押したときに使われる、非表示の送信ボタン。 */}
          <button {...register("set")} />
          <input type="hidden" {...register("lineId", { value: line.id })} />
          <button {...register("decrease")} aria-label="数量を減らす">
            −
          </button>
          <input
            {...register("quantity", {
              value: line.quantity,
              interactive: true,
            })}
            className={styles.quantity}
            aria-label={`${title}の数量`}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            data-pending={isPending || undefined}
          />
          <button {...register("increase")} aria-label="数量を増やす">
            +
          </button>
          <button {...register("remove")}>削除</button>
        </form>

        {hasError && (
          <div className={styles.error} id={errorId} role="alert">
            {messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
