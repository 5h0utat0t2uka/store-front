import "server-only";
import { gql } from "@shopify/hydrogen";
import { cacheLife } from "next/cache";
import { createCatalogClient } from "./client";

const HOME_CAROUSEL_QUERY = gql(`
  query HomeCarousel($after: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      slides: metafield(namespace: "custom", key: "home_carousel_slides") {
        references(first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            __typename
            ... on Metaobject {
              id
              title: field(key: "title") { value }
              description: field(key: "description") { value }
              link: field(key: "link") { value }
              linkLabel: field(key: "link_label") { value }
              image: field(key: "image") {
                reference {
                  __typename
                  ... on MediaImage { image { url altText } }
                }
              }
            }
          }
        }
      }
    }
  }
`);

function parseSlideLink(value: string | null | undefined) {
  const href = value?.trim();
  if (!href) return null;
  if (href.startsWith("https://")) return URL.parse(href)?.href ?? null;
  if (!href.startsWith("/") || href.startsWith("//")) return null;

  // 相対パスの解決専用。別ホストに解決される値を内部リンクとして渡さない。
  const base = "https://storefront.invalid";
  const url = URL.parse(href, base);
  if (!url || url.origin !== base || url.pathname.startsWith("//")) return null;
  return { pathname: url.pathname, search: url.search, hash: url.hash };
}

type CarouselSlide = {
  id: string;
  title: string;
  description?: string;
  image: { url: string; altText: string | null };
  link: NonNullable<ReturnType<typeof parseSlideLink>>;
  linkLabel: string;
};

export async function getHomeCarouselSlides(): Promise<CarouselSlide[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });

  const storefront = createCatalogClient();
  const slides: CarouselSlide[] = [];
  let after: string | undefined;

  for (;;) {
    const { data, errors } = await storefront.graphql(HOME_CAROUSEL_QUERY, { variables: { after } });
    if (errors?.length) throw new Error(errors.map((error) => error.message).join("\n"));
    if (!data?.shop) throw new Error("Shopify returned no shop for the home carousel.");
    const page = data.shop.slides?.references;
    if (!page) return slides;

    for (const node of page.nodes) {
      if (node.__typename !== "Metaobject") continue;
      const reference = node.image?.reference;
      const image = reference?.__typename === "MediaImage" ? reference.image : null;
      const title = node.title?.value?.trim();
      const link = parseSlideLink(node.link?.value);
      const linkLabel = node.linkLabel?.value?.trim();
      if (!image || !title || !link || !linkLabel) continue;

      slides.push({ id: node.id, title, description: node.description?.value?.trim(), image, link, linkLabel });
    }

    if (!page.pageInfo.hasNextPage) return slides;
    const cursor: string | null = page.pageInfo.endCursor;
    if (!cursor || cursor === after) throw new Error("Shopify returned an invalid home carousel cursor.");
    after = cursor;
  }
}
