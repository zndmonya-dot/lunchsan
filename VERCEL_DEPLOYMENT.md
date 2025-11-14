# Vercelへのデプロイ手順

このドキュメントでは、昼食さんアプリをVercelにデプロイする手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（[vercel.com](https://vercel.com)で無料登録可能）
- Supabaseプロジェクトがセットアップ済み
- Google Maps APIキーを取得済み

## デプロイ手順

### 1. GitHubにプッシュ

まず、コードをGitHubリポジトリにプッシュします。

```bash
# 既にGitHubにプッシュ済みの場合はスキップ
git remote -v  # リモートリポジトリを確認
git push origin main  # または feature/pwa-mobile-optimization
```

### 2. Vercelにプロジェクトをインポート

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリを選択（または「Import Git Repository」でリポジトリを検索）
4. プロジェクトを選択して「Import」をクリック

### 3. プロジェクト設定

#### Framework Preset
- **Framework Preset**: Next.js（自動検出されるはず）

#### Root Directory
- ルートディレクトリがプロジェクトルートの場合はそのまま

#### Build and Output Settings
- **Build Command**: `npm run build`（デフォルト）
- **Output Directory**: `.next`（デフォルト）
- **Install Command**: `npm install`（デフォルト）

### 4. 環境変数の設定

「Environment Variables」セクションで、以下の環境変数を追加します：

#### 必須の環境変数

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### オプションの環境変数

```
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
```

**環境変数の取得方法:**

1. **Supabaseの環境変数**
   - Supabaseダッシュボード → Settings → API
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Google Maps APIキー**
   - [Google Cloud Console](https://console.cloud.google.com)
   - APIとサービス → 認証情報
   - 既存のAPIキーを使用、または新規作成

3. **OpenWeatherMap APIキー（オプション）**
   - [OpenWeatherMap](https://openweathermap.org/)でアカウント作成
   - APIキーを取得（無料プランで利用可能）

**重要:** 環境変数は以下の環境すべてに設定することを推奨します：
- Production（本番環境）
- Preview（プレビュー環境）
- Development（開発環境）

### 5. デプロイ実行

1. 「Deploy」ボタンをクリック
2. ビルドが完了するまで待機（通常1-3分）
3. デプロイが成功すると、URLが表示されます

### 6. デプロイ後の確認

#### 動作確認
- デプロイされたURLにアクセス
- トップページが表示されることを確認
- 予定作成機能が動作することを確認

#### Google Maps APIの制限設定
デプロイ後、Google Maps APIキーの制限を更新してください：

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. APIとサービス → 認証情報
3. 使用しているAPIキーをクリック
4. 「アプリケーションの制限」で「HTTP リファラー（ウェブサイト）」を選択
5. 「ウェブサイトの制限」に以下を追加：
   ```
   https://your-project.vercel.app/*
   https://*.vercel.app/*
   ```
6. 「保存」をクリック

### 7. カスタムドメインの設定（lunchsan.com）

#### Vercelでの設定

1. Vercelダッシュボード → プロジェクト → Settings → Domains
2. 「Add Domain」をクリック
3. `lunchsan.com` を入力
4. 「Add」をクリック

#### DNS設定（お名前.comの場合）

お名前.comでDNS設定を行う手順：

1. **お名前.com Naviにログイン**
   - [お名前.com Navi](https://www.onamae.com/)にアクセス
   - ログイン

2. **ドメインのDNS設定画面を開く**
   - 「ドメイン」→「ドメイン設定一覧」をクリック
   - `lunchsan.com` を選択
   - 「DNS関連機能の設定」をクリック
   - 「DNSレコード設定を利用する」を選択

3. **Vercelで表示されるDNSレコードを確認**
   - Vercelダッシュボード → プロジェクト → Settings → Domains
   - `lunchsan.com` をクリック
   - 表示されるDNSレコードを確認

4. **DNSレコードを設定**

   **Aレコード（ルートドメイン `lunchsan.com` 用）:**
   - 「設定1」または空いている設定欄を選択
   - ホスト名: `@` または空白
   - TYPE: `A`
   - TTL: `3600`（デフォルト）
   - VALUE: Vercelが表示するIPアドレス（例: `76.76.21.21`）
   - 「追加」をクリック

   **CNAMEレコード（wwwサブドメイン `www.lunchsan.com` 用、推奨）:**
   - 別の設定欄を選択
   - ホスト名: `www`
   - TYPE: `CNAME`
   - TTL: `3600`（デフォルト）
   - VALUE: Vercelが表示するCNAME値（例: `cname.vercel-dns.com`）
   - 「追加」をクリック

   **wwwサブドメインの必要性:**
   - 必須ではありませんが、**推奨**します
   - ユーザーが `www.lunchsan.com` でアクセスする可能性があるため
   - SEO的にも両方のドメインを設定しておくと良い
   - Vercelでは、`lunchsan.com` と `www.lunchsan.com` の両方を設定すると、自動でリダイレクト設定も可能

5. **設定を保存**
   - 「設定する」ボタンをクリック
   - 確認画面で「設定する」をクリック

**注意事項:**
- DNS設定の反映には数分〜最大48時間かかる場合があります（通常は数分〜数時間）
- 既存のAレコードやCNAMEレコードがある場合は、削除または上書きしてください
- Vercelが推奨するDNSレコード値を使用してください（Vercelダッシュボードに表示されます）

#### ドメインの検証

DNS設定後、Vercelが自動で検証します（数分〜数時間かかる場合があります）。

**現在の設定状況:**
画像を見ると、以下の3つのドメインが既に設定され、「Valid Configuration」となっています：
- `lunchsan.com` ✅
- `www.lunchsan.com` ✅
- `lunchsan.vercel.app` ✅（Vercelのデフォルトドメイン）

すべて正常に設定されているようです！

#### wwwとルートドメインのリダイレクト設定（オプション）

Vercelでは、`www.lunchsan.com` と `lunchsan.com` のどちらかに統一したい場合、リダイレクト設定が可能です：

1. Vercelダッシュボード → プロジェクト → Settings → Domains
2. リダイレクトしたいドメインの「Edit」をクリック
3. リダイレクト先を選択

一般的には、`www.lunchsan.com` → `lunchsan.com` にリダイレクトするか、その逆の設定が可能です。

#### Google Maps APIの制限設定を更新

カスタムドメイン設定後、Google Maps APIキーの制限を更新してください：

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. APIとサービス → 認証情報
3. 使用しているAPIキーをクリック
4. 「アプリケーションの制限」で「HTTP リファラー（ウェブサイト）」を選択
5. 「ウェブサイトの制限」に以下を追加：
   ```
   https://lunchsan.com/*
   https://www.lunchsan.com/*
   https://*.vercel.app/*
   ```
6. 「保存」をクリック

#### HTTPS証明書

Vercelが自動でSSL証明書（Let's Encrypt）を発行・設定します。数分で完了します。

## 自動デプロイ

Vercelは以下の場合に自動でデプロイされます：

- **Production**: `main`ブランチ（またはデフォルトブランチ）にプッシュ
- **Preview**: その他のブランチにプッシュ
- **Pull Request**: PRが作成・更新されたとき

## Cronジョブの設定

`vercel.json`にcronジョブが設定されています：

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-update",
      "schedule": "0 15 * * *"
    }
  ]
}
```

このcronジョブは毎日15:00（UTC）に実行されます。

**注意:** VercelのCronジョブはProプラン以上で利用可能です。無料プランの場合は、外部のcronサービス（例: cron-job.org）を使用するか、Supabase Edge Functionsを使用することを検討してください。

## トラブルシューティング

### ビルドエラー

**エラー: 環境変数が見つからない**
- 環境変数が正しく設定されているか確認
- 変数名にタイポがないか確認（`NEXT_PUBLIC_`プレフィックスが必要）

**エラー: Supabase接続エラー**
- `NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しいか確認
- Supabaseプロジェクトがアクティブか確認

**エラー: Google Maps APIエラー**
- APIキーが正しく設定されているか確認
- Google Cloud Consoleで必要なAPIが有効化されているか確認
  - Maps JavaScript API
  - Places API

### デプロイ後のエラー

**404エラー**
- ルーティングが正しく設定されているか確認
- `next.config.ts`の設定を確認

**APIエラー**
- ブラウザのコンソールでエラーを確認
- Vercelのログ（Dashboard → Deployments → ログ）を確認

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

