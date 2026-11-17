import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { type CartSeedData, cartHandlers } from "./cart-handlers";
import { createBuyerClient, createBuyerRequestContext } from "./client";

// リクエストの Cookie にあるカートを読む。カートは購入者ごとのデータなので "use cache" には入れず、
// 同じリクエスト内でだけ結果を共有する。
export const seedCart = cache(async (): Promise<CartSeedData> => {
  const requestContext = createBuyerRequestContext({
    headers: await headers(),
  });
  const { data } = await cartHandlers.get({
    storefrontClient: createBuyerClient(requestContext),
  });
  return data;
});
