"use client";

import { buildProductSelectionSearchParams, canAddToCart, type SelectedOption } from "@shopify/hydrogen";
import { createProductComponents } from "@shopify/hydrogen/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useSyncExternalStore, useTransition } from "react";
import type { ProductDetail } from "@/lib/shopify";
import { formatPrice, formatPriceRange } from "@/lib/shopify/money";
import styles from "./add-to-cart.module.css";

// 商品ページ全体のデータではなく、商品フォームが使う項目だけをクライアントへ渡す。
export type ProductFormInput = Pick<
  ProductDetail,
  | "id"
  | "title"
  | "handle"
  | "vendor"
  | "priceRange"
  | "requiresSellingPlan"
  | "encodedVariantExistence"
  | "encodedVariantAvailability"
  | "options"
  | "selectedOrFirstAvailableVariant"
  | "adjacentVariants"
>;

const { ProductProvider, useProductForm } = createProductComponents<ProductFormInput>();

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

function variantHref(
  product: ProductFormInput,
  selectedOptions: readonly SelectedOption[],
  base: URLSearchParams,
  handle = product.handle,
) {
  const query = buildProductSelectionSearchParams({
    selectedOptions,
    optionNames: product.options.map((option) => option.name),
    base,
  });
  return `/products/${encodeURIComponent(handle)}?${query}` as const;
}

// 別の商品のページに移ると Link が再マウントされるため、選択した値にフォーカスを戻す。
let pendingFocus: { handle: string; option: string; value: string } | null = null;

function VariantPicker({
  product,
  options,
  register,
}: Props & Pick<ReturnType<typeof useProductForm>, "options" | "register">) {
  const searchParams = useSearchParams();

  return options.map((option) => (
    <fieldset className={styles.option} key={option.name}>
      <legend>{option.name}</legend>
      <div className={styles.values}>
        {option.values.map((value) => {
          if (!value.exists) {
            // 例: 赤/S と 青/M だけの商品でも、実在する組み合わせには直接移れるようにする。
            const alternative = product.options
              .find(({ name }) => name === option.name)
              ?.optionValues.find(({ name }) => name === value.name)?.firstSelectableVariant;
            return (
              <div className={styles.alternative} key={value.name}>
                <button className={styles.value} type="button" disabled>
                  {value.name}（組み合わせなし）
                </button>
                {alternative && (
                  <Link
                    href={variantHref(product, alternative.selectedOptions, searchParams, alternative.product.handle)}
                    data-available={alternative.availableForSale}
                    prefetch={false}
                    replace
                    scroll={false}
                    onNavigate={() => {
                      pendingFocus = { handle: alternative.product.handle, option: option.name, value: value.name };
                    }}
                  >
                    {alternative.title} を選択{!alternative.availableForSale && "（売り切れ）"}
                  </Link>
                )}
              </div>
            );
          }
          return (
            <Link
              key={value.name}
              className={styles.value}
              href={variantHref(product, value.selectedOptions, searchParams, value.handle)}
              scroll={false}
              prefetch={false}
              aria-current={value.selected ? "true" : undefined}
              data-available={value.available}
              ref={(link) => {
                if (
                  link &&
                  pendingFocus?.handle === product.handle &&
                  pendingFocus.option === option.name &&
                  pendingFocus.value === value.name
                ) {
                  pendingFocus = null;
                  link.focus({ preventScroll: true });
                }
              }}
              onNavigate={(event) => {
                if (value.handle !== product.handle) {
                  pendingFocus = { handle: value.handle, option: option.name, value: value.name };
                  return;
                }
                event.preventDefault();
                if (!value.selected) register("optionValue", { optionName: option.name, value: value.name }).onClick();
              }}
            >
              {value.name}
              {/*{!value.available && "（売り切れ）"}*/}
            </Link>
          );
        })}
      </div>
    </fieldset>
  ));
}

export function AddToCart({ product }: Props) {
  const router = useRouter();
  const [isSelecting, startTransition] = useTransition();
  return (
    <ProductProvider
      product={product}
      onSelect={(result) => {
        const href = variantHref(product, result.selectedOptions, new URLSearchParams(window.location.search));
        startTransition(() => router.replace(href, { scroll: false }));
      }}
    >
      <PurchaseControls product={product} isSelecting={isSelecting} />
    </ProductProvider>
  );
}

function PurchaseControls({ product, isSelecting }: Props & { isSelecting: boolean }) {
  const { options, selectedVariant, register, formProps, errors, matchedLineItem, pending } = useProductForm();
  const errorId = useId();
  const hydrated = useHydrated();

  // サーバーが出力する HTML は購入者のカートを含まない。一方 useProductForm は、ハイドレーション中も
  // ブラウザで読み込み済みのカートを返すため、カートに由来する表示はハイドレーションの後に出す。
  const lineInCart = hydrated ? matchedLineItem : null;
  const cartErrors = hydrated ? [...errors.userErrors, ...errors.warnings, ...errors.networkErrors] : [];

  // バリアントが選択済みで、購入可能で、定期購入専用でないときだけ追加できる。
  const addable = canAddToCart(product, options);
  let availability = isSelecting ? "選択内容を確認中…" : "オプションを選択してください";
  if (selectedVariant) availability = addable ? "購入可能" : "現在購入できません";
  const price = selectedVariant
    ? formatPrice(selectedVariant.price)
    : formatPriceRange(product.priceRange.minVariantPrice, product.priceRange.maxVariantPrice);
  const messages = cartErrors.map((error) => error.message);

  const form = (
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
        {pending ? (
          <svg role="img" aria-hidden="true" width={24} height={24} viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
              opacity={0.25}
            ></path>
            <path
              fill="currentColor"
              d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
            >
              <animateTransform
                attributeName="transform"
                dur="0.75s"
                repeatCount="indefinite"
                type="rotate"
                values="0 12 12;360 12 12"
              ></animateTransform>
            </path>
          </svg>
        ) : (
          <svg role="img" aria-hidden="true" width={24} height={24} viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
              <path d="M3.977 9.84A2 2 0 0 1 5.971 8h12.058a2 2 0 0 1 1.994 1.84l.803 10A2 2 0 0 1 18.833 22H5.167a2 2 0 0 1-1.993-2.16z"></path>
              <path d="M16 11V6a4 4 0 0 0-4-4v0a4 4 0 0 0-4 4v5"></path>
            </g>
          </svg>
        )}
        {addable ? "カートに追加" : availability}
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

  return (
    <>
      <div aria-live="polite" aria-atomic="true">
        <p className={styles.price}>{price}</p>
        {/*<p>{availability}</p>*/}
      </div>
      {options.some((option) => option.values.length > 1) && (
        <VariantPicker product={product} options={options} register={register} />
      )}
      {form}
    </>
  );
}
