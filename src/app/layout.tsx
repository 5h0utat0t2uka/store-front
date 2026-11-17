import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "gen-interface-jp/400.css";
import "gen-interface-jp/600.css";
import "gen-interface-jp/700.css";
import "@/styles/reset.css";
import "@/styles/globals.css";

import { CartRoot } from "@/components/cart/provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Menu } from "@/components/nav/menu";
import { getShopMetadata, getShopPolicyLinks } from "@/lib/shopify";
import { seedCart } from "@/lib/shopify/cart-server";

// アプリ全体で、App Shell とリンクごとの先読みを静的な出力に限定する。
// リクエストごとの内容は <Suspense> の内側に置き、遷移後にストリームで届ける。
export const ensureStatic = "prefetch";

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
  // キャッシュした結果をビルド時に静的シェルへ含め、cacheLife の間隔で再検証する。
  const shop = await getShopMetadata();
  const title = { template: `${shop.name} ・ %s`, default: shop.name };
  const description = shop.description?.trim() || shop.name;
  const url = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  return {
    metadataBase: new URL(url),
    title,
    description,
    openGraph: { title, description, images: ["/ogp.png"] },
  };
}

async function ShopHeader() {
  const shop = await getShopMetadata();
  return <Header name={shop.name} />;
}

async function ShopFooter() {
  // どちらもキャッシュした結果を使うため、静的なシェルに含まれる。
  const [shop, policies] = await Promise.all([
    getShopMetadata(),
    getShopPolicyLinks(),
  ]);
  return <Footer name={shop.name} policies={policies} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  // await しない。未解決の Promise のままクライアントのストアへ渡し、
  // カートの読み取りで静的なシェルの表示を止めない。
  const cartData = seedCart();

  return (
    <html lang="ja">
      <head>
        {/* カートのストアが変更の送信に使う Shopify の Standard Actions。 */}
        <script
          crossOrigin="anonymous"
          defer
          id="shopify-standard-actions"
          src="https://cdn.shopify.com/storefront/standard-actions.js"
          type="module"
        />
      </head>
      <body>
        <div id="root">
          <CartRoot cartData={cartData}>
            <Suspense fallback={<Header name="" />}>
              <ShopHeader />
            </Suspense>
            {children}
            <Suspense fallback={<Footer name="" />}>
              <ShopFooter />
            </Suspense>
          </CartRoot>
          <Menu />
          {/*<Menu>
            <ul>
              <li>Home</li>
              <li>Product</li>
              <li>Feature</li>
              <li>Category</li>
              <li>Blog</li>
              <li>Contact</li>
            </ul>
          </Menu>*/}
        </div>
      </body>
    </html>
  );
}
