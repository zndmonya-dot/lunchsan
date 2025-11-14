'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import RestaurantSearch from '@/components/RestaurantSearch'
import { hashPassword } from '@/lib/password'
import { getManualLocation, subscribeManualLocation } from '@/lib/manualLocation'
import {
  validateEmail,
  validatePassword,
  validateAndSanitizeName,
  sanitizeString,
  sanitizeTextarea,
  validateDateString,
  validateTimeString,
  validateLength
} from '@/lib/security'

// エラーメッセージを日本語に変換する関数
function getJapaneseErrorMessage(error: any): string {
  if (!error) return 'エラーが発生しました'
  
  // エラーコードに基づく日本語メッセージ
  if (error.code === '23505') {
    return '重複したデータが存在します'
  }
  if (error.code === '23503') {
    return '参照先のデータが見つかりませんでした'
  }
  if (error.code === '23502') {
    return '必須項目が入力されていません'
  }
  if (error.code === 'PGRST116') {
    return '権限がありません'
  }
  if (error.message) {
    // 英語のエラーメッセージを日本語に変換
    const message = error.message.toLowerCase()
    if (message.includes('duplicate key')) {
      return '重複したデータが存在します'
    }
    if (message.includes('foreign key')) {
      return '参照先のデータが見つかりませんでした'
    }
    if (message.includes('not null')) {
      return '必須項目が入力されていません'
    }
    if (message.includes('permission') || message.includes('policy')) {
      return '権限がありません'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください'
    }
  }
  
  return 'エラーが発生しました。しばらく時間をおいて再度お試しください'
}

interface LocationCandidate {
  id: string
  name: string
  type: 'text' | 'restaurant'
  restaurantId?: string | null
  restaurantName?: string | null
  restaurantAddress?: string | null
}

