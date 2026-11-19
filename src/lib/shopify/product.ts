import "server-only";
import { gql } from "@shopify/hydrogen";

export const UNASSIGNED_CATEGORY_LABEL = "カテゴリ未設定";

export const PRODUCT_CARD_FRAGMENT = gql(`
  fragment ProductCardFields on Product {
    id
    handle
    title
    availableForSale
    category {
      name
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      url
      altText
      width
      height
    }
  }
`);

export const PRODUCT_VARIANT_FRAGMENT = gql(`
  fragment ProductVariantFields on ProductVariant {
    id
    title
    availableForSale
    selectedOptions {
      name
      value
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    product {
      handle
      title
    }
    sku
    image {
      url
      altText
      width
      height
    }
  }
`);
