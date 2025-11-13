# 昼食さん

お昼ごはんを一緒に食べるメンバーを調整するためのWebアプリケーションです。

## 機能

- **グループ機能**: グループを作成してメンバーを管理
- **メンバー招待**: メールアドレスでメンバーを招待
- **イベント作成**: グループ内でお昼ごはんの予定を作成
- **通知機能**: イベント作成時にグループメンバー全員に通知
- **参加可否の管理**: 参加・不参加・未回答のステータスを設定
- **時間設定**: イベントの開始時間と終了時間を設定（デフォルト: 12:00-13:00）
- **場所の選択**: フリースペース、外食、未定から選択
- **レストラン検索**: 作成者の位置情報から近くのレストランを自動検索（Google Places API）
- **レストラン投票**: 参加者がお店を選べる投票機能
- **匿名参加**: ログイン不要で名前とメールアドレスを入力して参加

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router), React 19, TypeScript
- **バックエンド**: Supabase (PostgreSQL, Auth, Row Level Security)
- **スタイリング**: Tailwind CSS
- **日付処理**: date-fns
- **マップ/レストラン検索**: Google Places API

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
```

### 3. Supabaseのセットアップ

1. **プロジェクトの作成**
   - [Supabase](https://supabase.com)でプロジェクトを作成

2. **データベースマイグレーションの実行**
   - Supabaseダッシュボードの「SQL Editor」に移動
   - 「New query」をクリック
   - `supabase/migrations/001_initial_schema.sql` の内容を全てコピーして貼り付け
   - 「Run」ボタンをクリックして実行
   - エラーなく実行されたことを確認（「Success. No rows returned」と表示される）
   - 次に、`supabase/migrations/002_add_groups_and_notifications.sql` の内容を全てコピーして貼り付け
   - 「Run」ボタンをクリックして実行
   - エラーなく実行されたことを確認
   - 最後に、`supabase/migrations/003_add_event_token_and_public_access.sql` の内容を全てコピーして貼り付け
   - 「Run」ボタンをクリックして実行
   - エラーなく実行されたことを確認
   - 最後に、`supabase/migrations/004_add_time_and_restaurant_voting.sql` の内容を全てコピーして貼り付け
   - 「Run」ボタンをクリックして実行
   - エラーなく実行されたことを確認
   - 最後に、`supabase/migrations/005_remove_auth_requirements.sql` の内容を全てコピーして貼り付け
   - 「Run」ボタンをクリックして実行
   - エラーなく実行されたことを確認

3. **データベース設定完了**
   - すべてのマイグレーションが完了したら、アプリケーションはログイン不要で動作します

4. **環境変数の設定**
   - Supabaseダッシュボードの「Settings」→「API」に移動
   - 「Project URL」をコピーして `NEXT_PUBLIC_SUPABASE_URL` に設定（形式: `https://<project-ref>.supabase.co`）
   - 「anon public」キーをコピーして `NEXT_PUBLIC_SUPABASE_ANON_KEY` に設定

### 4. Google Maps APIのセットアップ