export default function CreateEventForm() {
  const router = useRouter()
  const supabase = createClient()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('12:00')
  const [endTime, setEndTime] = useState('13:00')
  const [locationCandidates, setLocationCandidates] = useState<LocationCandidate[]>([])
  const [newCandidateText, setNewCandidateText] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [creatorEmail, setCreatorEmail] = useState('')
  const [creatorPassword, setCreatorPassword] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedRestaurantIds, setAddedRestaurantIds] = useState<Set<string>>(new Set())
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [isTemplateMode, setIsTemplateMode] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [createdEventUrl, setCreatedEventUrl] = useState<string>('')
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false)
  const [autoDailyUpdate, setAutoDailyUpdate] = useState<boolean>(false)

  // モーダル表示中は背景のスクロールを無効化
  useEffect(() => {
    if (showUrlModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showUrlModal])

  // ユーザーの位置情報を取得
  useEffect(() => {
    const saved = getManualLocation()
    if (saved) {
      setUserLocation({ lat: saved.lat, lng: saved.lng })
    } else if (typeof window !== 'undefined' && navigator.geolocation) {
      const timeoutId = setTimeout(() => {
        setUserLocation({ lat: 35.6812, lng: 139.7671 })
      }, 10000)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId)
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          clearTimeout(timeoutId)
          setUserLocation({ lat: 35.6812, lng: 139.7671 })
        },
        {
          timeout: 10000,
          maximumAge: 60000,
          enableHighAccuracy: false,
        }
      )
    } else {
      setUserLocation({ lat: 35.6812, lng: 139.7671 })
    }

    const unsubscribe = subscribeManualLocation((location) => {
      if (location) {
        setUserLocation({ lat: location.lat, lng: location.lng })
      }
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  // テンプレートイベントから情報を読み込む（URLパラメータから）
  useEffect(() => {
    if (typeof window === 'undefined' || isTemplateMode) return
    
    const params = new URLSearchParams(window.location.search)
    const templateId = params.get('template')
    if (!templateId) return
    
    setIsTemplateMode(true)
    
    const loadTemplateEvent = async () => {
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
          if (event.description) setDescription(event.description)
          if (event.auto_daily_update !== undefined) setAutoDailyUpdate(event.auto_daily_update)
          if (event.creator_latitude && event.creator_longitude) {
            setUserLocation({
              lat: event.creator_latitude,
              lng: event.creator_longitude,
            })
          }
          
          // 場所の候補を読み込む
          if (Array.isArray(event.location_candidates) && event.location_candidates.length > 0) {
            const candidates: LocationCandidate[] = event.location_candidates.map((lc: any) => ({
              id: `temp-${Date.now()}-${Math.random()}`,
              name: lc.name,
              type: lc.type as 'text' | 'restaurant',
              restaurantId: lc.restaurant_id || null,
              restaurantName: lc.restaurant_name || null,
              restaurantAddress: lc.restaurant_address || null,
            }))
            setLocationCandidates(candidates)
            
            // 追加済みレストランIDをセット
            const restaurantIds = new Set<string>()
            candidates.forEach((c) => {
              if (c.restaurantId) {
                restaurantIds.add(c.restaurantId)
              }
            })
            setAddedRestaurantIds(restaurantIds)
          }
        }
      } catch (error) {
        console.error('Error loading template event:', error)
        setError('テンプレートイベントの読み込みに失敗しました')
      } finally {
        setLoadingTemplate(false)
      }
    }
    
    loadTemplateEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addTextCandidate = () => {
    const sanitizedName = validateAndSanitizeName(newCandidateText, 100)
    if (sanitizedName) {
      const candidate: LocationCandidate = {
        id: `temp-${Date.now()}`,
        name: sanitizedName,
        type: 'text',
      }
      setLocationCandidates([...locationCandidates, candidate])
      setNewCandidateText('')
    }
  }

  const addRestaurantCandidate = (restaurant: {
    id: string
    name: string
    address: string
    place_id?: string | null
  }) => {
    // 既に同じお店が追加されているかチェック
    const restaurantId = restaurant.place_id || restaurant.id
    const existing = locationCandidates.find(
      (c) => 
        c.restaurantName === restaurant.name || 
        c.restaurantId === restaurant.id ||
        (restaurant.place_id && c.restaurantId === restaurant.place_id)
    )
    if (existing) {
      return
    }

    const candidate: LocationCandidate = {
      id: `temp-restaurant-${Date.now()}`,
      name: restaurant.name,
      type: 'restaurant',
      restaurantId: restaurant.place_id || restaurant.id, // place_idを優先
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address,
    }
    setLocationCandidates([...locationCandidates, candidate])
    setAddedRestaurantIds(new Set([...addedRestaurantIds, restaurantId]))
  }

  const removeCandidate = (id: string) => {
    const candidate = locationCandidates.find((c) => c.id === id)
    if (candidate && candidate.restaurantId) {
      const newSet = new Set(addedRestaurantIds)
      newSet.delete(candidate.restaurantId)
      setAddedRestaurantIds(newSet)
    }
    setLocationCandidates(locationCandidates.filter((c) => c.id !== id))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 名前のバリデーションとサニタイズ
    const sanitizedName = validateAndSanitizeName(creatorName, 50)
    if (!sanitizedName) {
      setError('名前を正しく入力してください（50文字以内）')
      setLoading(false)
      return
    }

    // メールアドレスのバリデーション
    if (!validateEmail(creatorEmail)) {
      setError('有効なメールアドレスを入力してください')
      setLoading(false)
      return
    }

    // パスワードのバリデーション
    const passwordValidation = validatePassword(creatorPassword)
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || 'パスワードを正しく入力してください')
      setLoading(false)
      return
    }

    // 日付のバリデーション
    if (!validateDateString(date)) {
      setError('有効な日付を選択してください')
      setLoading(false)
      return
    }

    // 時間のバリデーション
    if (!validateTimeString(startTime) || !validateTimeString(endTime)) {
      setError('有効な時間を選択してください')
      setLoading(false)
      return
    }

    try {
      // パスワードをハッシュ化
      const passwordHash = await hashPassword(creatorPassword.trim())
      
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

      // タイトルと説明をサニタイズ
      const sanitizedTitle = title ? sanitizeString(title, 100) : null
      const sanitizedDescription = description ? sanitizeTextarea(description, 1000) : null

      // イベントを作成
      const { data: newEvent, error: insertError } = await supabase
        .from('lunch_events')
        .insert({
          created_by: null, // 匿名作成のためnull
          creator_name: sanitizedName,
          creator_email: creatorEmail.trim().toLowerCase(), // メールアドレスを小文字に正規化
          creator_password_hash: passwordHash, // パスワードハッシュを保存
          token: token,
          title: sanitizedTitle,
          date,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          location_type: 'undecided', // 後方互換性のため残す
          restaurant_id: null,
          restaurant_name: null,
          restaurant_address: null,
          creator_latitude: userLocation?.lat || null,
          creator_longitude: userLocation?.lng || null,
          description: sanitizedDescription,
          auto_daily_update: autoDailyUpdate,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 場所の候補を追加
      if (locationCandidates.length > 0 && newEvent) {
        const candidateErrors: string[] = []
        
        for (const candidate of locationCandidates) {
          try {
            let restaurantId = null

            // レストランの場合、データベースからIDを取得または作成
            if (candidate.type === 'restaurant' && candidate.restaurantId) {
              // place_idがある場合はそれで検索
              if (candidate.restaurantId && !candidate.restaurantId.startsWith('temp-') && candidate.restaurantId.length > 20) {
                // place_idで検索（Google Places APIのplace_id形式）
                const { data: existingRestaurant } = await supabase
                  .from('restaurants')
                  .select('id')
                  .eq('place_id', candidate.restaurantId)
                  .maybeSingle()

                if (existingRestaurant) {
                  restaurantId = existingRestaurant.id
                } else {
                  // 新規作成（place_idがある場合）
                  const { data: newRestaurant, error: restaurantError } = await supabase
                    .from('restaurants')
                    .insert({
                      name: candidate.restaurantName || '',
                      address: candidate.restaurantAddress || '',
                      place_id: candidate.restaurantId,
                      latitude: userLocation?.lat || 0,
                      longitude: userLocation?.lng || 0,
                    })
                    .select()
                    .single()

                  if (restaurantError) {
                    console.error('Error creating restaurant:', restaurantError)
                    candidateErrors.push(`${candidate.name}のレストラン情報の保存に失敗しました`)
                  } else if (newRestaurant) {
                    restaurantId = newRestaurant.id
                  }
                }
              } else if (candidate.restaurantId && candidate.restaurantId.startsWith('temp-restaurant-')) {
                // 一時的なIDの場合は、名前と住所で検索または新規作成
                const { data: existingRestaurant } = await supabase
                  .from('restaurants')
                  .select('id')
                  .eq('name', candidate.restaurantName)
                  .maybeSingle()

                if (existingRestaurant) {
                  restaurantId = existingRestaurant.id
                } else {
                  // 新規作成（簡易版 - place_idがない場合）
                  const { data: newRestaurant, error: restaurantError } = await supabase
                    .from('restaurants')
                    .insert({
                      name: candidate.restaurantName || '',
                      address: candidate.restaurantAddress || '',
                      place_id: null,
                      latitude: userLocation?.lat || 0,
                      longitude: userLocation?.lng || 0,
                    })
                    .select()
                    .single()

                  if (restaurantError) {
                    console.error('Error creating restaurant:', restaurantError)
                    candidateErrors.push(`${candidate.name}のレストラン情報の保存に失敗しました`)
                  } else if (newRestaurant) {
                    restaurantId = newRestaurant.id
                  }
                }
              } else if (candidate.restaurantId && candidate.restaurantId.includes('-') && candidate.restaurantId.length === 36) {
                // データベースに保存済みのレストラン（UUID形式）
                restaurantId = candidate.restaurantId
              }
            }

            const { error: candidateError } = await supabase.from('location_candidates').insert({
              event_id: newEvent.id,
              name: candidate.name,
              type: candidate.type,
              restaurant_id: restaurantId,
              restaurant_name: candidate.restaurantName || null,
              restaurant_address: candidate.restaurantAddress || null,
            })

            if (candidateError) {
              console.error('Error creating location candidate:', candidateError)
              candidateErrors.push(`${candidate.name}の追加に失敗しました`)
            }
          } catch (err) {
            console.error('Error processing candidate:', err)
            candidateErrors.push(`${candidate.name}の処理中にエラーが発生しました`)
          }
        }
        
        // 候補の追加でエラーが発生した場合でも、イベントは作成されているので続行
        if (candidateErrors.length > 0) {
          console.warn('Some candidates failed to add:', candidateErrors)
        }
      }

      // 作成したイベントのURLをコピーしてから詳細ページにリダイレクト
      if (newEvent) {
        const eventUrl = `${window.location.origin}/events/${newEvent.token || newEvent.id}`
        try {
          // Clipboard APIが利用可能な場合
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(eventUrl)
          } else {
            // フォールバック: 古いブラウザやHTTPSでない環境用
            const textArea = document.createElement('textarea')
            textArea.value = eventUrl
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            textArea.style.top = '-999999px'
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            try {
              document.execCommand('copy')
            } catch (err) {
              console.error('Failed to copy URL:', err)
            }
            document.body.removeChild(textArea)
          }
          // コピー成功時にメッセージを表示
          setCopiedUrl(true)
          setTimeout(() => {
            setCopiedUrl(false)
          }, 2000)
          // URLをモーダルで表示
          setCreatedEventUrl(eventUrl)
          setShowUrlModal(true)
        } catch (err) {
          console.error('Failed to copy URL:', err)
          // コピーに失敗した場合でもURLを表示
          setCreatedEventUrl(eventUrl)
          setShowUrlModal(true)
        }
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error: any) {
      setError(getJapaneseErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="create-form" className="bg-white py-12 sm:py-16 md:py-20 border-t border-gray-200 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* 左上から始まるZパターン: タイトルと説明 */}
          <div className="text-left mb-10">
            <div className="mb-4">
              <div className="w-14 h-14 bg-orange-600 rounded-lg flex items-center justify-center shadow-sm inline-flex">
                <i className="ri-edit-line text-white text-2xl"></i>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {isTemplateMode ? '予定を再利用' : '予定調整を始める'}
            </h2>
            <p className="text-base sm:text-lg text-gray-700 font-medium">
              {isTemplateMode
                ? '既存のイベント設定を元に、新しい日付で予定を作成できます（日付は変更してください）'
                : '1分で出欠確認が始められます'}
            </p>
            {loadingTemplate && (
              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-700 text-sm font-medium shadow-sm">
                テンプレートイベントを読み込み中...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 border-2 border-orange-200 shadow-lg">
            {/* Zパターン: 左上から右下への流れに最適化 */}
            {/* 1. 左上: 必須情報（作成者情報、日付、時間） */}
            <div className="space-y-6 mb-8">
              {/* 作成者情報 - 左上から右下への視線の流れを最適化 */}
              <div className="space-y-4">
                {/* 名前とメールアドレス（横並び） */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="creatorName" className="block text-sm font-medium text-gray-700 mb-2">
                      作成者名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="creatorName"
                      type="text"
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      autoComplete="off"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm bg-white font-medium min-h-[48px]"
                      placeholder="例: 田中"
                    />
                  </div>
                  <div>
                    <label htmlFor="creatorEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="creatorEmail"
                      type="email"
                      value={creatorEmail}
                      onChange={(e) => setCreatorEmail(e.target.value)}
                      autoComplete="off"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm bg-white font-medium min-h-[48px]"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>
                
                {/* パスワード（全幅、他のフィールドと同じスタイルで統一） */}
                <div>
                  <label htmlFor="creatorPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="creatorPassword"
                    type="password"
                    value={creatorPassword}
                    onChange={(e) => setCreatorPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm bg-white font-medium min-h-[48px]"
                    placeholder="例: 4文字以上推奨"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">予定を編集する際に必要です。パスワードは暗号化して保存されます。</p>
                </div>
              </div>

              {/* 日付と時間（横並び） */}
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                {/* 日付 */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    日付 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 text-sm bg-white font-medium min-h-[48px] box-border"
                    />
                  </div>
                </div>

                {/* 時間 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <span className="text-gray-600 text-base font-bold">〜</span>
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
              </div>

              {/* タイトル */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル（任意）
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoComplete="off"
                  placeholder="例: チームランチ、プロジェクト打ち合わせなど"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm bg-white font-medium min-h-[48px]"
                />
              </div>
            </div>

            {/* 2. 下段: 任意情報（場所の候補、説明、毎日自動初期化） */}
            <div className="space-y-6 mb-8">

              {/* 場所の候補 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <i className="ri-map-pin-line text-orange-600 text-lg"></i>
                  <label className="block text-sm font-bold text-gray-800">
                    場所の候補（任意）
                  </label>
                </div>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed font-medium">
                  みんなに選んでもらいたい候補をここで登録します。手入力でも、近くのお店から選んでも追加できます。
                </p>

                {/* テキストで候補を追加 */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newCandidateText}
                        onChange={(e) => setNewCandidateText(e.target.value)}
                        autoComplete="off"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTextCandidate()
                          }
                        }}
                        placeholder="例: 社員食堂、会議室Aなど"
                        className="w-full px-5 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm min-h-[48px] bg-white font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTextCandidate}
                      className="px-5 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg h-[48px] min-w-[90px] touch-manipulation transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <i className="ri-add-line text-base"></i>
                      <span>追加</span>
                    </button>
                  </div>
                </div>

                {/* 近くのお店から追加 */}
                {userLocation && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="ri-store-line text-orange-600 text-lg"></i>
                      <label className="block text-sm font-bold text-gray-800">
                        近くのお店から追加（任意）
                      </label>
                    </div>
                    {startTime && endTime && (
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed font-medium">
                        {startTime}〜{endTime}の時間帯に営業しているお店だけを表示します。
                      </p>
                    )}
                    <RestaurantSearch
                      userLocation={userLocation}
                      onSelect={addRestaurantCandidate}
                      selectedRestaurant={null}
                      startTime={startTime}
                      endTime={endTime}
                      eventDate={date}
                      addedRestaurantIds={addedRestaurantIds}
                    />
                  </div>
                )}

                {/* 追加された候補の一覧 */}
                {locationCandidates.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-3 mb-1">
                      <i className="ri-checkbox-circle-line text-green-600 text-xl"></i>
                      <p className="text-base font-bold text-gray-800">追加された候補 ({locationCandidates.length}件)</p>
                    </div>
                    {locationCandidates.map((candidate, index) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between p-5 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border-2 border-green-200 shadow-sm hover:shadow-md transition-all animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                            <i className="ri-check-line text-white text-base"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-gray-900 mb-2">{candidate.name}</p>
                            {candidate.restaurantAddress && (
                              <div className="flex items-start gap-2">
                                <i className="ri-map-pin-line text-gray-400 text-sm mt-0.5 flex-shrink-0"></i>
                                <p className="text-sm text-gray-600 leading-loose">{candidate.restaurantAddress}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCandidate(candidate.id)}
                          className="ml-4 p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="削除"
                        >
                          <i className="ri-close-line text-xl"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* 説明 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <i className="ri-file-text-line text-orange-600 text-lg"></i>
                  <label htmlFor="description" className="block text-sm font-bold text-gray-800">
                    説明（任意）
                  </label>
                </div>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例: 楽しいお昼ごはんの時間を過ごしましょう！"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all text-gray-900 placeholder:text-gray-400 text-sm bg-white font-medium"
                />
              </div>

              {/* 毎日自動初期化 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <i className="ri-refresh-line text-orange-600 text-lg"></i>
                    <div className="flex-1">
                      <label className="text-sm font-semibold text-gray-900 cursor-pointer">
                        毎日自動初期化
                      </label>
                      <p className="text-xs text-gray-600 mt-0.5">
                        毎日0時に日付・参加者・投票結果が自動リセット。常連メンバーならURLをブックマークしておくだけで、翌日もすぐ使えます。
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoDailyUpdate(!autoDailyUpdate)}
                    disabled={loading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      autoDailyUpdate ? 'bg-orange-600' : 'bg-gray-300'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoDailyUpdate ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold shadow-sm animate-slide-in">
                <div className="flex items-center gap-2">
                  <i className="ri-error-warning-line text-lg"></i>
                  {error}
                </div>
              </div>
            )}

            {/* 3. 右下: 送信ボタン（Zパターンの最後） */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-orange-600 text-white rounded-xl font-bold text-base hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl h-[48px] touch-manipulation transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>作成中...</span>
                  </>
                ) : (
                  <>
                    <span>作成してURLをコピー</span>
                    <i className="ri-arrow-right-line text-xl"></i>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* コピー成功メッセージ */}
      {copiedUrl && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <i className="ri-checkbox-circle-line text-xl"></i>
          <span className="font-medium">コピーしました</span>
        </div>
      )}

      {/* URLコピー完了モーダル - 左上から右下への視線の流れに最適化 */}
      {showUrlModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" 
          onClick={() => {
            setShowUrlModal(false)
            const eventId = createdEventUrl.split('/events/')[1]
            if (eventId) {
              router.push(`/events/${eventId}`)
              router.refresh()
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-slide-in" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* 左上: 成功アイコンとタイトル */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-checkbox-circle-line text-green-600 text-4xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">予定のURLをコピーしました</h3>
              <p className="text-sm text-gray-600 leading-relaxed">このURLを参加者と共有してください。コピーしてチャットに貼るだけで、みんなが見られます。</p>
            </div>
            
            {/* 左下: URL表示とコピーボタン */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <div className="flex items-stretch gap-2">
                <input
                  type="text"
                  value={createdEventUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-sm text-gray-900 font-mono break-all min-h-[48px]"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // Clipboard APIが利用可能な場合
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(createdEventUrl)
                      } else {
                        // フォールバック: 古いブラウザやHTTPSでない環境用
                        const textArea = document.createElement('textarea')
                        textArea.value = createdEventUrl
                        textArea.style.position = 'fixed'
                        textArea.style.left = '-999999px'
                        textArea.style.top = '-999999px'
                        document.body.appendChild(textArea)
                        textArea.focus()
                        textArea.select()
                        try {
                          document.execCommand('copy')
                        } catch (err) {
                          console.error('Failed to copy URL:', err)
                          return
                        }
                        document.body.removeChild(textArea)
                      }
                      // コピー成功時にメッセージを表示
                      setCopiedUrl(true)
                      setTimeout(() => {
                        setCopiedUrl(false)
                      }, 2000)
                    } catch (err) {
                      console.error('Failed to copy URL:', err)
                    }
                  }}
                  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0 min-h-[48px] flex items-center justify-center"
                  title="コピー"
                >
                  <i className="ri-file-copy-line text-xl"></i>
                </button>
              </div>
            </div>

            {/* 右下: OKボタン */}
            <button
              type="button"
              onClick={() => {
                setShowUrlModal(false)
                const eventId = createdEventUrl.split('/events/')[1]
                if (eventId) {
                  router.push(`/events/${eventId}`)
                  router.refresh()
                }
              }}
              className="w-full px-6 py-3.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-bold text-base shadow-sm min-h-[48px]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
