import type { Metadata, ResolvingMetadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, useId } from "react";
import { ProductGrid } from "@/components/card/grid";
import { createPageMetadata } from "@/lib/metadata";
import { getSearchUrl, MAX_SEARCH_TERM_LENGTH, SEARCH_PATH, type SearchCursor } from "@/lib/shopify/search";
import { searchProducts } from "@/lib/shopify/search-server";
import styles from "./page.module.css";

type SearchParams = PageProps<"/search">["searchParams"];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readSearch(params: Awaited<SearchParams>): { term: string; cursor?: SearchCursor } {
  const term = (firstParam(params.q) ?? "").trim().slice(0, MAX_SEARCH_TERM_LENGTH);
  const after = firstParam(params.after);
  const before = firstParam(params.before);
  if (after && before) notFound();
  if (term && after) return { term, cursor: { after } };
  if (term && before) return { term, cursor: { before } };
  return { term };
}

export async function generateMetadata(
  { searchParams }: PageProps<"/search">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { term, cursor } = readSearch(await searchParams);
  const title = term ? `「${term}」の検索結果` : "Search";
  const description = term ? `「${term}」に一致する商品を検索した結果です。` : undefined;
  const url = term ? getSearchUrl(term, cursor) : SEARCH_PATH;
  return createPageMetadata({ title, description, url }, parent);
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
          <button type="submit">検索</button>
        </div>
      </Form>
    </search>
  );
}

async function Results({ term, cursor }: { term: string; cursor?: SearchCursor }) {
  const { products, totalCount, pageInfo } = await searchProducts(term, cursor);
  if (products.length === 0) {
    if (cursor) {
      return (
        <p className={styles.message}>
          このページには商品がありません。<Link href={getSearchUrl(term)}>最初のページへ</Link>
        </p>
      );
    }
    return <p className={styles.message}>「{term}」に一致する商品は見つかりませんでした。</p>;
  }
  const previous = (pageInfo.hasPreviousPage || (cursor && "after" in cursor)) && pageInfo.startCursor;
  const next = (pageInfo.hasNextPage || (cursor && "before" in cursor)) && pageInfo.endCursor;

  return (
    <>
      <p className={styles.summary}>
        「{term}」の検索結果：
        {totalCount > products.length ? `${totalCount} 件中 ${products.length} 件を表示` : `${products.length} 件`}
      </p>
      <ProductGrid products={products} heading="h2" />
      {(previous || next) && (
        <nav className={styles.pagination} aria-label="検索結果のページ送り">
          {previous && <Link href={getSearchUrl(term, { before: previous })}>前のページ</Link>}
          {next && <Link href={getSearchUrl(term, { after: next })}>次のページ</Link>}
        </nav>
      )}
    </>
  );
}

// URL のキーワードはリクエストごとの値なので、読む処理は <Suspense> の内側に置く。
async function Search({ searchParams }: { searchParams: SearchParams }) {
  const { term, cursor } = readSearch(await searchParams);

  return (
    <>
      <SearchForm term={term} />
      {term ? (
        // キーワードやページが変わったら、その検索結果の読み込み状態を表示する。
        <Suspense
          key={getSearchUrl(term, cursor)}
          fallback={
            <p className={styles.message} role="status">
              検索しています…
            </p>
          }
        >
          <Results term={term} cursor={cursor} />
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
