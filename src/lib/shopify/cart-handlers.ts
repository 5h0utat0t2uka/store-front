import "server-only";
import { type CartDataFromHandlers, type CartGetData, createCartServerHandlers } from "@shopify/hydrogen";

// /api/cart の取得（GET）と変更（POST）を処理する。proxy.ts の handleShopifyRoutes に登録する。
export const cartHandlers = createCartServerHandlers();

export type Cart = CartDataFromHandlers<typeof cartHandlers>;
export type CartLine = Cart["lines"]["nodes"][number];
// サーバーで読んだカートをクライアントのストアへ渡すときの形（{ cart, errors? }）。
export type CartSeedData = CartGetData<Cart>;
