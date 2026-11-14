"use client";

import "gen-interface-jp/400.css";
import "gen-interface-jp/600.css";
import "gen-interface-jp/700.css";
import "@/styles/globals.css";

import ErrorPage from "./error";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Error occurred</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <ErrorPage retry={retry} />
      </body>
    </html>
  );
}
