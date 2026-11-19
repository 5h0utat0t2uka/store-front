"use client";

import type { ComponentProps, ReactNode } from "react";
import { CartProvider } from "@/lib/shopify/cart";

type Props = {
  cartData: ComponentProps<typeof CartProvider>["initialData"];
  children: ReactNode;
};

export function CartRoot({ cartData, children }: Props) {
  return <CartProvider initialData={cartData}>{children}</CartProvider>;
}
