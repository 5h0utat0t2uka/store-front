"use client";

import type { ImageLoaderProps } from "next/image";

const SHOPIFY_CDN_HOST = "cdn.shopify.com";

// next/image の srcset を Shopify CDN の width パラメーターで生成する。
// CDN が Accept ヘッダーに合わせて画像形式も選ぶため、Next.js の画像最適化は通さない。
export default function shopifyImageLoader({
  src,
  width,
}: ImageLoaderProps): string {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    // public 配下などの相対パスはそのまま返す
    return src;
  }
  if (url.protocol !== "https:" || url.hostname !== SHOPIFY_CDN_HOST) {
    return src;
  }
  url.searchParams.set("width", String(width));
  return url.toString();
}
