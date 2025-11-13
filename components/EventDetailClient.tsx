'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Database } from '@/types/database'
import Header from '@/components/Header'
import RestaurantVoting from '@/components/RestaurantVoting'
import LocationVoting from '@/components/LocationVoting'
import RestaurantSearch from '@/components/RestaurantSearch'
import { hashPassword, verifyPassword } from '@/lib/password'
import {
  validateEmail,
  validatePassword,
  validateAndSanitizeName,
  sanitizeString,
  sanitizeTextarea,
  validateDateString,
  validateTimeString,
  validateEventId
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

type LunchEvent = Database['public']['Tables']['lunch_events']['Row']
type EventParticipant = Database['public']['Tables']['event_participants']['Row'] & {
  password_hash?: string | null
  profiles: {
    name: string | null
    email: string
  } | null
}

interface EventDetailClientProps {
  event: LunchEvent & {
    auto_daily_update?: boolean | null
    creator_password_hash?: string | null
    event_participants: EventParticipant[]
    restaurant_votes?: Array<{
      id: string
      restaurant_id: string
      user_id: string | null
      name: string | null
      email: string | null
      restaurants: {
        id: string
        name: string
        address: string
        rating: number | null
        price_level: number | null
      }
    }>
    location_candidates?: Array<{
      id: string
      name: string
      type: 'text' | 'restaurant'
      restaurant_id: string | null
      restaurant_name: string | null
      restaurant_address: string | null
    }>
    location_votes?: Array<{
      id: string
      candidate_id: string
      name: string | null
      password_hash?: string | null
    }>
  }
  currentUserId: string | null
  currentUserProfile: { name: string | null; email: string } | null
  currentParticipant: EventParticipant | null
}

export default function EventDetailClient({
  event,
  currentUserId,
  currentUserProfile,
  currentParticipant: initialParticipant,
}: EventDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [participant, setParticipant] = useState(initialParticipant)
  const [loading, setLoading] = useState(false)
  // ローカルストレージから名前を読み込む（Hydrationエラーを防ぐため、初期値は空文字列）
  const [participantName, setParticipantName] = useState('')
  const [participantPassword, setParticipantPassword] = useState('') // 参加者の識別用パスワード（任意）
  
  // ローカルストレージからの自動入力は無効化（不便な古語が多いため）
  // 参加者IDのみをローカルストレージから読み込んで、参加者情報を復元する
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasLoadedFromStorage) {
      const storageKey = `lunch_participant_${event.id}`
      const storedData = localStorage.getItem(storageKey)
      if (storedData) {
        try {
          const { participantId } = JSON.parse(storedData)
          // 参加者IDのみを使用して参加者情報を復元（名前は自動入力しない）
          if (participantId && Array.isArray(event.event_participants)) {
            const foundParticipant = event.event_participants.find(p => p.id === participantId)
            if (foundParticipant) {
              setParticipant(foundParticipant)
              // 名前は自動入力しない（ユーザーが手動で入力する）
            }
          }
        } catch (e) {
          // JSON解析エラーは無視
        }
      }
      setHasLoadedFromStorage(true)
    }
  }, [event.id])
  
  // イベントごとの参加者情報をローカルストレージに保存
  // 注意: パスワードハッシュは保存しない（セキュリティのため）
  useEffect(() => {
    if (typeof window !== 'undefined' && participant && participant.id) {
      const storageKey = `lunch_participant_${event.id}`
      localStorage.setItem(storageKey, JSON.stringify({
        participantId: participant.id,
        name: participantName.trim() || participant.name || '',
        updatedAt: new Date().toISOString()
      }))
    } else if (typeof window !== 'undefined' && participantName.trim()) {
      // 参加者IDがない場合は名前のみ保存
      const storageKey = `lunch_participant_${event.id}`
      localStorage.setItem(storageKey, JSON.stringify({
        name: participantName.trim(),
        updatedAt: new Date().toISOString()
      }))
      // 旧形式も保存（後方互換性）
      localStorage.setItem('lunch_participant_name', participantName.trim())
    }
  }, [participant, participantName, event.id])
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [updatingDate, setUpdatingDate] = useState(false)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [updatingEvent, setUpdatingEvent] = useState(false)
  const [locationCandidates, setLocationCandidates] = useState<LocationCandidate[]>([])
  const [newCandidateText, setNewCandidateText] = useState('')
  const [addedRestaurantIds, setAddedRestaurantIds] = useState<Set<string>>(new Set())
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [ownerEmail, setOwnerEmail] = useState<string>('')
  const [ownerPassword, setOwnerPassword] = useState<string>('')
  const [showOwnerCheck, setShowOwnerCheck] = useState(false)
  const [ownerCheckError, setOwnerCheckError] = useState<string | null>(null)
  const [verifiedOwnerEmail, setVerifiedOwnerEmail] = useState<string>('') // 認証済みオーナーメールアドレス
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [autoDailyUpdate, setAutoDailyUpdate] = useState<boolean>(event.auto_daily_update || false)
  
  // event.dateを文字列形式に変換（YYYY-MM-DD）
  const getDateString = (date: string | Date) => {
    if (typeof date === 'string') {
      return date.split('T')[0] // ISO形式から日付部分のみ取得
    }
    return format(date, 'yyyy-MM-dd')
  }
  
  // 時間を文字列形式に変換（HH:mm）
  const getTimeString = (time: string | null | undefined) => {
    if (!time) return '12:00'
    if (typeof time === 'string') {
      return time.substring(0, 5) // HH:mm:ss から HH:mm のみ取得
    }
    return '12:00'
  }
  
  const [newDate, setNewDate] = useState(getDateString(event.date))
  const [editTitle, setEditTitle] = useState(event.title || '')
  const [editStartTime, setEditStartTime] = useState(getTimeString(event.start_time))
  const [editEndTime, setEditEndTime] = useState(getTimeString(event.end_time))
  const [editDescription, setEditDescription] = useState(event.description || '')
  
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
          console.warn('Error getting location:', error)
          // イベント作成者の位置情報がある場合はそれを使用
          if (event.creator_latitude && event.creator_longitude) {
            setUserLocation({
              lat: event.creator_latitude,
              lng: event.creator_longitude,
            })
          }
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 }
      )
    } else if (event.creator_latitude && event.creator_longitude) {
      // 位置情報が取得できない場合はイベント作成者の位置情報を使用
      setUserLocation({
        lat: event.creator_latitude,
        lng: event.creator_longitude,
      })
    }
  }, [event.creator_latitude, event.creator_longitude])
  
  // 既存の場所の候補を読み込む
  useEffect(() => {
    if (Array.isArray(event.location_candidates)) {
      const candidates: LocationCandidate[] = event.location_candidates.map((lc) => ({
        id: lc.id,
        name: lc.name,
        type: lc.type,
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
  }, [event.location_candidates])
  
  // event.dateが変更されたときにnewDateも更新
  useEffect(() => {
    setNewDate(getDateString(event.date))
  }, [event.date])
  
  // event情報が変更されたときに編集フィールドも更新
  useEffect(() => {
    setEditTitle(event.title || '')
    setEditStartTime(getTimeString(event.start_time))
    setEditEndTime(getTimeString(event.end_time))
    setEditDescription(event.description || '')
  }, [event.title, event.start_time, event.end_time, event.description])
  
  // 名前で既存の参加者を検索（ローカルストレージの参加者IDを優先）
  useEffect(() => {
    if (participantName.trim() && Array.isArray(event.event_participants)) {
      // まずローカルストレージから参加者IDを取得
      if (typeof window !== 'undefined') {
        const storageKey = `lunch_participant_${event.id}`
        const storedData = localStorage.getItem(storageKey)
        if (storedData) {
          try {
            const { participantId } = JSON.parse(storedData)
            if (participantId) {
              const foundParticipant = event.event_participants.find(p => p.id === participantId)
              if (foundParticipant && foundParticipant.name?.trim().toLowerCase() === participantName.trim().toLowerCase()) {
                setParticipant(foundParticipant)
                return
              }
            }
          } catch (e) {
            // JSON解析エラーは無視
          }
        }
      }
      
      // 参加者IDが見つからない場合は名前で検索
      const foundParticipants = event.event_participants.filter(
        (p) => p.name?.trim().toLowerCase() === participantName.trim().toLowerCase()
      )
      if (foundParticipants.length > 0) {
        // 最新の参加者を取得
        const latestParticipant = foundParticipants.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        setParticipant(latestParticipant)
      } else {
        setParticipant(null)
      }
    } else if (!participantName.trim()) {
      // 名前が空の場合は参加者をクリア
      setParticipant(null)
    }
  }, [participantName, event.event_participants, event.id])
  
  // 既存の参加者情報から名前を取得（初回のみ、ユーザーが手動で編集している場合は上書きしない）
  // 注意: パスワードハッシュは取得しない（セキュリティのため）
  const [hasInitializedName, setHasInitializedName] = useState(false)
  useEffect(() => {
    if (participant && !hasInitializedName) {
      if (participant.name && !participantName.trim()) {
      setParticipantName(participant.name)
        setHasInitializedName(true)
      }
      // パスワードハッシュは取得しない（セキュリティのため）
    } else if (!participant) {
      setHasInitializedName(false)
    }
  }, [participant])

  // オーナーチェック関数（メールアドレス+パスワード）
  const checkIsOwner = async (email: string, password: string): Promise<boolean> => {
    if (!event.creator_email || !email) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Owner check failed: missing email', {
          hasCreatorEmail: !!event.creator_email,
          hasEmail: !!email,
        })
      }
      return false
    }
    
    const creatorEmailNormalized = event.creator_email.toLowerCase().trim()
    const emailNormalized = email.toLowerCase().trim()
    
    if (creatorEmailNormalized !== emailNormalized) {
      return false
    }
    
    // パスワードが設定されている場合は検証
    if (event.creator_password_hash && password) {
      const isValid = await verifyPassword(password, event.creator_password_hash)
    if (process.env.NODE_ENV === 'development') {
        console.log('Owner password check:', {
          hasPasswordHash: !!event.creator_password_hash,
          isValid,
      })
    }
      return isValid
  }

    // パスワードが設定されていない場合はメールアドレスのみで認証（後方互換性）
    if (!event.creator_password_hash) {
      return true
    }
    
    // パスワードが設定されているが入力されていない場合は認証失敗
    return false
  }

  // 編集モードに入る前のオーナーチェック
  const handleEditClick = () => {
    // オーナーチェックモーダルを表示
      setShowOwnerCheck(true)
      setOwnerEmail('')
    setOwnerPassword('')
      setOwnerCheckError(null)
  }

  // オーナーチェック確認
  const handleOwnerCheck = async () => {
    if (!ownerEmail.trim()) {
      setOwnerCheckError('メールアドレスを入力してください')
      return
    }

    // メールアドレスのバリデーション
    if (!validateEmail(ownerEmail)) {
      setOwnerCheckError('有効なメールアドレスを入力してください')
      return
    }

    const trimmedEmail = ownerEmail.trim().toLowerCase()
    const trimmedPassword = ownerPassword.trim()
    
    // パスワードが設定されている場合は必須
    if (event.creator_password_hash && !trimmedPassword) {
      setOwnerCheckError('パスワードを入力してください')
      return
    }

    // パスワードのバリデーション（入力されている場合）
    if (trimmedPassword) {
      const passwordValidation = validatePassword(trimmedPassword)
      if (!passwordValidation.valid) {
        setOwnerCheckError(passwordValidation.error || 'パスワードを正しく入力してください')
        return
      }
    }
    
    const isOwner = await checkIsOwner(trimmedEmail, trimmedPassword)
    if (isOwner) {
      // オーナー確認成功 - 認証済みメールアドレスを保存
      setVerifiedOwnerEmail(trimmedEmail)
      
      
      // 編集モードの場合
      setEditTitle(event.title || '')
      setEditStartTime(getTimeString(event.start_time))
      setEditEndTime(getTimeString(event.end_time))
      setEditDescription(event.description || '')
      setNewDate(getDateString(event.date))
      setAutoDailyUpdate(event.auto_daily_update || false)
      // 場所の候補を読み込む
      if (Array.isArray(event.location_candidates)) {
        const candidates: LocationCandidate[] = event.location_candidates.map((lc) => ({
          id: lc.id,
          name: lc.name,
          type: lc.type,
          restaurantId: lc.restaurant_id || null,
          restaurantName: lc.restaurant_name || null,
          restaurantAddress: lc.restaurant_address || null,
        }))
        setLocationCandidates(candidates)
        const restaurantIds = new Set<string>()
        candidates.forEach((c) => {
          if (c.restaurantId) {
            restaurantIds.add(c.restaurantId)
          }
        })
        setAddedRestaurantIds(restaurantIds)
      }
      setIsEditingEvent(true)
      setIsEditingDate(false)
      setShowOwnerCheck(false)
      setOwnerCheckError(null)
      setOwnerPassword('') // セキュリティのためパスワードをクリア
      // ownerEmailはクリアしない（念のため保持）
    } else {
      // オーナーではない
      if (event.creator_password_hash) {
        setOwnerCheckError('メールアドレスまたはパスワードが正しくありません')
      } else {
      setOwnerCheckError('このメールアドレスはイベントの作成者ではありません')
      }
    }
  }

  const eventDate = new Date(event.date)
  const eventParticipants = Array.isArray(event.event_participants) ? event.event_participants : []
  const goingParticipants = eventParticipants.filter((p) => p.status === 'going')

  const handleStatusChange = async () => {
    // 名前のバリデーションとサニタイズ
    const sanitizedName = validateAndSanitizeName(participantName, 50)
    if (!sanitizedName) {
      return
    }

    setLoading(true)
    try {
      const trimmedPassword = participantPassword.trim() || null
      
      // パスワードのバリデーション（入力されている場合）
      if (trimmedPassword) {
        const passwordValidation = validatePassword(trimmedPassword)
        if (!passwordValidation.valid) {
          setLoading(false)
          return
        }
      }
      
      // パスワードが入力されている場合はハッシュ化
      let passwordHash: string | null = null
      if (trimmedPassword) {
        passwordHash = await hashPassword(trimmedPassword)
      }

      if (participant) {
        // 既存の参加者の場合、パスワードを検証してから更新
        if (participant.password_hash && trimmedPassword) {
          const isValid = await verifyPassword(trimmedPassword, participant.password_hash)
          if (!isValid) {
            alert('パスワードが正しくありません')
            setLoading(false)
            return
          }
        } else if (participant.password_hash && !trimmedPassword) {
          alert('パスワードを入力してください')
          setLoading(false)
          return
        }
        
        // パスワードが変更された場合は新しいハッシュを設定
        const newPasswordHash = passwordHash || participant.password_hash
        
        const { error } = await supabase
          .from('event_participants')
          .update({
            status: 'going',
            name: sanitizedName,
            password_hash: newPasswordHash,
          })
          .eq('id', participant.id)

        if (error) throw error
        setParticipant({ ...participant, status: 'going', name: sanitizedName, password_hash: newPasswordHash })
      } else {
        // 名前とパスワードハッシュで既存の参加者を検索
        let query = supabase
          .from('event_participants')
          .select('*')
          .eq('event_id', event.id)
          .eq('name', sanitizedName)
          .is('user_id', null)

        if (passwordHash) {
          query = query.eq('password_hash', passwordHash)
        } else {
          query = query.is('password_hash', null)
        }

        const { data: existingParticipant } = await query.maybeSingle()

        if (existingParticipant) {
          // 既存の参加者を更新
          const { error } = await supabase
            .from('event_participants')
            .update({
              status: 'going',
              name: sanitizedName,
              password_hash: passwordHash || existingParticipant.password_hash,
            })
            .eq('id', existingParticipant.id)

          if (error) throw error
          setParticipant({ ...existingParticipant, status: 'going', name: sanitizedName, password_hash: passwordHash || existingParticipant.password_hash })
        } else {
          // 新規参加者として追加（名前とパスワードハッシュ）
          const { data, error } = await supabase
            .from('event_participants')
            .insert({
              event_id: event.id,
              status: 'going',
              name: sanitizedName,
              password_hash: passwordHash,
            })
            .select()
            .single()

          if (error) throw error
          setParticipant(data as any)
        }
      }
      
      // パスワードフィールドをクリア（セキュリティのため）
      setParticipantPassword('')
      
      // 成功モーダルを表示
      setSuccessMessage('参加しました')
      setShowSuccessModal(true)
      
      router.refresh()
    } catch (error) {
      console.error('Error updating participant status:', error)
      alert('参加の登録に失敗しました: ' + getJapaneseErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // 参加者の削除
  const handleDeleteParticipant = async () => {
    if (!participant || !participantName.trim()) {
      return
    }

    // パスワードが設定されている場合は確認を求める
    if (participant.password_hash) {
      const password = prompt('パスワードを入力してください:')
      if (!password) {
        return
      }
      
      const isValid = await verifyPassword(password, participant.password_hash)
      if (!isValid) {
        alert('パスワードが正しくありません')
        return
      }
    } else {
      if (!confirm('参加を取り消しますか？')) {
        return
      }
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('id', participant.id)

      if (error) throw error
      
      // 関連する投票も削除
      const voteQuery = supabase
        .from('location_votes')
        .delete()
        .eq('event_id', event.id)
        .eq('name', participantName.trim())
      
      if (participant.password_hash) {
        await voteQuery.eq('password_hash', participant.password_hash)
      } else {
        await voteQuery.is('password_hash', null)
      }

      setParticipant(null)
      setParticipantName('')
      setParticipantPassword('')
      // イベントごとのローカルストレージを削除
      const storageKey = `lunch_participant_${event.id}`
      localStorage.removeItem(storageKey)
      // 旧形式も削除（後方互換性）
      localStorage.removeItem('lunch_participant_name')
      
      // 成功モーダルを表示
      setSuccessMessage('参加を取り消しました')
      setShowSuccessModal(true)
      
      router.refresh()
    } catch (error) {
      console.error('Error deleting participant:', error)
      alert('参加の取り消しに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDate = async () => {
    const currentDateStr = getDateString(event.date)
    if (!newDate || newDate === currentDateStr) {
      setIsEditingDate(false)
      return
    }

    // オーナーチェック（日付更新時は認証済みメールアドレスのみ使用）
    if (!verifiedOwnerEmail) {
      alert('予定の作成者として認証されていません。編集ボタンから認証してください。')
      setIsEditingDate(false)
      return
    }

    setUpdatingDate(true)
    try {
      // オーナーチェック: creator_emailでフィルタリング
      const { data: updatedEvent, error } = await supabase
        .from('lunch_events')
        .update({ date: newDate })
        .eq('id', event.id)
        .eq('creator_email', event.creator_email)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('予定の作成者として認証されていません。')
        }
        throw error
      }

      if (!updatedEvent) {
        throw new Error('日付の更新に失敗しました。作成者権限を確認してください。')
      }
      
      setIsEditingDate(false)
      router.refresh()
    } catch (error: any) {
      console.error('Error updating date:', error)
      alert('日付の更新に失敗しました: ' + getJapaneseErrorMessage(error))
    } finally {
      setUpdatingDate(false)
    }
  }

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
      restaurantId: restaurant.place_id || restaurant.id,
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


  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* 予定情報 */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-6 sm:p-8 md:p-10 mb-5">
          {!isEditingEvent ? (
            <>
              {/* タイトルと操作ボタン */}
              <div className="flex items-start justify-between mb-5 gap-4">
                <div className="flex-1 min-w-0">
                  {event.title && (
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">{event.title}</h1>
                  )}
                </div>
                {event.creator_email && (
                  <div className="flex items-start flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg font-medium touch-manipulation border border-orange-300 flex items-center gap-1.5"
                      title="予定作成者のメールアドレスとパスワードで確認後、編集できます。"
                    >
                      <i className="ri-edit-line text-base"></i>
                      <span>編集</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* 日付・時間と作成者 */}
              <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 mb-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  {/* 日付 */}
                  <div className="flex items-center gap-2">
                    <i className="ri-calendar-line text-orange-600 text-lg flex-shrink-0"></i>
                    <span className="text-base font-semibold text-gray-900">{format(eventDate, 'yyyy年M月d日(E)', { locale: ja })}</span>
                  </div>
                  
                  {/* 時間 */}
                  {(event.start_time || event.end_time) && (
                    <>
                      <div className="flex items-center gap-2">
                        <i className="ri-time-line text-orange-600 text-lg flex-shrink-0"></i>
                        <span className="text-base font-semibold text-gray-900">
                          {event.start_time && typeof event.start_time === 'string' ? event.start_time.substring(0, 5) : '12:00'} 〜 {event.end_time && typeof event.end_time === 'string' ? event.end_time.substring(0, 5) : '13:00'}
                        </span>
                      </div>
                      {event.creator_name && (
                        <>
                          <span className="text-sm text-gray-600">作成者: {event.creator_name}</span>
                          {event.auto_daily_update !== undefined && (
                            <span className="text-sm text-gray-600">
                              自動初期化: <span className={event.auto_daily_update ? 'text-orange-600 font-semibold' : 'text-gray-500'}>{event.auto_daily_update ? 'ON' : 'OFF'}</span>
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 1. 上段: 必須情報（日付、時間） */}
              <div className="space-y-6 mb-8">
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* 日付 */}
                  <div>
                    <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-2">
                      日付 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="edit-date"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 text-sm bg-white font-medium min-h-[48px]"
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
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
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
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
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
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル（任意）
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
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
                    参加者に選んでもらう場所の候補を追加してください。テキストで追加するか、近くのお店から選ぶことができます。
                  </p>

                  {/* テキストで候補を追加 */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <i className="ri-edit-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
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
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm min-h-[48px] bg-white font-medium"
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
                          近くのお店から追加
                        </label>
                      </div>
                      {editStartTime && editEndTime && (
                        <p className="text-xs text-gray-600 mb-3 leading-relaxed font-medium">
                          {editStartTime}〜{editEndTime}の営業時間内のお店を表示
                        </p>
                      )}
                      <RestaurantSearch
                        userLocation={userLocation}
                        onSelect={addRestaurantCandidate}
                        selectedRestaurant={null}
                        startTime={editStartTime}
                        endTime={editEndTime}
                        eventDate={newDate}
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
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="例: 楽しいお昼ごはんの時間を過ごしましょう！"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all text-gray-900 placeholder:text-gray-400 text-sm bg-white font-medium"
                  />
                </div>

                {/* 毎日自動初期化 */}
                {event.creator_email && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <i className="ri-refresh-line text-orange-600 text-lg"></i>
                        <div className="flex-1">
                          <label className="text-sm font-semibold text-gray-900 cursor-pointer">
                            毎日自動初期化
                          </label>
                          <p className="text-xs text-gray-600 mt-0.5">
                            毎日0時に日付・参加者・投票結果が自動でリセットされます。毎日同じメンバー・同じ時間帯で使う場合、一度作成すれば毎日同じURLで参加するだけでOKです。
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = !autoDailyUpdate
                          setAutoDailyUpdate(newValue)
                        }}
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
                )}
              </div>
            </>
          )}

          {!isEditingEvent && (
            event.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{event.description}</p>
            </div>
            )
          )}


          {isEditingEvent && (
            <div className="pt-4 border-t border-orange-200 mt-4 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={async () => {
                  // オーナーチェック（再度確認）
                  // 認証済みメールアドレス、またはオーナーチェックモーダルで入力されたメールアドレスのいずれかを使用
                  const currentOwnerEmail = verifiedOwnerEmail || ownerEmail.trim()
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Saving event - Owner check:', {
                      verifiedOwnerEmail,
                      participantName: participantName.trim(),
                      ownerEmail: ownerEmail.trim(),
                      currentOwnerEmail,
                      eventCreatorEmail: event.creator_email,
                    })
                  }
                  
                  if (!verifiedOwnerEmail) {
                    alert('予定の作成者として認証されていません。編集をキャンセルします。\n\n作成時に使用したメールアドレス: ' + (event.creator_email || '未設定'))
                    setIsEditingEvent(false)
                    setVerifiedOwnerEmail('')
                    return
                  }

                  // バリデーション
                  if (!validateDateString(newDate)) {
                    setOwnerCheckError('有効な日付を選択してください')
                    setUpdatingEvent(false)
                    return
                  }

                  if (editStartTime && !validateTimeString(editStartTime)) {
                    setOwnerCheckError('有効な開始時間を選択してください')
                    setUpdatingEvent(false)
                    return
                  }

                  if (editEndTime && !validateTimeString(editEndTime)) {
                    setOwnerCheckError('有効な終了時間を選択してください')
                    setUpdatingEvent(false)
                    return
                  }

                  setUpdatingEvent(true)
                  try {
                    // タイトルと説明をサニタイズ
                    const sanitizedTitle = editTitle ? sanitizeString(editTitle, 100) : null
                    const sanitizedDescription = editDescription ? sanitizeTextarea(editDescription, 1000) : null

                    // オーナーチェック: WHERE句にcreator_emailを追加
                    const updateData: any = {
                      title: sanitizedTitle,
                      date: newDate,
                      start_time: editStartTime ? `${editStartTime}:00` : null,
                      end_time: editEndTime ? `${editEndTime}:00` : null,
                      description: sanitizedDescription,
                      creator_latitude: userLocation?.lat || event.creator_latitude || null,
                      creator_longitude: userLocation?.lng || event.creator_longitude || null,
                      auto_daily_update: autoDailyUpdate,
                    }
                    
                    // オーナーチェック: creator_emailでフィルタリング
                    const { data: updatedEvent, error: eventError } = await supabase
                      .from('lunch_events')
                      .update(updateData)
                      .eq('id', event.id)
                      .eq('creator_email', event.creator_email)
                      .select()
                      .single()

                    if (eventError) {
                      if (eventError.code === 'PGRST116') {
                        // 更新された行がない場合（オーナーではない）
                        throw new Error('予定の作成者として認証されていません。')
                      }
                      throw eventError
                    }

                    if (!updatedEvent) {
                      throw new Error('予定の更新に失敗しました。作成者権限を確認してください。')
                    }

                    // 既存の場所の候補を削除（オーナーチェック: event_idでフィルタリング）
                    const { error: deleteError } = await supabase
                      .from('location_candidates')
                      .delete()
                      .eq('event_id', event.id)

                    if (deleteError) {
                      console.error('Error deleting location candidates:', deleteError)
                    }

                    // 新しい場所の候補を追加
                    if (locationCandidates.length > 0) {
                      console.log(`Adding ${locationCandidates.length} location candidates`)
                      const candidateErrors: string[] = []
                      const successfulCandidates: string[] = []
                      
                      for (const candidate of locationCandidates) {
                        try {
                          let restaurantId = null

                          if (candidate.type === 'restaurant' && candidate.restaurantId) {
                            const restaurantIdToCheck = candidate.restaurantId
                            
                            if (restaurantIdToCheck && !restaurantIdToCheck.startsWith('temp-') && restaurantIdToCheck.length > 20) {
                              // place_idで検索
                              const { data: existingRestaurant } = await supabase
                                .from('restaurants')
                                .select('id')
                                .eq('place_id', restaurantIdToCheck)
                                .maybeSingle()

                              if (existingRestaurant) {
                                restaurantId = existingRestaurant.id
                                console.log(`Found existing restaurant for place_id ${restaurantIdToCheck}: ${restaurantId}`)
                              } else {
                                // 新規作成
                                const { data: newRestaurant, error: restaurantError } = await supabase
                                  .from('restaurants')
                                  .insert({
                                    name: candidate.restaurantName || '',
                                    address: candidate.restaurantAddress || '',
                                    place_id: restaurantIdToCheck,
                                    latitude: userLocation?.lat || event.creator_latitude || 0,
                                    longitude: userLocation?.lng || event.creator_longitude || 0,
                                  })
                                  .select()
                                  .single()

                                if (restaurantError) {
                                  console.error('Error creating restaurant:', restaurantError)
                                  candidateErrors.push(`${candidate.name}のレストラン情報の保存に失敗しました`)
                                } else if (newRestaurant) {
                                  restaurantId = newRestaurant.id
                                  console.log(`Created new restaurant for place_id ${restaurantIdToCheck}: ${restaurantId}`)
                                }
                              }
                            } else if (restaurantIdToCheck && restaurantIdToCheck.includes('-') && restaurantIdToCheck.length === 36) {
                              // UUID形式のレストランID
                              restaurantId = restaurantIdToCheck
                              console.log(`Using existing restaurant UUID: ${restaurantId}`)
                            } else if (restaurantIdToCheck && restaurantIdToCheck.startsWith('temp-restaurant-')) {
                              // 一時的なIDの場合は新規作成
                              const { data: newRestaurant, error: restaurantError } = await supabase
                                .from('restaurants')
                                .insert({
                                  name: candidate.restaurantName || '',
                                  address: candidate.restaurantAddress || '',
                                  place_id: null,
                                  latitude: userLocation?.lat || event.creator_latitude || 0,
                                  longitude: userLocation?.lng || event.creator_longitude || 0,
                                })
                                .select()
                                .single()

                              if (restaurantError) {
                                console.error('Error creating restaurant:', restaurantError)
                                candidateErrors.push(`${candidate.name}のレストラン情報の保存に失敗しました`)
                              } else if (newRestaurant) {
                                restaurantId = newRestaurant.id
                                console.log(`Created new restaurant for temp ID: ${restaurantId}`)
                              }
                            }
                          }

                          // 候補名をサニタイズ
                          const sanitizedCandidateName = validateAndSanitizeName(candidate.name, 100)
                          if (!sanitizedCandidateName) {
                            candidateErrors.push(`${candidate.name}の名前が無効です`)
                            continue
                          }

                          const { data: insertedCandidate, error: candidateError } = await supabase
                            .from('location_candidates')
                            .insert({
                              event_id: event.id,
                              name: sanitizedCandidateName,
                              type: candidate.type,
                              restaurant_id: restaurantId,
                              restaurant_name: candidate.restaurantName ? sanitizeString(candidate.restaurantName, 200) : null,
                              restaurant_address: candidate.restaurantAddress ? sanitizeString(candidate.restaurantAddress, 300) : null,
                            })
                            .select()
                            .single()

                          if (candidateError) {
                            console.error('Error creating location candidate:', candidateError, candidate)
                            candidateErrors.push(`${candidate.name}の追加に失敗しました`)
                          } else if (insertedCandidate) {
                            successfulCandidates.push(candidate.name)
                            console.log(`Successfully added candidate: ${candidate.name}`, insertedCandidate)
                          }
                        } catch (err) {
                          console.error('Error processing candidate:', err, candidate)
                          candidateErrors.push(`${candidate.name}の処理中にエラーが発生しました`)
                        }
                      }
                      
                      if (candidateErrors.length > 0) {
                        console.warn('Some candidates failed to add:', candidateErrors)
                        alert(`一部の候補の追加に失敗しました: ${candidateErrors.join(', ')}`)
                      }
                      
                      if (successfulCandidates.length > 0) {
                        console.log(`Successfully added ${successfulCandidates.length} candidates:`, successfulCandidates)
                      }
                    } else {
                      console.log('No location candidates to add')
                    }

                    setIsEditingEvent(false)
                    setShowOwnerCheck(false)
                    setVerifiedOwnerEmail('') // 編集完了後、認証情報をクリア
                    
                    // ページを強制的にリロードして最新のデータを取得
                    window.location.reload()
                  } catch (error: any) {
                    console.error('Error updating event:', error)
                    alert('予定の更新に失敗しました: ' + getJapaneseErrorMessage(error))
                  } finally {
                    setUpdatingEvent(false)
                  }
                }}
                disabled={updatingEvent}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] touch-manipulation shadow-sm"
              >
                {updatingEvent ? '更新中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingEvent(false)
                  setShowOwnerCheck(false)
                  setVerifiedOwnerEmail('') // キャンセル時も認証情報をクリア
                  setOwnerCheckError(null)
                  setEditTitle(event.title || '')
                  setEditStartTime(getTimeString(event.start_time))
                  setEditEndTime(getTimeString(event.end_time))
                  setEditDescription(event.description || '')
                  setNewDate(getDateString(event.date))
                  setAutoDailyUpdate(event.auto_daily_update || false)
                  // 場所の候補もリセット
                  if (Array.isArray(event.location_candidates)) {
                    const candidates: LocationCandidate[] = event.location_candidates.map((lc) => ({
                      id: lc.id,
                      name: lc.name,
                      type: lc.type,
                      restaurantId: lc.restaurant_id || null,
                      restaurantName: lc.restaurant_name || null,
                      restaurantAddress: lc.restaurant_address || null,
                    }))
                    setLocationCandidates(candidates)
                    const restaurantIds = new Set<string>()
                    candidates.forEach((c) => {
                      if (c.restaurantId) {
                        restaurantIds.add(c.restaurantId)
                      }
                    })
                    setAddedRestaurantIds(restaurantIds)
                  }
                  setNewCandidateText('')
                }}
                disabled={updatingEvent}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] touch-manipulation"
              >
                キャンセル
              </button>
            </div>
          )}

          {/* オーナーチェックモーダル */}
          {showOwnerCheck && !isEditingEvent && (
            <div className="pt-4 border-t border-gray-200 mt-4 space-y-3 sm:space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
                  <i className="ri-shield-user-line text-orange-600 mr-2"></i>
                  予定編集の認証
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4 leading-relaxed">
                  予定を編集するには、作成時に使用したメールアドレスが必要です。
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm sm:text-base font-bold text-gray-900 mb-2">
                      作成者のメールアドレス
                    </label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => {
                        setOwnerEmail(e.target.value)
                        setOwnerCheckError(null)
                      }}
                      autoComplete="off"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleOwnerCheck()
                        }
                      }}
                      placeholder="作成時に使用したメールアドレス"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[44px] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-bold text-gray-900 mb-2">
                      パスワード
                    </label>
                    <input
                      type="password"
                      value={ownerPassword}
                      onChange={(e) => {
                        setOwnerPassword(e.target.value)
                        setOwnerCheckError(null)
                      }}
                      autoComplete="new-password"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleOwnerCheck()
                        }
                      }}
                      placeholder="作成時に設定したパスワード"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[44px] bg-white"
                    />
                    {ownerCheckError && (
                      <p className="mt-2 text-xs sm:text-sm text-red-600 font-medium">{ownerCheckError}</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleOwnerCheck}
                      className="flex-1 px-4 sm:px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold shadow-md min-h-[48px] touch-manipulation text-sm sm:text-base"
                    >
                      確認
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOwnerCheck(false)
                        setOwnerEmail('')
                        setOwnerCheckError(null)
                      }}
                      className="flex-1 px-4 sm:px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold border-2 border-gray-300 min-h-[48px] touch-manipulation text-sm sm:text-base"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 参加状況 */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-6 sm:p-8 md:p-10 mb-5">
          {/* セクションタイトル */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                <i className="ri-user-line text-white text-xl"></i>
              </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">参加状況</h2>
            </div>
            {goingParticipants.length > 0 && (
              <span className="px-4 py-2 bg-orange-600 text-white rounded-full font-semibold text-sm shadow-sm">
                参加 {goingParticipants.length}人
              </span>
            )}
          </div>

          {/* 参加者リスト */}
          {goingParticipants.length > 0 && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">参加者一覧</p>
              <div className="flex flex-wrap gap-2">
                {goingParticipants.map((p) => (
                  <span
                    key={p.id}
                    className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-sm font-medium"
                  >
                    {p.profiles?.name || p.name || '匿名'}
              </span>
                ))}
            </div>
          </div>
          )}

          {/* 参加フォーム */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                あなたの名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                autoComplete="off"
                placeholder="例: 田中"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && participantName.trim()) {
                    e.preventDefault()
                    handleStatusChange()
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white font-medium min-h-[48px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                パスワード <span className="text-xs text-gray-500 font-normal">（任意）</span>
              </label>
              <input
                type="password"
                value={participantPassword}
                onChange={(e) => setParticipantPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="例: 4文字以上推奨"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && participantName.trim()) {
                    e.preventDefault()
                    handleStatusChange()
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white font-medium min-h-[48px]"
              />
              <p className="mt-1 text-xs text-gray-500">同じ名前の人がいる場合に識別するために使用します</p>
            </div>
            <div className="pt-2">
              {participant?.status === 'going' ? (
            <button
                  onClick={handleDeleteParticipant}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-bold text-base hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-xl"></i>
                      <span>処理中...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-close-line text-xl"></i>
                      <span>参加を取り消す</span>
                    </>
                  )}
            </button>
              ) : (
            <button
                  onClick={handleStatusChange}
                  disabled={loading || !participantName.trim()}
                  className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-bold text-base hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-xl"></i>
                      <span>処理中...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-user-add-line text-xl"></i>
                      <span>参加する</span>
                    </>
                  )}
            </button>
              )}
                </div>
          </div>
        </div>

        {/* お店の候補投票 */}
        {Array.isArray(event.location_candidates) && event.location_candidates.length > 0 && (
          <LocationVoting
            eventId={event.id}
            candidates={event.location_candidates}
            currentParticipantName={participantName}
            currentParticipantPassword={participantPassword}
            currentParticipantPasswordHash={participant?.password_hash || null}
            isParticipant={participant?.status === 'going'}
            votes={Array.isArray(event.location_votes) ? event.location_votes : []}
            allParticipants={eventParticipants.map((p) => ({
              name: p.name,
              password_hash: p.password_hash,
            }))}
          />
        )}

        {/* レストラン投票（旧機能） */}
        {event.location_type === 'restaurant' && event.creator_latitude && event.creator_longitude && (!Array.isArray(event.location_candidates) || event.location_candidates.length === 0) && (
          <RestaurantVoting
            eventId={event.id}
            eventLocation={{
              lat: event.creator_latitude,
              lng: event.creator_longitude,
            }}
            currentParticipantName={participantName}
            currentParticipantEmail={''}
            votes={Array.isArray(event.restaurant_votes) ? event.restaurant_votes : []}
          />
        )}
        </div>
      </main>

      {/* 成功モーダル */}
      {showSuccessModal && successMessage && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setShowSuccessModal(false)
            setSuccessMessage(null)
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-checkbox-circle-line text-green-600 text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{successMessage}</h3>
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  setSuccessMessage(null)
                }}
                className="mt-6 w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-base"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

