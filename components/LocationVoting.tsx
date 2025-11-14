'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hashPassword, verifyPassword } from '@/lib/password'
import { validateAndSanitizeName, validatePassword } from '@/lib/security'

// エラーメッセージを日本語に変換する関数
function getJapaneseErrorMessage(error: any): string {
  if (!error) return 'エラーが発生しました'
  
  // エラーコードに基づく日本語メッセージ
  if (error.code === '23505') {
    return 'このメールアドレスは既に投票済みです'
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
  
  return '投票に失敗しました。しばらく時間をおいて再度お試しください'
}

interface LocationCandidate {
  id: string
  name: string
  type: 'text' | 'restaurant'
  restaurant_id: string | null
  restaurant_name: string | null
  restaurant_address: string | null
  restaurant_place_id?: string | null // Google Places APIのplace_id
  vote_count?: number
}

interface LocationVote {
  id: string
  candidate_id: string
  name: string | null
  password_hash?: string | null // パスワードハッシュ（オプショナル）
}

interface LocationVotingProps {
  eventId: string
  candidates: LocationCandidate[]
  currentParticipantName: string
  currentParticipantPassword?: string // 現在入力中のパスワード（平文）
  currentParticipantPasswordHash?: string | null // 既存のパスワードハッシュ
  votes: LocationVote[]
  allParticipants?: Array<{
    name: string | null
    password_hash?: string | null
    status?: string | null
  }>
  isParticipant?: boolean // 参加しているかどうか
}

export default function LocationVoting({
  eventId,
  candidates: initialCandidates,
  currentParticipantName,
  currentParticipantPassword,
  currentParticipantPasswordHash,
  votes: initialVotes,
  allParticipants = [],
  isParticipant = false,
}: LocationVotingProps) {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<LocationCandidate[]>(Array.isArray(initialCandidates) ? initialCandidates : [])
  const [votes, setVotes] = useState<LocationVote[]>(Array.isArray(initialVotes) ? initialVotes : [])
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restaurantWebsites, setRestaurantWebsites] = useState<Record<string, string>>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // initialVotesが変更されたときにvotesを更新
  useEffect(() => {
    if (Array.isArray(initialVotes)) {
      setVotes(initialVotes)
    }
  }, [initialVotes])

  // initialCandidatesが変更されたときにcandidatesを更新
  useEffect(() => {
    if (Array.isArray(initialCandidates)) {
      setCandidates(initialCandidates)
    }
  }, [initialCandidates])

  useEffect(() => {
    if (currentParticipantName.trim()) {
      const safeVotesArray = Array.isArray(votes) ? votes : []
      const userVote = safeVotesArray.find((v) => {
        if (!v || !v.name || v.name.trim().toLowerCase() !== currentParticipantName.trim().toLowerCase()) {
          return false
        }
        // パスワードハッシュも一致するか確認
        const votePasswordHash = v.password_hash || null
        const currentHash = currentParticipantPasswordHash || null
        return votePasswordHash === currentHash
      })
      if (userVote && userVote.candidate_id) {
        setSelectedCandidateId(userVote.candidate_id)
      } else {
        setSelectedCandidateId(null)
      }
    } else {
      setSelectedCandidateId(null)
    }
  }, [currentParticipantName, currentParticipantPasswordHash, votes])

  useEffect(() => {
    const safeVotesArray = Array.isArray(votes) ? votes : []
    const voteCounts = safeVotesArray.reduce((acc, vote) => {
      if (vote && vote.candidate_id) {
        acc[vote.candidate_id] = (acc[vote.candidate_id] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    setCandidates((prev) =>
      prev.map((candidate) => ({
        ...candidate,
        vote_count: voteCounts[candidate.id] || 0,
      }))
    )
  }, [votes])

  const handleVote = async (candidateId: string) => {
    // 参加しているかチェック
    if (!isParticipant) {
      setError('投票するには、まず「参加する」ボタンで参加してください')
      return
    }

    // 名前のバリデーションとサニタイズ
    const sanitizedName = validateAndSanitizeName(currentParticipantName, 50)
    if (!sanitizedName) {
      setError('名前を正しく入力してください（50文字以内）')
      return
    }

    // パスワードのバリデーション（入力されている場合）
    if (currentParticipantPassword && currentParticipantPassword.trim()) {
      const passwordValidation = validatePassword(currentParticipantPassword)
      if (!passwordValidation.valid) {
        setError(passwordValidation.error || 'パスワードを正しく入力してください')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      // パスワードが入力されている場合はハッシュ化
      let passwordHash: string | null = null
      if (currentParticipantPassword && currentParticipantPassword.trim()) {
        passwordHash = await hashPassword(currentParticipantPassword.trim())
      } else if (currentParticipantPasswordHash) {
        passwordHash = currentParticipantPasswordHash
      }
      
      // データベースから既存投票を確認（名前とパスワードハッシュで検索）
      let voteQuery = supabase
        .from('location_votes')
        .select('*')
        .eq('event_id', eventId)
        .eq('name', sanitizedName)
      
      if (passwordHash) {
        voteQuery = voteQuery.eq('password_hash', passwordHash)
      } else {
        voteQuery = voteQuery.is('password_hash', null)
      }
      
      const { data: dbVote, error: fetchError } = await voteQuery.maybeSingle()

      if (fetchError) {
        throw fetchError
      }

      if (dbVote) {
        // 既存の投票が存在する場合
        if (dbVote.candidate_id === candidateId) {
          // 同じ候補に投票している場合は削除
          const { error: deleteError } = await supabase
            .from('location_votes')
            .delete()
            .eq('id', dbVote.id)

          if (deleteError) {
            throw deleteError
          }
        setSelectedCandidateId(null)
        setToastMessage('投票を解除しました')
        } else {
          // 別の候補に変更
          const { error: updateError } = await supabase
            .from('location_votes')
            .update({
              candidate_id: candidateId,
            })
            .eq('id', dbVote.id)

          if (updateError) {
            throw updateError
          }
          setSelectedCandidateId(candidateId)
          setToastMessage('投票を変更しました')
        }
      } else {
        // 既存の投票が存在しない場合、新規作成（名前とパスワードハッシュ）
        const { data: newVote, error: insertError } = await supabase
          .from('location_votes')
          .insert({
            event_id: eventId,
            candidate_id: candidateId,
            name: sanitizedName,
            password_hash: passwordHash,
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }
        if (!newVote) {
          throw new Error('投票の作成に失敗しました')
        }
        setSelectedCandidateId(candidateId)
        setToastMessage('投票完了しました')
      }
      
      // 投票後に最新の投票データを取得して状態を更新
      const { data: updatedVotes, error: votesError } = await supabase
        .from('location_votes')
        .select('*')
        .eq('event_id', eventId)
      
      if (votesError) {
        throw votesError
      }
      
      if (updatedVotes) {
        setVotes(updatedVotes as LocationVote[])
      }
      
    } catch (error: any) {
      console.error('投票エラー:', error)
      setError(getJapaneseErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // トーストメッセージは数秒後に自動で閉じる
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 2500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  if (candidates.length === 0) {
    return null
  }

  // レストランのWebサイトを取得する関数
  const fetchRestaurantWebsite = async (restaurantId: string): Promise<string | null> => {
    if (!restaurantId || typeof window === 'undefined' || !(window as any).google?.maps?.places) {
      return null
    }

    // 既に取得済みの場合はキャッシュから返す
    if (restaurantWebsites[restaurantId]) {
      return restaurantWebsites[restaurantId]
    }

    try {
      // restaurant_idからplace_idを取得
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('place_id')
        .eq('id', restaurantId)
        .single()

      // place_idが存在し、有効な形式かチェック
      const placeId = restaurant?.place_id
      if (!placeId || typeof placeId !== 'string' || placeId.trim() === '') {
        return null
      }

      // Google Places APIのplace_idは通常27文字以上の文字列
      // 無効な形式の場合はスキップ
      if (placeId.length < 10) {
        return null
      }

      const service = new (window as any).google.maps.places.PlacesService(document.createElement('div'))
      return new Promise((resolve) => {
        service.getDetails(
          {
            placeId: placeId.trim(),
            fields: ['website'],
          },
          (placeDetails: any, status: string) => {
            if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && placeDetails?.website) {
              const website = placeDetails.website
              setRestaurantWebsites((prev) => ({ ...prev, [restaurantId]: website }))
              resolve(website)
            } else {
              // エラーの場合はnullを返す（ログは出さない）
              resolve(null)
            }
          }
        )
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching restaurant website:', error)
      }
      return null
    }
  }

  // お店名クリックでGoogleマップを開く
  const handleRestaurantNameClick = (candidate: LocationCandidate) => {
    // Google PlaceのIDがある場合はGoogle Mapsで開く
    const placeId = candidate.restaurant_id
    if (placeId) {
      // Google Maps URLを直接開く（WebサイトAPIの非同期処理を避ける）
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(candidate.name)}&query_place_id=${placeId}`
      window.open(mapsUrl, '_blank', 'noopener,noreferrer')
    } else if (candidate.restaurant_address) {
      // place_idがない場合は住所で検索
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(candidate.name + ' ' + candidate.restaurant_address)}`
      window.open(mapsUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const sortedCandidates = [...candidates].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-6 sm:p-8 md:p-10">
      {/* セクションタイトル（左上） */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
          <i className="ri-restaurant-line text-white text-xl"></i>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">お店の候補</h2>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 text-sm font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <i className="ri-error-warning-line text-lg"></i>
            {error}
          </div>
        </div>
      )}

      {/* トーストメッセージ */}
      {toastMessage && (
        <div className="fixed bottom-4 inset-x-0 flex justify-center z-50 px-4">
          <div className="bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-full shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="space-y-4">
          {sortedCandidates.map((candidate) => {
            const voteCount = candidate.vote_count || 0
            const isSelected = selectedCandidateId === candidate.id
            const hasWebsite = candidate.restaurant_id && restaurantWebsites[candidate.restaurant_id]
            const isRestaurant = candidate.type === 'restaurant' && candidate.restaurant_id

            return (
              <div
                key={candidate.id}
                className={`border-2 rounded-xl p-5 ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* お店情報エリア（左上） */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    {isRestaurant ? (
                      <button
                        onClick={() => handleRestaurantNameClick(candidate)}
                        className="group text-left w-full"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600">
                            {candidate.name}
                          </h3>
                          <i className="ri-external-link-line text-orange-600 text-base"></i>
                        </div>
                        {candidate.restaurant_address && (
                          <p className="text-sm text-gray-600 mt-1">{candidate.restaurant_address}</p>
                        )}
                      </button>
                    ) : (
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{candidate.name}</h3>
                        {candidate.restaurant_address && (
                          <p className="text-sm text-gray-600 mt-1">{candidate.restaurant_address}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 投票数と投票ボタンエリア（右下） */}
                  <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto">
                    <div className="text-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 w-[70px] flex-shrink-0">
                      <div className="text-xs text-gray-500 mb-1 font-medium w-full">投票数</div>
                      <div className="text-xl font-bold text-gray-900 tabular-nums w-full h-[28px] flex items-center justify-center">
                        {voteCount}
                      </div>
                    </div>
                    <button
                      onClick={() => handleVote(candidate.id)}
                      disabled={loading || !currentParticipantName.trim() || !isParticipant}
                      className={`px-6 py-3 rounded-xl font-bold text-base shadow-lg flex-1 sm:flex-none min-w-[120px] ${
                        isSelected
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-orange-600`}
                      title={!isParticipant ? '投票するには、まず「参加する」ボタンで参加してください' : ''}
                    >
                      {isSelected ? (
                        <span className="flex items-center gap-2 justify-center">
                          <i className="ri-check-line text-lg"></i>
                          <span>投票済み</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 justify-center">
                          <i className="ri-hand-coin-line text-lg"></i>
                          <span>投票する</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* 説明文（右下） */}
          <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 leading-relaxed flex items-start gap-2">
              <i className="ri-information-line text-blue-600 text-base flex-shrink-0 mt-0.5"></i>
              <span>
                <strong>お店名</strong>をクリックするとWebサイトが開きます。<strong>「投票する」ボタン</strong>で投票できます。
              </span>
            </p>
          </div>
        </div>
    </div>
  )
}
