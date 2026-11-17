import type { Metadata } from "next";
import Form from "next/form";
import { Suspense, useId } from "react";
import { ItemCard } from "@/components/card/item";
import { MAX_SEARCH_TERM_LENGTH, SEARCH_PATH } from "@/lib/shopify/search";
import { searchProducts } from "@/lib/shopify/search-server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: false },
};

// page.module.css の列数・余白と item.module.css のカード内余白・枠線に合わせる。
const PRODUCT_IMAGE_SIZES = [
  "(width >= 60rem) calc((min(100vw, 72rem) - clamp(2rem, 8vw, 6rem) - 2rem) / 3 - 3rem - 2px)",
  "(width >= 40rem) calc((100vw - clamp(2rem, 8vw, 6rem) - 1rem) / 2 - 3rem - 2px)",
  "calc(100vw - clamp(2rem, 8vw, 6rem) - 3rem - 2px)",
].join(", ");

// 一覧は最大3列。先頭行のどの画像もLCPになり得るため、先頭3枚は遅延しない。
const EAGER_PRODUCT_IMAGE_COUNT = 3;

type SearchParams = PageProps<"/search">["searchParams"];

// ?q=a&q=b のように重複した場合は先頭だけを使う。
function readTerm(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return (first ?? "").trim().slice(0, MAX_SEARCH_TERM_LENGTH);
}

// 送信は GET /search?q=… への遷移。JavaScript が読み込まれる前でも通常のフォームとして動く。
function SearchForm({ term }: { term: string }) {
  const inputId = useId();

  return (
    <search>
      <Form className={styles.form} action={SEARCH_PATH}>
        <label htmlFor={inputId}>キーワード</label>
        <div>
          <input
            // defaultValue は初回の描画にしか反映されないため、キーワードが変わったら作り直す。
            key={term}
            id={inputId}
            type="search"
            name="q"
            defaultValue={term}
            maxLength={MAX_SEARCH_TERM_LENGTH}
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit">検索する</button>
        </div>
      </Form>
    </search>
  );
}

async function Results({ term }: { term: string }) {
  const { products, totalCount } = await searchProducts(term);
  if (products.length === 0) {
    return (
      <p className={styles.message}>
        「{term}」に一致する商品は見つかりませんでした。
      </p>
    );
  }

  return (
    <>
      <p className={styles.summary}>
        「{term}」の検索結果：
        {totalCount > products.length
          ? `${totalCount} 件中 ${products.length} 件を表示`
          : `${products.length} 件`}
      </p>
      {/* biome-ignore lint/a11y/noRedundantRoles: list-style: none による Safari のリスト認識の喪失を防ぐ。 */}
      <ul className={styles.products} role="list">
        {products.map((product, index) => (
          <li key={product.id}>
            <ItemCard
              product={product}
              sizes={PRODUCT_IMAGE_SIZES}
              loading={index < EAGER_PRODUCT_IMAGE_COUNT ? "eager" : "lazy"}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

// URL のキーワードはリクエストごとの値なので、読む処理は <Suspense> の内側に置く。
async function Search({ searchParams }: { searchParams: SearchParams }) {
  const term = readTerm((await searchParams).q);

  return (
    <>
      <SearchForm term={term} />
      {term ? (
        // key を付けて、別のキーワードで検索し直したときにも読み込み中の表示に切り替える。
        <Suspense
          key={term}
          fallback={
            <p className={styles.message} role="status">
              検索しています…
            </p>
          }
        >
          <Results term={term} />
        </Suspense>
      ) : (
        <p className={styles.message}>キーワードを入力して検索してください。</p>
      )}
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className={styles.main}>
      <h1>Search</h1>
      {/* キーワードが届くまでは、空の検索フォームを先に表示する。 */}
      <Suspense fallback={<SearchForm term="" />}>
        <Search searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
