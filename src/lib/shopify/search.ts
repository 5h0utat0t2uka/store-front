import { createShopifyRouteTemplates, getSearchResultUrl } from "@shopify/hydrogen";
import type { Route } from "next";

// 検索結果のページ。検索フォームの送信先と、候補から検索結果へ進むリンクに使う。
export const SEARCH_PATH = "/search";

// 検索キーワードの上限。入力欄の maxlength と、サーバーでの切り詰めの両方に使う。
export const MAX_SEARCH_TERM_LENGTH = 100;

// 商品ページなどのパスは Shopify の標準（/products/:handle、/search）のまま使うため、上書きしない。
// 候補のリンクを組み立てる getPredictiveSearchItemUrl に渡す。
export const routeTemplates = createShopifyRouteTemplates({});

export type SearchCursor = { after: string } | { before: string };

export function getSearchUrl(term: string, cursor?: SearchCursor): Route {
  return getSearchResultUrl({ baseUrl: SEARCH_PATH, term, params: cursor }) as Route;
}
