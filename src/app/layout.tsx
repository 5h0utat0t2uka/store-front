import type { Metadata } from "next";
import "gen-interface-jp/400.css";
import "gen-interface-jp/600.css";
import "gen-interface-jp/700.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "store-front | 商品",
  description: "store-frontの商品と販売状況をご覧いただけます。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
