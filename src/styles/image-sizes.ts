// sizes の幅指定では CSS の var() を参照できないため、globals.css の --space と main の内幅を表す。
const SPACE = "clamp(1rem, 0.368rem + 3.16vw, 1.75rem)";
export const MAIN_WIDTH = `calc(min(100vw, 72rem) - 2 * ${SPACE})`;

// 特集一覧は、18rem のカードと列間が main の内幅に収まる数だけ並ぶ。
export const FEATURE_LIST_SIZES = [
  `(min-width: calc(54rem + 4 * ${SPACE})) calc((${MAIN_WIDTH} - 2 * ${SPACE}) / 3)`,
  `(min-width: calc(36rem + 3 * ${SPACE})) calc((${MAIN_WIDTH} - ${SPACE}) / 2)`,
  MAIN_WIDTH,
].join(", ");

// 14rem のカードが n 枚入る画面幅の目安は、左右の余白と列間を含めて n × 14rem + (n + 1) × 1.75rem。
export const PRODUCT_CARD_SIZES = [
  "(min-width: 64.75rem) calc((min(100vw, 72rem) - 5 * 1.75rem) / 4)",
  "(min-width: 49rem) calc((100vw - 4 * 1.75rem) / 3)",
  `calc((100vw - 3 * ${SPACE}) / 2)`,
].join(", ");

// 商品詳細の2カラム時は、ギャラリーが main の内幅の58%を占める。
export const PRODUCT_HERO_SIZES = `(min-aspect-ratio: 0.8) calc(${MAIN_WIDTH} * 0.58), ${MAIN_WIDTH}`;
