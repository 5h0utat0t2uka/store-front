import type { Metadata } from "next";
import Form from "next/form";
import { Suspense, useId } from "react";
import { ProductGrid } from "@/components/card/grid";
import { MAX_SEARCH_TERM_LENGTH, SEARCH_PATH } from "@/lib/shopify/search";
import { searchProducts } from "@/lib/shopify/search-server";
import styles from "./page.module.css";

type SearchParams = PageProps<"/search">["searchParams"];

// ?q=a&q=b のように重複した場合は先頭だけを使う。
function readTerm(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return (first ?? "").trim().slice(0, MAX_SEARCH_TERM_LENGTH);
}

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const term = readTerm((await searchParams).q);
  return {
    title: term ? `「${term}」の検索結果` : "Search",
    description: term ? `「${term}」に一致する商品を検索した結果です。` : undefined,
    alternates: { canonical: term ? `/search?q=${encodeURIComponent(term)}` : "/search" },
    openGraph: {
      type: "website",
      title: term ? `「${term}」の検索結果` : "Search",
      description: term ? `「${term}」に一致する商品を検索した結果です。` : undefined,
      url: term ? `/search?q=${encodeURIComponent(term)}` : "/search",
    },
  };
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
    return <p className={styles.message}>「{term}」に一致する商品は見つかりませんでした。</p>;
  }

  return (
    <>
      <p className={styles.summary}>
        「{term}」の検索結果：
        {totalCount > products.length ? `${totalCount} 件中 ${products.length} 件を表示` : `${products.length} 件`}
      </p>
      <ProductGrid products={products} />
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
