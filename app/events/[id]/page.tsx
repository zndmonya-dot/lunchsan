import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import EventDetailClient from '@/components/EventDetailClient'
import { validateEventId } from '@/lib/security'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // IDのバリデーション（基本的な文字列チェックのみ）
  if (!id || id.length > 100 || /[<>'"&;]/.test(id)) {
    notFound()
  }
  
  const supabase = await createClient()

  // イベントを取得（IDまたはトークンで検索）
  // まずトークンで検索を試み、見つからなければIDで検索
  let event = null
  let error = null

  // トークンで検索（トークンは通常16文字の英数字）
  const { data: eventByToken, error: tokenError } = await supabase
    .from('lunch_events')
    .select(`
      *,
      event_participants (
        *
      ),
      restaurant_votes (
        *,
        restaurants (
          id,
          name,
          address,
          rating,
          price_level
        )
      ),
      location_candidates (
        *
      ),
      location_votes (
        *
      )
    `)
    .eq('token', id)
    .single()

  if (eventByToken && !tokenError) {
    event = eventByToken
  } else {
    // トークンで見つからなかった場合、IDで検索（UUID形式の場合）
    const { data: eventById, error: idError } = await supabase
      .from('lunch_events')
      .select(`
        *,
        event_participants (
          *
        ),
        restaurant_votes (
          *,
          restaurants (
            id,
            name,
            address,
            rating,
            price_level
          )
        ),
        location_candidates (
          *
        ),
        location_votes (
          *
        )
      `)
      .eq('id', id)
      .single()

    if (eventById && !idError) {
      event = eventById
    } else {
      error = idError || tokenError
    }
  }

  if (error || !event) {
    // デバッグ用: 開発環境でのみエラーをログ出力
    if (process.env.NODE_ENV === 'development') {
      console.error('Event not found:', {
        id,
        tokenError,
        idError: error,
        searchedByToken: !!tokenError,
        searchedById: !!error
      })
    }
    notFound()
  }

  // データの整合性を確保：配列でない場合は空配列に変換
  const normalizedEvent = {
    ...event,
    event_participants: Array.isArray(event.event_participants) ? event.event_participants : [],
    location_candidates: Array.isArray(event.location_candidates) ? event.location_candidates : null,
    location_votes: Array.isArray(event.location_votes) ? event.location_votes : null,
    restaurant_votes: Array.isArray(event.restaurant_votes) ? event.restaurant_votes : null,
  }

  return (
    <EventDetailClient
      event={normalizedEvent as any}
      currentUserId={null}
      currentUserProfile={null}
      currentParticipant={null}
    />
  )
}

