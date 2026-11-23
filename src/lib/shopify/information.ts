import "server-only";
import { gql } from "@shopify/hydrogen";
import { cacheLife } from "next/cache";
import { createCatalogClient } from "./client";

const INFORMATION_QUERY = gql(`
  query HomeInformation($after: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    metaobjects(type: "information", first: 100, after: $after) {
      nodes {
        id
        publishedAt: field(key: "published_at") { type value }
        title: field(key: "title") { value }
        summary: field(key: "summary") { value }
        detailPage: field(key: "detail_page") {
          reference {
            __typename
            ... on Page { handle }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`);

type InformationEntry = {
  id: string;
  publishedAt: string;
  displayDate: string;
  title: string;
  summary: string;
  pageHandle: string | null;
};

const DISPLAY_TIME_ZONE = "Asia/Tokyo";

function parsePublicationDate(type: string, value: string) {
  try {
    if (type === "date") {
      const date = Temporal.PlainDate.from(value);
      const displayDate = date.toString();
      // 日付だけの値はそのまま表示し、並べ替えに限って日本での一日の始まりを使う。
      return { publishedAt: displayDate, displayDate, instant: date.toZonedDateTime(DISPLAY_TIME_ZONE).toInstant() };
    }
    if (type === "date_time") {
      // Shopify の既定は UTC。明示されたオフセットがあればそちらを使う。
      const instant = Temporal.ZonedDateTime.from(`${value}[UTC]`, { offset: "use" }).toInstant();
      const displayDate = instant.toZonedDateTimeISO(DISPLAY_TIME_ZONE).toPlainDate().toString();
      return { publishedAt: instant.toString(), displayDate, instant };
    }
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
  }
  return null;
}

export async function getInformationEntries(): Promise<InformationEntry[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });

  if (typeof Temporal === "undefined") await import("temporal-polyfill-lite/global");

  const storefront = createCatalogClient();
  const entries: { instant: Temporal.Instant; entry: InformationEntry }[] = [];
  let after: string | undefined;

  for (;;) {
    const result = await storefront.graphql(INFORMATION_QUERY, { variables: { after } });
    if (result.errors?.length) {
      throw new Error(result.errors.map((error) => error.message).join("\n"));
    }
    const page = result.data?.metaobjects;
    if (!page) throw new Error("Shopify returned no information connection.");

    for (const node of page.nodes) {
      const field = node.publishedAt;
      const title = node.title?.value?.trim();
      const summary = node.summary?.value?.trim();
      if (!field?.value || !title || !summary) continue;
      const date = parsePublicationDate(field.type, field.value);
      if (!date) continue;

      const reference = node.detailPage?.reference;
      entries.push({
        instant: date.instant,
        entry: {
          id: node.id,
          publishedAt: date.publishedAt,
          displayDate: date.displayDate,
          title,
          summary,
          pageHandle: reference?.__typename === "Page" ? reference.handle : null,
        },
      });
    }

    if (!page.pageInfo.hasNextPage) break;
    const cursor: string | null = page.pageInfo.endCursor;
    if (!cursor || cursor === after) throw new Error("Shopify returned an invalid information cursor.");
    after = cursor;
  }

  return entries.sort((a, b) => Temporal.Instant.compare(b.instant, a.instant)).map(({ entry }) => entry);
}