1. **Google Cloud Consoleでプロジェクトを作成**
   - [Google Cloud Console](https://console.cloud.google.com)にアクセス
   - 新しいプロジェクトを作成するか、既存のプロジェクトを選択

2. **必要なAPIを有効化**
   - 「APIとサービス」→「ライブラリ」に移動
   - 以下のAPIを有効化：
     - **Maps JavaScript API**: マップ表示に必要
     - **Places API**: レストラン検索に必要

3. **APIキーの作成**
   - 「APIとサービス」→「認証情報」に移動
   - 「認証情報を作成」→「APIキー」を選択
   - 作成されたAPIキーをコピー

4. **APIキーの制限設定（推奨）**
   - 作成したAPIキーをクリックして編集
   - 「アプリケーションの制限」で「HTTP リファラー（ウェブサイト）」を選択
   - 「ウェブサイトの制限」に以下を追加：
     - 開発環境: `http://localhost:3000/*`
     - 本番環境: `https://your-domain.com/*`（本番環境のURL）
   - 「APIの制限」で「キーを制限」を選択し、以下に制限：
     - Maps JavaScript API
     - Places API

5. **環境変数に設定**
   - `.env.local`ファイルに以下を追加：
     ```env
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     ```
   - 開発サーバーを再起動して反映

### 5. 天気情報APIのセットアップ（天気情報表示用）

**重要: APIキーは不要です。Open-Meteo API（完全無料）を優先使用します。**

このアプリは以下の順序で天気情報を取得します：

1. **Open-Meteo API（優先）**
   - 完全無料、APIキー不要
   - 日本の天気情報に対応
   - 制限なし（非商用利用）

2. **OpenWeatherMap API（フォールバック）**
   - APIキーが設定されている場合のみ使用
   - 無料プランで利用可能（1分間に60リクエストまで）
   - 有料プランの購入は不要

#### Open-Meteo APIのみを使用する場合（推奨）

**APIキーの設定は不要です。** そのまま使用できます。

#### OpenWeatherMap APIも使用したい場合（オプション）

1. **OpenWeatherMapアカウントの作成**
   - [OpenWeatherMap](https://openweathermap.org/)にアクセス
   - アカウントを作成（無料プランで利用可能）
   - **有料プラン（OneCall 3.0など）の購入は不要です**

2. **APIキーの取得**
   - ログイン後、ダッシュボードからAPIキーを取得
   - 無料プランの制限: 1分間に60リクエストまで

3. **環境変数に設定（オプション）**
   - `.env.local`ファイルに以下を追加：
     ```env
     NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
     ```
   - 開発サーバーを再起動して反映

**注意:**
- Open-Meteo APIが優先されるため、APIキーがなくても動作します
- OpenWeatherMap APIは、Open-Meteoが失敗した場合のフォールバックとして使用されます
- 有料プランの購入は一切不要です

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## データベーススキーマ

### テーブル

- `profiles`: ユーザープロファイル
- `groups`: グループ情報
- `group_members`: グループメンバー
- `group_invitations`: グループ招待
- `lunch_events`: 昼食イベント（グループに紐づく）
- `event_participants`: イベント参加者
- `restaurants`: レストラン情報
- `restaurant_votes`: レストラン投票
- `notifications`: 通知

詳細は `supabase/migrations/` ディレクトリ内のマイグレーションファイルを参照してください。

### 機能フロー（調整さん方式）

1. **イベント作成**: 名前とメールアドレスを入力してイベントを作成（ログイン不要）
2. **URL共有**: イベント作成時にユニークなURLが生成され、そのURLを共有
3. **参加回答**: ログイン不要でURLにアクセスし、名前とメールアドレスを入力して参加/不参加を回答
4. **レストラン投票**: 外食イベントの場合、参加者が近くのお店から好きな店を選んで投票

## 使い方

1. **イベント作成（ログイン不要）**: 名前とメールアドレスを入力してイベントを作成
   - 作成者情報（名前・メールアドレス）を入力
   - 日付と時間を設定（デフォルト: 12:00-13:00）
   - メモを入力（任意）
   - 場所を選択（フリースペース、外食、未定）
   - 外食を選択した場合、位置情報から近くのレストランを自動検索
   - レストランを事前に選ぶことも、参加者に選んでもらうことも可能
2. **URL共有**: イベント作成時に生成されたURLをメール、LINE、SNSなどで共有
3. **参加回答（ログイン不要）**: 共有されたURLにアクセスし、名前とメールアドレスを入力して参加・不参加を選択
4. **レストラン投票**: 外食イベントの場合、参加者が近くのお店から好きな店を選んで投票

### 調整さん方式の特徴

- **完全ログイン不要**: 作成者も参加者もログイン不要で利用可能
- **URL共有**: イベントのURLを共有するだけでメンバーを招待
- **シンプル**: 名前とメールアドレスを入力するだけ
- **簡単**: 3ステップで予定を調整

## ライセンス

MIT
