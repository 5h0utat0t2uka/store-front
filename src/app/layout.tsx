import type { Metadata, Viewport } from "next";
import { io } from "next/cache";
import { Suspense } from "react";
import "gen-interface-jp/400.css";
import "gen-interface-jp/600.css";
import "gen-interface-jp/700.css";
import "@/styles/globals.css";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getShopMetadata } from "@/lib/shopify";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  // themeColor: [
  //   { media: "(prefers-color-scheme: light)", color: "#f8f8f8" },
  //   { media: "(prefers-color-scheme: dark)", color: "#161616" },
  // ],
};

export async function generateMetadata(): Promise<Metadata> {
  // ビルド時ではなく、実行環境のトークンを使ってストア情報を取得する。
  await io();
  const shop = await getShopMetadata();
  const title = { template: `${shop.name} ・ %s`, default: shop.name };
  const description = shop.description?.trim() || shop.name;
  const url = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  return {
    metadataBase: new URL(url),
    alternates: { canonical: `/` },
    title,
    description,
    openGraph: { title, description, images: ["/ogp.png"] },
  };
}

async function ShopHeader() {
  await io();
  const shop = await getShopMetadata();
  return <Header name={shop.name} />;
}

async function ShopFooter() {
  await io();
  const shop = await getShopMetadata();
  return <Footer name={shop.name} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>
        <Suspense fallback={<Header name="" />}>
          <ShopHeader />
        </Suspense>
        {children}
        <Suspense fallback={<Footer name="" />}>
          <ShopFooter />
        </Suspense>
      </body>
    </html>
  );
}
