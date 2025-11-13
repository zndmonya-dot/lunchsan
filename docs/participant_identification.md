# 参加者の識別方法について

## 概要

「昼食さん」では、参加者を**名前のみ**で識別しています。メールアドレスは不要です。

## データベース構造

### 1. `event_participants` テーブル（参加者テーブル）

```sql
CREATE TABLE event_participants (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL,  -- どの予定か
  name TEXT NOT NULL,      -- 参加者の名前（識別キー）
  status TEXT NOT NULL,    -- 'going'（参加）または 'not_going'（不参加）
  ...
)
```

**ユニーク制約**: `(event_id, name)`
- 同じ予定内では、同じ名前の参加者は1人だけ
- 異なる予定（URL）では、同じ名前でも問題なし

### 2. `location_votes` テーブル（投票テーブル）

```sql
CREATE TABLE location_votes (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL,  -- どの予定か
  candidate_id UUID NOT NULL,  -- どの候補に投票したか
  name TEXT NOT NULL,       -- 投票者の名前（参加者と紐づけ）
  ...
)
```

**ユニーク制約**: `(event_id, name)`
- 同じ予定内では、同じ名前の人は1つの候補にしか投票できない
- 投票を変更すると、既存の投票が更新される

## 識別の流れ

### 1. 参加登録時

1. ユーザーが名前を入力（例: "山田太郎"）
2. ブラウザのローカルストレージに `participantName` として保存
3. データベースの `event_participants` テーブルに保存
   - `event_id`: 予定のID
   - `name`: "山田太郎"
   - `status`: "going"

### 2. 次回アクセス時

1. ローカルストレージから `participantName` を読み込み
2. データベースで `event_id` と `name` で検索
3. 見つかれば、その参加者として認識

### 3. 投票時

1. 現在の `participantName`（例: "山田太郎"）を使用
2. `location_votes` テーブルで `(event_id, name)` で既存の投票を検索
3. 既存の投票があれば更新、なければ新規作成

## 注意点

### 同じ名前の人が複数いる場合

- **同じ予定内**: データベースのユニーク制約により、同じ名前は1人だけ登録可能
- **異なる予定**: 問題なし。各予定で独立して識別される

### 名前の変更

- 参加登録後に名前を変更すると、**別の参加者として扱われる**
- 元の名前の投票は残るが、新しい名前では別の投票として扱われる

### プライバシー

- メールアドレスは不要のため、プライバシーに配慮
- 名前だけで参加・投票が可能

## コード例

### 参加者の検索

```typescript
// 名前で参加者を検索
const foundParticipants = event.event_participants.filter(
  (p) => p.name?.trim().toLowerCase() === participantName.trim().toLowerCase()
)
```

### 投票の検索

```typescript
// 名前で投票を検索
const userVote = votes.find(
  (v) => v.name?.trim().toLowerCase() === currentParticipantName.trim().toLowerCase()
)
```

### 投票の保存

```typescript
// 既存の投票を検索
const { data: existingVote } = await supabase
  .from('location_votes')
  .select('*')
  .eq('event_id', eventId)
  .eq('name', participantName)
  .maybeSingle()

if (existingVote) {
  // 既存の投票を更新
  await supabase
    .from('location_votes')
    .update({ candidate_id: newCandidateId })
    .eq('id', existingVote.id)
} else {
  // 新規投票を作成
  await supabase
    .from('location_votes')
    .insert({
      event_id: eventId,
      candidate_id: newCandidateId,
      name: participantName,
    })
}
```

