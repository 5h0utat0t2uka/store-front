"use client";

import { canAddToCart } from "@shopify/hydrogen";
import { createProductComponents } from "@shopify/hydrogen/react";
import { useId, useSyncExternalStore } from "react";
import type { ProductDetail } from "@/lib/shopify";
import styles from "./add-to-cart.module.css";

// 商品ページ全体のデータではなく、商品フォームが使う項目だけをクライアントへ渡す。
export type ProductFormInput = Pick<
  ProductDetail,
  | "id"
  | "title"
  | "handle"
  | "vendor"
  | "requiresSellingPlan"
  | "encodedVariantExistence"
  | "encodedVariantAvailability"
  | "options"
  | "selectedOrFirstAvailableVariant"
  | "adjacentVariants"
>;

const { ProductProvider, useProductForm } =
  createProductComponents<ProductFormInput>();

type Props = {
  product: ProductFormInput;
};

const subscribeToNothing = () => () => {};

// サーバーでの描画とハイドレーション中は false、ハイドレーションが済むと true になる。
function useHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

export function AddToCart({ product }: Props) {
  return (
    <ProductProvider product={product}>
      <AddToCartForm product={product} />
    </ProductProvider>
  );
}

function AddToCartForm({ product }: Props) {
  const {
    options,
    selectedVariant,
    register,
    formProps,
    errors,
    matchedLineItem,
    pending,
  } = useProductForm();
  const errorId = useId();
  const hydrated = useHydrated();

  // サーバーが出力する HTML は購入者のカートを含まない。一方 useProductForm は、ハイドレーション中も
  // ブラウザで読み込み済みのカートを返すため、カートに由来する表示はハイドレーションの後に出す。
  const lineInCart = hydrated ? matchedLineItem : null;
  const cartErrors = hydrated
    ? [...errors.userErrors, ...errors.warnings, ...errors.networkErrors]
    : [];

  // バリアントが選択済みで、購入可能で、定期購入専用でないときだけ追加できる。
  const addable = canAddToCart(product, options);
  const label = addable
    ? "カートに追加"
    : selectedVariant
      ? "現在購入できません"
      : "オプションを選択してください";
  const messages = cartErrors.map((error) => error.message);

  return (
    // 送信はカートのストアが処理する。JavaScript が読み込まれる前は /api/cart へ通常の POST を行う。
    <form className={styles.form} {...formProps()}>
      <input type="hidden" {...register("merchandiseId", {})} />
      <input type="hidden" {...register("quantity", { value: 1 })} />
      <button
        {...register("addToCart", {})}
        className={styles.button}
        disabled={!addable || pending}
        aria-describedby={messages.length > 0 ? errorId : undefined}
      >
        {pending && (
          <svg
            role="img"
            aria-hidden="true"
            width={24}
            height={24}
            viewBox="0 0 24 24"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 0 1-18 0m0 0a9 9 0 0 1 9-9"
            ></path>
          </svg>
        )}
        {label}
      </button>
      <p role="status" className={styles.status}>
        {lineInCart && `カートに ${lineInCart.quantity} 点入っています`}
      </p>
      {messages.length > 0 && (
        <div className={styles.error} id={errorId} role="alert">
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
    </form>
  );
}
