import type { Metadata, ResolvingMetadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import Header from "../_components/header";
import { getFeatureByHref } from "../_data";

const pathname = "/features/2026-10-03";
const feature = getFeatureByHref(pathname);
const relatedFeatures = feature.related.map((href) => getFeatureByHref(href));
console.log("relatedFeatures", relatedFeatures.length !== 0 ? relatedFeatures : "no related features");

export function generateMetadata(_props: PageProps<typeof pathname>, parent: ResolvingMetadata): Promise<Metadata> {
  return createPageMetadata({ title: feature.title, url: feature.href }, parent);
}

export default function Page() {
  return (
    <main>
      <Header feature={feature} />
    </main>
  );
}
