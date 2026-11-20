"use client";

import { getPredictiveSearchItemUrl, readPredictiveSearchFormTerm } from "@shopify/hydrogen";
import {
  PredictiveSearchProvider,
  usePredictiveSearch,
  usePredictiveSearchActions,
  usePredictiveSearchForm,
} from "@shopify/hydrogen/react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent as ReactMouseEvent, useEffect, useId, useRef, useState } from "react";
import { formatPrice } from "@/lib/shopify/money";
import { getSearchUrl, MAX_SEARCH_TERM_LENGTH, routeTemplates, SEARCH_PATH } from "@/lib/shopify/search";
import styles from "./index.module.css";

// 入力中の候補は /api/predictive-search から取得する。入力の間引き（既定で 150 ミリ秒）と、
// 古い応答の破棄は Hydrogen のストアが処理する。商品と、キーワードの候補をそれぞれ 4 件まで受け取る。
// Hydrogen の既定では購入できない商品を候補から除外するため、検索結果のページ（search-server.ts）と
// 同じく、除外せずに末尾へ並べる。
export function Search() {
  return (
    <PredictiveSearchProvider limit={4} types={["PRODUCT", "QUERY"]} unavailableProducts="LAST">
      <SearchDialog />
    </PredictiveSearchProvider>
  );
}

function SearchDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [pointerFocus, setPointerFocus] = useState(false);
  // 背景の上で押し始めたかどうか。描画には使わない値なので、state ではなく ref で持つ。
  const pressedOnBackdropRef = useRef(false);
  const inputId = useId();
  const router = useRouter();
  const { clear } = usePredictiveSearchActions();
  const { formProps, register } = usePredictiveSearchForm();

  // 入口は /search へのリンクにして、JavaScript が読み込まれる前でも検索のページへ進めるようにする。
  // 読み込み後は通常のクリックだけをダイアログに切り替え、新しいタブで開く操作などはリンクのまま動かす。
  const open = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    // Enter など、クリック回数が 0 の起動ではフォーカス枠を表示する。
    setPointerFocus(event.detail > 0);
    // showModal() で開くと、外側を操作できなくする処理、フォーカスの閉じ込め、
    // Esc で閉じる動作、閉じたあとのフォーカスの復帰までブラウザが処理する。
    dialogRef.current?.showModal();
  };

  // ヘッダーはページを移動しても残るため、候補のリンクで移動するときは自分で閉じる。
  const close = () => dialogRef.current?.close();

  // 閉じ方（ボタン、Esc、外側のクリック、リンク）にかかわらず、次に開いたときは空の状態から始める。
  const reset = () => {
    formRef.current?.reset();
    clear();
  };

  // 外側のクリックで閉じる動作は closedby="any" でブラウザが処理する。
  // closedby に対応していないブラウザでだけ、同じ動作をここで補う。
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    // 背景（::backdrop）のクリックは <dialog> 自身へのクリックとして届く。
    // 枠線の上のクリックと区別するため、ダイアログの矩形の外かどうかも見る。
    const isOnBackdrop = (event: MouseEvent | PointerEvent) => {
      if (event.target !== dialog) return false;
      const rect = dialog.getBoundingClientRect();
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      );
    };

    // 入力欄の文字を選択しながら外側で離した操作では閉じないよう、押した位置も見る。
    const trackPress = (event: PointerEvent) => {
      pressedOnBackdropRef.current = isOnBackdrop(event);
    };
    const closeOnBackdropClick = (event: MouseEvent) => {
      if (pressedOnBackdropRef.current && isOnBackdrop(event)) dialog.close();
    };

    dialog.addEventListener("pointerdown", trackPress);
    dialog.addEventListener("click", closeOnBackdropClick);
    return () => {
      dialog.removeEventListener("pointerdown", trackPress);
      dialog.removeEventListener("click", closeOnBackdropClick);
    };
  }, []);

  return (
    <>
      <Link className={styles.search} href={SEARCH_PATH} onClick={open} aria-label="検索" aria-haspopup="dialog">
        <svg role="img" aria-hidden="true" width={24} height={24} viewBox="0 0 24 24">
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m21 21l-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314"
          ></path>
        </svg>
      </Link>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label="商品を検索"
        closedby="any"
        onPointerDownCapture={() => setPointerFocus(true)}
        onKeyDownCapture={() => setPointerFocus(false)}
        onClose={reset}
      >
        {/* 送信先は GET /search?q=…。JavaScript が動いているときはページを読み込み直さずに移動する。 */}
        {/* formProps() が返す onSubmit は既定では何もしないため、送信の処理は onSubmit で上書きする。 */}
        {/* ref を読む関数を描画中に formProps() へ渡すと、React Compiler がこのコンポーネントを最適化しない。 */}
        <form
          ref={formRef}
          className={styles.form}
          data-pointer-focus={pointerFocus || undefined}
          {...formProps()}
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = readPredictiveSearchFormTerm(new FormData(event.currentTarget)).trim();
            if (!trimmed) return;
            router.push(getSearchUrl(trimmed));
            close();
          }}
        >
          <label className={styles.label} htmlFor={inputId}>
            <svg role="img" aria-hidden="true" width={20} height={20} viewBox="0 0 24 24">
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m21 21l-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314"
              ></path>
            </svg>
            <span className={styles.visuallyHidden}>検索キーワード</span>
          </label>
          {/* 開いたときのフォーカスは、ダイアログ内で最初にフォーカスできるこの入力欄に当たる。 */}
          <input
            {...register("query", {
              id: inputId,
              className: styles.input,
              placeholder: "商品を検索",
              maxLength: MAX_SEARCH_TERM_LENGTH,
              enterKeyHint: "search",
              autoCorrect: "off",
            })}
          />
          <button type="button" className={styles.close} onClick={close} aria-label="検索を閉じる">
            <svg role="img" aria-hidden="true" width={20} height={20} viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                <path d="m5 5 14 14"></path>
                <path d="M19 5 5 19"></path>
              </g>
            </svg>
          </button>
        </form>
        <Suggestions onNavigate={close} />
      </dialog>
    </>
  );
}

