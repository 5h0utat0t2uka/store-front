"use client";

import Image, { type ImageProps, type ImageLoaderProps } from "next/image";
type ShopifyImageProps = Omit<ImageProps, "src" | "loader" | "unoptimized"> & { src: string };

function shopifyImageLoader({ src, width }: ImageLoaderProps): string {
  const url = new URL(src);
  url.searchParams.set("width", String(width));
  return url.toString();
}

export function ShopifyImage({ src, alt, ...props }: ShopifyImageProps) {
  const url = src.startsWith("/") ? null : new URL(src);
  const isShopifyCdn = url?.origin === "https://cdn.shopify.com";
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      loader={isShopifyCdn ? shopifyImageLoader : undefined}
      unoptimized={url !== null && !isShopifyCdn}
    />
  );
}
