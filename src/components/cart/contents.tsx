"use client";

import Link from "next/link";
import { Suspense, useId } from "react";
import { ShopifyImage } from "@/components/image/shopify";
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
  const actionsFormId = useId();

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
          <ShopifyImage
            className={styles.image}
            src={merchandise.image.url}
            alt=""
            width={80}
            height={80}
            loading="lazy"
            sizes="auto"
          />
        )}
      </div>

      <div className={styles.details}>
        <p className={styles.title}>
          {handle ? (
            <Link
              href={{
                pathname: `/products/${encodeURIComponent(handle)}`,
                query: Object.fromEntries((merchandise?.selectedOptions ?? []).map(({ name, value }) => [name, value])),
              }}
              onNavigate={onNavigate}
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        {variantTitle && <p className={styles.variant}>{variantTitle}</p>}
        <p className={styles.price} data-pending={isPending || undefined}>
          {formatPrice(line.cost.totalAmount)}
        </p>

        {/* 増減・削除には行の数量を送る。通常の POST でも編集中の入力値を増減の基準にしない。 */}
        <form id={actionsFormId} hidden {...formProps()}>
          <input type="hidden" {...register("lineId", { value: line.id })} />
          <input type="hidden" {...register("quantity", { value: line.quantity })} />
        </form>
        <form className={styles.controls} {...formProps()}>
          {/* 数量の入力欄で Enter を押したときに使われる、非表示の送信ボタン。 */}
          <button {...register("set")} />
          <input type="hidden" {...register("lineId", { value: line.id })} />

          <div className={styles.quantities}>
            <button form={actionsFormId} {...register("decrease")} aria-label="数量を減らす">
              <svg role="img" aria-label="minus" width={24} height={24} viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} d="M20 12H4"></path>
              </svg>
            </button>
            <input
              {...register("quantity", {
                value: line.quantity,
                interactive: true,
              })}
              className={styles.quantity}
              required
              pattern="0*[0-9]{1,2}"
              title={`0から${MAX_QUANTITY}の整数を入力してください。0にするとこの商品を削除します。`}
              onInput={(event) => {
                const input = event.currentTarget;
                if (/^\d+$/.test(input.value) && Number(input.value) > MAX_QUANTITY) {
                  input.value = String(MAX_QUANTITY);
                }
              }}
              onInvalid={(event) => {
                // 空欄で確定したら required が送信を止める。Hydrogen に 0 として渡さず表示を戻す。
                if (event.currentTarget.value.trim() === "") {
                  event.preventDefault();
                  event.currentTarget.value = String(line.quantity);
                }
              }}
              aria-label={`${title}の数量`}
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? errorId : undefined}
              data-pending={isPending || undefined}
            />
            <button
              form={actionsFormId}
              {...register("increase")}
              disabled={line.quantity >= MAX_QUANTITY}
              aria-label="数量を増やす"
            >
              <svg role="img" aria-label="plus" width={24} height={24} viewBox="0 0 24 24">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth={2}
                  d="M12 20v-8m0 0V4m0 8h8m-8 0H4"
                ></path>
              </svg>
            </button>
          </div>

          <button form={actionsFormId} className={styles.remove} {...register("remove")}>
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M6 6v15h12V6M4 6h16M8 6V3h8v3m-6 4v7m4-7v7"
              ></path>
            </svg>
          </button>
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