type SuggestionsProps = {
  onNavigate: () => void;
};

function Suggestions({ onNavigate }: SuggestionsProps) {
  // term は入力中のキーワード、result は最後に成功した検索の結果。
  // 次の結果が届くまでは前の結果が残るため、読み込み中は薄く表示する。
  const { term, status, result } = usePredictiveSearch();
  const { products, queries } = result.items;
  const failed = status === "error";

  let message = "";
  if (status === "loading" || status === "success") {
    if (products.length > 0) {
      message = `商品の候補 ${products.length} 件`;
    } else if (status === "loading") {
      message = "検索しています…";
    } else {
      message = `「${result.term}」に一致する商品の候補はありません。`;
    }
  }

  return (
    <div className={styles.results} aria-busy={status === "loading"}>
      {/* 読み上げに変化を伝えるため、空のときも要素は残す。 */}
      <p className={styles.status} role="status">
        {message}
      </p>
      {failed && (
        <p className={styles.error} role="alert">
          候補を取得できませんでした。そのまま検索すると、検索結果のページを開けます。
        </p>
      )}
      {!failed && queries.length > 0 && (
        <ul
          className={styles.queries}
          // list-style: none による Safari のリスト認識の喪失を防ぐ。
          role="list"
          aria-label="キーワードの候補"
        >
          {queries.map((query) => (
            <li key={query.text}>
              {/* リンクには Shopify が返した trackingParameters が含まれる。 */}
              <Link
                href={
                  getPredictiveSearchItemUrl(query, {
                    routes: routeTemplates,
                  }) as Route
                }
                onClick={onNavigate}
              >
                {query.text}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!failed && products.length > 0 && (
        // list-style: none による Safari のリスト認識の喪失を防ぐ。
        <ul className={styles.products} role="list" aria-label="商品の候補">
          {products.map((product) => {
            const variant = product.selectedOrFirstAvailableVariant;
            const image = variant?.image;
            return (
              <li key={product.id}>
                <Link
                  className={styles.product}
                  href={
                    getPredictiveSearchItemUrl(product, {
                      routes: routeTemplates,
                      term: result.term,
                    }) as Route
                  }
                  onClick={onNavigate}
                >
                  <span className={styles.thumbnail}>
                    {/* 商品名を隣に表示するため、画像は装飾として扱う。 */}
                    <Image
                      src={image?.url ?? "/placehold.svg"}
                      alt=""
                      width={56}
                      height={56}
                      // ローカルの代替画像は Shopify CDN のリサイズ対象外。
                      unoptimized={!image}
                    />
                  </span>
                  <span className={styles.title}>{product.title}</span>
                  {variant && <span className={styles.price}>{formatPrice(variant.price)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {status !== "idle" && term && (
        <Link className={styles.all} href={getSearchUrl(term)} onClick={onNavigate}>
          「{term}」の検索結果をすべて見る
        </Link>
      )}
    </div>
  );
}
