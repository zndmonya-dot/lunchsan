import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * 毎日0時に実行される自動更新API
 * 外部のcronサービス（Vercel Cron、GitHub Actionsなど）から呼び出されます
 * 
 * セキュリティ: 環境変数CRON_SECRETで保護
 */
export async function GET(request: Request) {
  // セキュリティチェック: CRON_SECRETが設定されている場合は検証
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    
    // 自動更新が有効なイベントを取得
    const { data: events, error: fetchError } = await supabase
      .from('lunch_events')
      .select('id')
      .eq('auto_daily_update', true)

    if (fetchError) {
      console.error('Error fetching events:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ 
        message: 'No events to update',
        updated: 0 
      })
    }

    const eventIds = events.map(e => e.id)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD形式

    // 1. 日付を今日に更新
    const { error: updateDateError } = await supabase
      .from('lunch_events')
      .update({ 
        date: today,
        updated_at: new Date().toISOString()
      })
      .in('id', eventIds)
      .eq('auto_daily_update', true)

    if (updateDateError) {
      console.error('Error updating dates:', updateDateError)
      return NextResponse.json({ error: 'Failed to update dates' }, { status: 500 })
    }

    // 2. 参加者を削除
    const { error: deleteParticipantsError } = await supabase
      .from('event_participants')
      .delete()
      .in('event_id', eventIds)

    if (deleteParticipantsError) {
      console.error('Error deleting participants:', deleteParticipantsError)
      // エラーが発生しても続行
    }

    // 3. 投票結果を削除
    const { error: deleteVotesError } = await supabase
      .from('location_votes')
      .delete()
      .in('event_id', eventIds)

    if (deleteVotesError) {
      console.error('Error deleting location votes:', deleteVotesError)
      // エラーが発生しても続行
    }

    const { error: deleteRestaurantVotesError } = await supabase
      .from('restaurant_votes')
      .delete()
      .in('event_id', eventIds)

    if (deleteRestaurantVotesError) {
      console.error('Error deleting restaurant votes:', deleteRestaurantVotesError)
      // エラーが発生しても続行
    }

    return NextResponse.json({ 
      message: 'Daily update completed',
      updated: events.length,
      date: today
    })
  } catch (error: any) {
    console.error('Error in daily update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

