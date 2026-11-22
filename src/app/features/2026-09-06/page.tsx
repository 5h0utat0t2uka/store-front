import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import { createPageMetadata } from "@/lib/metadata";
import { getFeatureByHref } from "../_data";

const pathname = "/features/2026-09-06";
const feature = getFeatureByHref(pathname);

export function generateMetadata(_props: PageProps<typeof pathname>, parent: ResolvingMetadata): Promise<Metadata> {
  return createPageMetadata({ title: feature.title, url: feature.href }, parent);
}

export default function Page() {
  return (
    <main>
      <h1>{feature.title}</h1>
      <Image src={feature.image.src} alt="" width={feature.image.width} height={feature.image.height} loading="eager" />
    </main>
  );
}
