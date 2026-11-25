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

GitHub Actions での利用は、`gh secret set` で暗号化した値を渡す  
``` sh
sops decrypt --input-type dotenv --output-type dotenv .enc.env | gh secret set --env-file -
sops decrypt --input-type dotenv --output-type dotenv .enc.env | gh secret set --env-file - --app dependabot
```

## 問い合わせフォーム

`/contact` は、1回の問い合わせにつき1件の `contact_inquiry` を保存します。初回は次の設定が必要です。

1. Dev Dashboard で、既存の Admin API アプリに `read_metaobject_definitions` と `write_metaobjects` を追加します。顧客用の `write_customers` も有効にし、バージョンをリリースします。
2. この開発ストアの日本語画面では、Dev Dashboard のアプリ概要で **「インストール数」カード右上の「テストアプリ」** を開きます。ストア選択が表示されたら `store-front` を選び、追加権限の確認が表示されたら承認します。付与済みの権限は、このアプリのクライアント認証で新しく取得したトークン応答の `scope` で確認できます。[Dev Dashboard の公式手順](https://shopify.dev/docs/apps/build/dev-dashboard/create-apps-using-dev-dashboard)・[Shopify 担当者による既存インストールの更新手順](https://community.shopify.dev/t/enable-protected-customer-data-access-for-a-custom-app-created-in-the-dev-dashboard-no-ui-option-available/35445/2)
3. 開発ストアで以下を一度実行します。CLI の `write_metaobject_definitions` は定義作成用です。アプリの実行時には使用しません。

```sh
pnpm exec shopify store auth --store store-front-9clxicd4.myshopify.com --scopes write_metaobject_definitions
pnpm exec shopify store execute --store store-front-9clxicd4.myshopify.com --version 2026-10 --allow-mutations --query-file scripts/shopify/create-contact-inquiry.graphql
```

`userErrors` が空で、定義の `storefront` と `customerAccount` が両方とも `NONE` なら設定完了です。この公開設定を変えるとフォームは受付を停止します。

問い合わせは管理画面の **コンテンツ → メタオブジェクト → お問い合わせ** で確認します。個別メールを送るには、**返信先のお客様** の顧客詳細を開き、メールアドレスをクリックして件名と返信を入力します。送信前に「受付時のメールアドレス」と現在の宛先が一致することを確認してください。顧客からの再返信はストアの返信先メールボックスに届きます。[Shopify の個別メール送信手順](https://help.shopify.com/ja/manual/customers/manage-customers)

<!--
## Next.js での商品表示

`pnpm dev` で起動すると、トップページに商品を最大3件表示します。

- `src/lib/shopify.ts` は `server-only` で保護し、非公開トークンをサーバー内で扱います。HTTP エラーと GraphQL エラーは例外として扱い、商品0件とは区別します。
- 商品表示は Server Component です。`Suspense` で読み込み中の表示を用意し、取得失敗時は `error.tsx` から再試行できます。
- `io()` より後で取得するため、ビルド時には Shopify へ接続しません。実行環境には `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` が必要です。
- `use cache` と `cacheLife({ stale: 60, revalidate: 60, expire: 300 })` を使用します。サーバーでは60秒経過後のアクセスでバックグラウンド更新し、300秒経過後のアクセスでは新しい結果を待ちます。ブラウザー側のルーターキャッシュの有効期間は60秒です。定期実行ではありません。
- このキャッシュは標準のメモリーキャッシュです。サーバーレス環境ではリクエスト間の保持を保証しません。

参考: [Server Components と server-only](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)、[io](https://nextjs.org/docs/app/api-reference/functions/io)、[cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)。-->
