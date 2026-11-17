import { formatMoney, type MoneyV2 } from "@shopify/hydrogen";

const LOCALE = "ja-JP";

// 円記号は実行環境によって全角（￥, U+FFE5）と半角（¥, U+00A5）に分かれる。
// Node.js は全角、Safari は半角を返すため、サーバーとブラウザの両方で描画するカートでは
// ハイドレーションの不一致になる。どの環境でも半角にそろえる。
function normalizeYenSign(text: string): string {
  return text.replaceAll("￥", "¥");
}

// 金額は Shopify が返した値をそのまま整形する。クライアントでは計算しない。
export function formatPrice(money: MoneyV2): string {
  return normalizeYenSign(formatMoney(money, { locale: LOCALE }).toString());
}

// 最低価格と最高価格が同じ場合は、1 つの価格として表示される。
export function formatPriceRange(min: MoneyV2, max: MoneyV2): string {
  return normalizeYenSign(formatMoney([min, max], { locale: LOCALE }).toString());
}
