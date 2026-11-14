import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typedRoutes: true,
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        port: "",
        pathname: "/s/files/**",
        // Shopify の画像更新用のクエリパラメーター（?v=...）を許可する。
      },
    ],
    maximumRedirects: 0,
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
            value:
              "geolocation=(self), autoplay=(self), fullscreen=(self), picture-in-picture=(self)",
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
