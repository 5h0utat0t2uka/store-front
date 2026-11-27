import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typedRoutes: true,
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  poweredByHeader: false,
  // images: {
  //   localPatterns: [{ pathname: "/feature/*.webp", search: "" }],
  // },
  turbopack: {
    // ::scroll-button(*), ::scroll-marker:target-current などをパーサーがまだ認識しないため暫定的に追加
    // 対応したら外す
    ignoreIssue: [
      {
        path: "**/src/components/carousel/track.module.css",
        description: /is not recognized as a valid pseudo-element/,
      },
      {
        path: "**/src/app/products/_components/product-gallery.module.css",
        description: /is not recognized as a valid pseudo-element/,
      },
      {
        path: "**/src/components/carousel/track.module.css",
        description: /is not recognized as a valid pseudo-class/,
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), autoplay=(self), fullscreen=(self), picture-in-picture=(self)",
          },
          // {
          //   key: "Content-Security-Policy",
          //   value: CSP.replace(/\s{2,}/g, " ").trim(),
          // },
        ],
      },
    ];
  },
};

export default nextConfig;
