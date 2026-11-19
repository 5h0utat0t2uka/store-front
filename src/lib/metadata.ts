import type { Metadata, ResolvingMetadata } from "next";

type PageMetadata = {
  title: string;
  description?: string;
  url: string;
  images?: NonNullable<Metadata["openGraph"]>["images"];
};

export async function createPageMetadata(
  { title, description, url, images }: PageMetadata,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const inherited = await parent;
  const pageDescription = description ?? inherited.description ?? undefined;

  return {
    title,
    description: pageDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description: pageDescription,
      url,
      images: images ?? inherited.openGraph?.images,
    },
  };
}
