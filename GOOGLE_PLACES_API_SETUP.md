# Google Places API セットアップガイド

このアプリケーションでは、**Google Places API**を使用して近くのレストランを検索しています。

## 使用しているAPI

- **Places API (Nearby Search)**: 指定した位置情報から半径2km以内のレストランを検索
- **Places API (Text Search)**: 検索クエリに基づいてレストランを検索

## セットアップ手順

### 1. Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択

### 2. 必要なAPIを有効化

1. 「APIとサービス」→「ライブラリ」に移動
2. 以下のAPIを有効化：
   - **Maps JavaScript API**: マップ表示に必要
   - **Places API**: レストラン検索に必要（**必須**）

### 3. APIキーの作成

1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「APIキー」を選択
3. 作成されたAPIキーをコピー

### 4. APIキーの制限設定（推奨）

1. 作成したAPIキーをクリックして編集
2. 「アプリケーションの制限」で「HTTP リファラー（ウェブサイト）」を選択
3. 「ウェブサイトの制限」に以下を追加：
   - 開発環境: `http://localhost:3000/*`
   - 本番環境: `https://your-domain.com/*`（本番環境のURL）
4. 「APIの制限」で「キーを制限」を選択し、以下に制限：
   - Maps JavaScript API
   - Places API

### 5. 環境変数に設定

`.env.local`ファイルに以下を追加：

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 6. 開発サーバーを再起動

```bash
npm run dev
```

## トラブルシューティング

### APIが読み込まれない場合

1. **ブラウザのコンソールを確認**
   - エラーメッセージを確認してください
   - `RestaurantSearch: Google Places API is not loaded`というメッセージが表示される場合、APIキーが正しく設定されていない可能性があります

2. **環境変数の確認**
   - `.env.local`ファイルに`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`が正しく設定されているか確認
   - 開発サーバーを再起動しているか確認

3. **APIの有効化確認**
   - Google Cloud Consoleで「Places API」が有効になっているか確認
   - 「Maps JavaScript API」も有効になっているか確認

4. **APIキーの制限設定確認**
   - APIキーの制限設定で、`http://localhost:3000/*`が追加されているか確認
   - 本番環境の場合は、本番環境のURLが追加されているか確認

5. **請求の有効化確認**
   - Google Cloud Consoleで請求が有効になっているか確認
   - Places APIは有料APIですが、月額$200の無料クレジットが提供されます

### よくあるエラー

- **`INVALID_REQUEST`**: リクエストが無効です。位置情報が正しく設定されているか確認してください
- **`OVER_QUERY_LIMIT`**: APIの使用制限を超えています。請求が有効になっているか、使用量を確認してください
- **`REQUEST_DENIED`**: APIキーが無効または制限されています。APIキーの設定を確認してください
- **`ZERO_RESULTS`**: 検索結果が見つかりませんでした。検索範囲を広げるか、別の場所で試してください

## 参考リンク

- [Google Places API ドキュメント](https://developers.google.com/maps/documentation/places/web-service)
- [Places API (Nearby Search) ドキュメント](https://developers.google.com/maps/documentation/places/web-service/nearby-search)
- [Places API (Text Search) ドキュメント](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Google Cloud Console](https://console.cloud.google.com)

