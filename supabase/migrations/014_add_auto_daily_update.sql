-- 自動初期化モードを有効にするためのカラム追加
-- auto_daily_update: 自動初期化モードを有効にするかどうか
ALTER TABLE public.lunch_events
ADD COLUMN IF NOT EXISTS auto_daily_update BOOLEAN DEFAULT false;

-- インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_lunch_events_auto_daily_update 
ON public.lunch_events(auto_daily_update) 
WHERE auto_daily_update = true;

