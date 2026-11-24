export const features = [
  {
    date: "2026-11-23",
    title: "Versatile Gear for Every Environment",
    href: "/features/2026-11-23",
    image: { src: "/feature/f1.webp", width: 1299, height: 685 },
    related: ["/features/2026-10-24"],
  },
  {
    date: "2026-10-24",
    title: "A New Perspective on Military Essentials",
    href: "/features/2026-10-24",
    image: { src: "/feature/f2.webp", width: 1299, height: 731 },
    related: ["/features/2026-11-23"],
  },
  {
    date: "2026-10-03",
    title: "Engineered for the Unknown",
    href: "/features/2026-10-03",
    image: { src: "/feature/f3.webp", width: 1299, height: 731 },
    related: [],
  },
  {
    date: "2026-09-06",
    title: "The Evolution of Technical Apparel",
    href: "/features/2026-09-06",
    image: { src: "/feature/f4.webp", width: 1299, height: 731 },
    related: [],
  },
] as const;

export function getFeatureByHref(href: (typeof features)[number]["href"]) {
  const feature = features.find((item) => item.href === href);
  if (!feature) throw new Error(`No feature registered for ${href}`);
  return feature;
}
export type Feature = (typeof features)[number];
