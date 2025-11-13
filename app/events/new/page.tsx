'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Header from '@/components/Header'
import RestaurantSearch from '@/components/RestaurantSearch'

function NewEventFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [title, setTitle] = useState(searchParams.get('title') || '')
  const [date, setDate] = useState(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('12:00')
  const [endTime, setEndTime] = useState('13:00')
  const [locationType, setLocationType] = useState<'freeroom' | 'restaurant' | 'undecided'>('undecided')
  const [restaurant, setRestaurant] = useState<{
    id: string
    name: string
    address: string
    place_id?: string | null
  } | null>(null)
  const [description, setDescription] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [creatorEmail, setCreatorEmail] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  // ユーザーの位置情報を取得
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // 位置情報が取得できない場合はデフォルト（東京駅）を使用
          setUserLocation({ lat: 35.6812, lng: 139.7671 })
        }
      )
    } else {
      // 位置情報が取得できない場合はデフォルト（東京駅）を使用
      setUserLocation({ lat: 35.6812, lng: 139.7671 })
    }
  }, [])

  // テンプレートイベントから情報を読み込む
  useEffect(() => {
    const templateId = searchParams.get('template')
    if (templateId) {
      loadTemplateEvent(templateId)
    }
  }, [searchParams])

  const loadTemplateEvent = async (templateId: string) => {
    setLoadingTemplate(true)
    try {
      // トークンまたはIDでイベントを検索
      let event = null
      
      // まずトークンで検索
      const { data: eventByToken } = await supabase
        .from('lunch_events')
        .select(`
          *,
          location_candidates (
            *
          )
        `)
        .eq('token', templateId)
        .single()

      if (eventByToken) {
        event = eventByToken
      } else {
        // トークンで見つからなかった場合、IDで検索
        const { data: eventById } = await supabase
          .from('lunch_events')
          .select(`
            *,
            location_candidates (
              *
            )
          `)
          .eq('id', templateId)
          .single()

        if (eventById) {
          event = eventById
        }
      }

      if (event) {
        // フォームに情報を自動入力
        if (event.title) setTitle(event.title)
        if (event.start_time) {
          const startTimeStr = typeof event.start_time === 'string' ? event.start_time : event.start_time.toString()
          setStartTime(startTimeStr.substring(0, 5))
        }
        if (event.end_time) {
          const endTimeStr = typeof event.end_time === 'string' ? event.end_time : event.end_time.toString()
          setEndTime(endTimeStr.substring(0, 5))
        }
        if (event.location_type) setLocationType(event.location_type as 'freeroom' | 'restaurant' | 'undecided')
        if (event.description) setDescription(event.description)
        if (event.creator_latitude && event.creator_longitude) {
          setUserLocation({
            lat: event.creator_latitude,
            lng: event.creator_longitude,
          })
        }
        if (event.restaurant_name && event.restaurant_address) {
          setRestaurant({
            id: event.restaurant_id || '',
            name: event.restaurant_name,
            address: event.restaurant_address,
            place_id: null,
          })
        }
        // 場所の候補は、location_candidatesから取得する必要があるが、
        // このページでは場所の候補を表示する機能がないため、スキップ
        // （必要に応じて後で追加可能）
      }
    } catch (error) {
      console.error('Error loading template event:', error)
      setError('テンプレートイベントの読み込みに失敗しました')
    } finally {
      setLoadingTemplate(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 名前とメールアドレスのバリデーション
    if (!creatorName.trim() || !creatorEmail.trim()) {
      setError('名前とメールアドレスを入力してください')
      setLoading(false)
      return
    }

    try {
      // レストランが選択されている場合、データベースからIDを取得
      let restaurantId = null
      if (restaurant) {
        if (restaurant.place_id) {
          // place_idがある場合、データベースから検索
          const { data: dbRestaurant } = await supabase
            .from('restaurants')
            .select('id')
            .eq('place_id', restaurant.place_id)
            .single()
          
          if (dbRestaurant) {
            restaurantId = dbRestaurant.id
          }
        } else if (restaurant.id && !restaurant.id.startsWith('temp-')) {
          // データベースに保存済みのレストラン（UUID形式）
          if (restaurant.id.includes('-') && restaurant.id.length === 36) {
            restaurantId = restaurant.id
          }
        }
      }

      // トークンを生成（イベントのURL用、より短くて使いやすい形式）
      const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let token = ''
        for (let i = 0; i < 16; i++) {
          token += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return token
      }
      const token = generateToken()

      const { data: newEvent, error: insertError } = await supabase
        .from('lunch_events')
        .insert({
          created_by: null, // 匿名作成のためnull
          creator_name: creatorName.trim(),
          creator_email: creatorEmail.trim().toLowerCase(), // メールアドレスを小文字に正規化
          token: token,
          title: title.trim() || null,
          date,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          location_type: locationType,
          restaurant_id: restaurantId,
          restaurant_name: restaurant?.name || null,
          restaurant_address: restaurant?.address || null,
          creator_latitude: userLocation?.lat || null,
          creator_longitude: userLocation?.lng || null,
          description: description || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 作成したイベントの詳細ページにリダイレクト
      if (newEvent) {
        router.push(`/events/${newEvent.token || newEvent.id}`)
      } else {
        router.push('/')
      }
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {searchParams.get('template') ? '予定を再利用' : '予定を作成'}
          </h1>
          <p className="text-gray-600 mt-2">
            {searchParams.get('template') 
              ? '既存のイベント設定を元に、新しい日付で予定を作成できます'
              : 'お昼ごはんの予定を簡単に作成できます'}
          </p>
          {loadingTemplate && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              テンプレートイベントを読み込み中...
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} noValidate className="bg-gray-50 rounded-xl border-2 border-gray-200 p-8 space-y-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-sm font-bold text-gray-900 mb-4">作成者情報</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="creatorName" className="block text-sm font-bold text-gray-900 mb-2">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  id="creatorName"
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-0 focus:border-orange-500 focus:shadow-[0_0_0_2px_rgba(249,115,22,0.2)] transition-all duration-300"
                  placeholder="例: 田中"
                />
              </div>
              <div>
                <label htmlFor="creatorEmail" className="block text-sm font-bold text-gray-900 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  id="creatorEmail"
                  type="email"
                  value={creatorEmail}
                  onChange={(e) => setCreatorEmail(e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-0 focus:border-orange-500 focus:shadow-[0_0_0_2px_rgba(249,115,22,0.2)] transition-all duration-300"
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <label htmlFor="date" className="block text-sm font-bold text-gray-900 mb-2">
              日付 <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
            />
          </div>

          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              時間 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 text-sm bg-white font-medium min-h-[48px] cursor-pointer"
              >
                {Array.from({ length: 7 }, (_, i) => 10 + i).flatMap((hour) =>
                  ['00', '15', '30', '45'].map((minute) => {
                    const time = `${hour.toString().padStart(2, '0')}:${minute}`
                    return (
                      <option key={time} value={time}>
                        {hour}:{minute}
                      </option>
                    )
                  })
                )}
              </select>
              <span className="text-gray-500">〜</span>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 text-sm bg-white font-medium min-h-[48px] cursor-pointer"
              >
                {Array.from({ length: 7 }, (_, i) => 10 + i).flatMap((hour) =>
                  ['00', '15', '30', '45'].map((minute) => {
                    const time = `${hour.toString().padStart(2, '0')}:${minute}`
                    return (
                      <option key={time} value={time}>
                        {hour}:{minute}
                      </option>
                    )
                  })
                )}
              </select>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <label htmlFor="title" className="block text-sm font-bold text-gray-900 mb-2">
              タイトル（任意）
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
              placeholder="例: チームランチ、プロジェクト打ち合わせなど"
            />
          </div>
          
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-2">
              説明（任意）
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 resize-none"
              placeholder="例: 今日は軽めに"
            />
          </div>

          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              場所 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="locationType"
                  value="undecided"
                  checked={locationType === 'undecided'}
                  onChange={(e) => {
                    setLocationType(e.target.value as any)
                    setRestaurant(null)
                  }}
                  className="mr-3 w-4 h-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-gray-700 font-medium">まだ決めてない</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="locationType"
                  value="freeroom"
                  checked={locationType === 'freeroom'}
                  onChange={(e) => {
                    setLocationType(e.target.value as any)
                    setRestaurant(null)
                  }}
                  className="mr-3 w-4 h-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-gray-700 font-medium">フリースペースで</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="locationType"
                  value="restaurant"
                  checked={locationType === 'restaurant'}
                  onChange={(e) => setLocationType(e.target.value as any)}
                  className="mr-3 w-4 h-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-gray-700 font-medium">お店に行く</span>
              </label>
            </div>
          </div>

          {locationType === 'restaurant' && (
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                お店を選ぶ（任意）
              </label>
              <p className="text-sm text-gray-600 mb-4">
                あなたの位置情報から近くのお店を検索します。参加者にもお店を選んでもらえます。
              </p>
              {userLocation ? (
                <RestaurantSearch
                  userLocation={userLocation}
                  onSelect={(selectedRestaurant) => {
                    setRestaurant({
                      id: selectedRestaurant.id,
                      name: selectedRestaurant.name,
                      address: selectedRestaurant.address,
                      place_id: selectedRestaurant.place_id,
                    })
                  }}
                  selectedRestaurant={restaurant ? {
                    id: restaurant.id,
                    name: restaurant.name,
                    address: restaurant.address,
                    latitude: 0,
                    longitude: 0,
                    place_id: restaurant.place_id,
                  } : null}
                />
              ) : (
                <p className="text-sm text-gray-500">位置情報を取得中...</p>
              )}
              <p className="text-xs text-gray-500 mt-3">
                ※ お店を選ばなくても、参加者が後からお店を選べます
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 ease-out font-bold text-lg shadow-lg hover:shadow-xl"
            >
              {loading ? '作成中...' : '作成してURLを取得'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function NewEventPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    }>
      <NewEventFormContent />
    </Suspense>
  )
}
