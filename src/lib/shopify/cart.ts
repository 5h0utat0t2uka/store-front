"use client";

import { createCartComponents } from "@shopify/hydrogen/react";
import type { cartHandlers } from "./cart-handlers";

// カートの状態は Hydrogen のストアが持つ。追加・変更は即座に画面へ反映され、
// サーバーの応答で確定するか、失敗した変更だけが取り消される。
export const { CartProvider, useCart, useSuspenseCart, useCartForm } = createCartComponents<typeof cartHandlers>();
