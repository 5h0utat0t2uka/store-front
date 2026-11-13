# Shopify 

- `@shopify/cli` の読み取り権限で接続後、認証済みのCLIからデータ取得のテストを行う  
``` sh
pnpm exec shopify store auth \
  --store store-front-9clxicd4.myshopify.com \
  --scopes read_products
```  
``` sh
pnpm exec shopify store execute \
  --store store-front-9clxicd4.myshopify.com \
  --version 2026-10 \
  --query 'query CheckStore {
    shop {
      name
      myshopifyDomain
    }
    products(first: 1) {
      nodes {
        id
        title
      }
    }
  }' \
  --json
```

- [Shopify App Store](https://apps.shopify.com/headless?locale=ja) にアクセスしてHeadless販売チャネルをインストール  
- 「Create storefront」をクリックしてトークンを取得する
- トークンを `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` として `.enc.env` に暗号化して保存する
``` sh
sops edit .enc.env
```
- `pnpm dev`, `pnpm build`, `pnpm start` は `sops exec-env` で復号した値を環境変数として渡すようにする  
``` json
"scripts": {
  "dev": "sops exec-env --same-process .enc.env 'next dev'",
  "build": "sops exec-env --same-process .enc.env 'next build'",
  "start": "sops exec-env --same-process .enc.env 'next start'"
},
```



<!--- Headless の非公開トークンで Storefront API への接続を確認する
```sh
pnpm shopify:check
```
  - `.enc.env` のトークンを環境変数として渡し、API バージョン `2026-10` でストア名と商品を最大3件取得する読み取り専用のコマンドです。トークンは出力しません。
  - HTTP エラーに加え、HTTP 200 で返る GraphQL エラーも検出して終了コード1で終了します。
  - ストア名が取得できても商品が0件の場合は、商品のステータスが「アクティブ」で、Headless 販売チャネルに公開されているかを確認してください。
  - `availableForSale` は販売可能なバリエーションの有無を表します。在庫数ではありません。

## Next.js での商品表示

`pnpm dev` で起動すると、トップページに商品を最大3件表示します。

- `src/lib/shopify.ts` は `server-only` で保護し、非公開トークンをサーバー内で扱います。HTTP エラーと GraphQL エラーは例外として扱い、商品0件とは区別します。
- 商品表示は Server Component です。`Suspense` で読み込み中の表示を用意し、取得失敗時は `error.tsx` から再試行できます。
- `io()` より後で取得するため、ビルド時には Shopify へ接続しません。実行環境には `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` が必要です。
- `use cache` と `cacheLife({ stale: 60, revalidate: 60, expire: 300 })` を使用します。サーバーでは60秒経過後のアクセスでバックグラウンド更新し、300秒経過後のアクセスでは新しい結果を待ちます。ブラウザー側のルーターキャッシュの有効期間は60秒です。定期実行ではありません。
- このキャッシュは標準のメモリーキャッシュです。サーバーレス環境ではリクエスト間の保持を保証しません。

参考: [Server Components と server-only](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)、[io](https://nextjs.org/docs/app/api-reference/functions/io)、[cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)。-->
