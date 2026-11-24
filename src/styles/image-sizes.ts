// sizes の幅指定では CSS の var() を参照できないため、globals.css の --space と main の内幅を表す。
const SPACE = "clamp(1rem, 0.368rem + 3.16vw, 1.75rem)";
export const MAIN_WIDTH = `calc(min(100vw, 72rem) - 2 * ${SPACE})`;

// 14rem のカードが n 枚入る画面幅の目安は、左右の余白と列間を含めて n × 14rem + (n + 1) × 1.75rem。
export const PRODUCT_CARD_SIZES = [
  "(min-width: 64.75rem) calc((min(100vw, 72rem) - 5 * 1.75rem) / 4)",
  "(min-width: 49rem) calc((100vw - 4 * 1.75rem) / 3)",
  `calc((100vw - 3 * ${SPACE}) / 2)`,
].join(", ");

// 商品詳細の2カラム時は、ギャラリーが main の内幅の58%を占める。
const TWO_COLUMN_GALLERY = "(min-aspect-ratio: 0.8)";
const GALLERY_WIDTH = `calc(${MAIN_WIDTH} * 0.58)`;
export const PRODUCT_HERO_SIZES = `${TWO_COLUMN_GALLERY} ${GALLERY_WIDTH}, ${MAIN_WIDTH}`;
export const PRODUCT_GALLERY_SIZES = [
  "auto",
  `${TWO_COLUMN_GALLERY} calc((${GALLERY_WIDTH} - 2 * ${SPACE}) / 3)`,
  MAIN_WIDTH,
].join(", ");
