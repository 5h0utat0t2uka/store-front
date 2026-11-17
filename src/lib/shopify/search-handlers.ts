import "server-only";
import { createPredictiveSearchServerHandlers } from "@shopify/hydrogen";

// 入力中の候補を返す /api/predictive-search（GET）を処理する。proxy.ts の handleShopifyRoutes に登録する。
// 件数や種類はヘッダーの検索ダイアログ（PredictiveSearchProvider）が URL のパラメーターで指定する。
export const predictiveSearchHandlers = createPredictiveSearchServerHandlers();
