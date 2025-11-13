'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Restaurant {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  place_id?: string | null
  rating?: number | null
  price_level?: number | null
}

interface RestaurantVote {
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
}

interface RestaurantVotingProps {
  eventId: string
  eventLocation: { lat: number; lng: number } | null
  currentParticipantName: string
  currentParticipantEmail: string
  votes: RestaurantVote[]
}

export default function RestaurantVoting({
  eventId,
  eventLocation,
  currentParticipantName,
  currentParticipantEmail,
  votes,
}: RestaurantVotingProps) {
  const supabase = createClient()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [userVotes, setUserVotes] = useState<RestaurantVote[]>(votes || [])

  // 近隣のお店を検索
  useEffect(() => {
    if (eventLocation && typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      const searchNearby = async () => {
        setLoading(true)
        try {
          const div = document.createElement('div')
          const service = new (window as any).google.maps.places.PlacesService(div)
          
          service.nearbySearch(
            {
              location: new (window as any).google.maps.LatLng(eventLocation.lat, eventLocation.lng),
              radius: 2000, // 2km以内
              type: 'restaurant',
            },
            async (results: any[], status: string) => {
              if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results) {
                const restaurantList = results.slice(0, 20).map((place) => ({
                  id: place.place_id || `temp-${Date.now()}-${Math.random()}`,
                  name: place.name,
                  address: place.formatted_address || place.vicinity || '',
                  latitude: place.geometry?.location?.lat() || 0,
                  longitude: place.geometry?.location?.lng() || 0,
                  place_id: place.place_id || null,
                  rating: place.rating || null,
                  price_level: place.price_level || null,
                }))

                // データベースに保存
                const updatedList = await Promise.all(
                  restaurantList.map(async (restaurant) => {
                    if (!restaurant.place_id) return restaurant

                    try {
                      const { data: existing } = await supabase
                        .from('restaurants')
                        .select('id')
                        .eq('place_id', restaurant.place_id)
                        .single()

                      if (existing) {
                        return { ...restaurant, id: existing.id }
                      }

                      const { data: saved } = await supabase
                        .from('restaurants')
                        .upsert(
                          {
                            name: restaurant.name,
                            address: restaurant.address,
                            latitude: restaurant.latitude,
                            longitude: restaurant.longitude,
                            place_id: restaurant.place_id,
                            rating: restaurant.rating,
                            price_level: restaurant.price_level,
                          },
                          { onConflict: 'place_id' }
                        )
                        .select()
                        .single()

                      if (saved) {
                        return { ...restaurant, id: saved.id }
                      }
                    } catch (error) {
                      console.error('Error saving restaurant:', error)
                    }

                    return restaurant
                  })
                )

                setRestaurants(updatedList)
              }
              setLoading(false)
            }
          )
        } catch (error) {
          console.error('Error searching restaurants:', error)
          setLoading(false)
        }
      }

      searchNearby()
    }
  }, [eventLocation])

  const handleVote = async (restaurantId: string) => {
    if (!currentParticipantName.trim() || !currentParticipantEmail.trim()) {
      return
    }

    setLoading(true)
    try {
      // 既存の投票を確認
      const existingVote = userVotes.find(
        (v) =>
          v.restaurant_id === restaurantId &&
          v.email === currentParticipantEmail.trim()
      )

      if (existingVote) {
        // 投票を削除
        const { error } = await supabase
          .from('restaurant_votes')
          .delete()
          .eq('id', existingVote.id)

        if (error) throw error
        setUserVotes(userVotes.filter((v) => v.id !== existingVote.id))
      } else {
        // 新しい投票を追加
        const voteData: any = {
          event_id: eventId,
          restaurant_id: restaurantId,
          name: currentParticipantName.trim(),
          email: currentParticipantEmail.trim(),
        }

        const { data, error } = await supabase
          .from('restaurant_votes')
          .insert(voteData)
          .select(`
            *,
            restaurants (
              id,
              name,
              address,
              rating,
              price_level
            )
          `)
          .single()

        if (error) throw error
        setUserVotes([...userVotes, data as any])
      }

      // ページをリフレッシュして投票結果を更新
      window.location.reload()
    } catch (error) {
      console.error('Error voting for restaurant:', error)
    } finally {
      setLoading(false)
    }
  }

  // レストランごとの投票数を計算
  const getVoteCount = (restaurantId: string) => {
    return userVotes.filter((v) => v.restaurant_id === restaurantId).length
  }

  // ユーザーが投票したレストランかどうか
  const hasUserVoted = (restaurantId: string) => {
    return userVotes.some(
      (v) =>
        v.restaurant_id === restaurantId &&
        v.email === currentParticipantEmail.trim()
    )
  }

  // 投票数でソート
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    const votesA = getVoteCount(a.id)
    const votesB = getVoteCount(b.id)
    return votesB - votesA
  })

  if (!eventLocation) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-5">どこ行く？</h2>
      
      {loading && restaurants.length === 0 ? (
        <p className="text-sm text-gray-500">近くのお店を検索中...</p>
      ) : restaurants.length === 0 ? (
        <p className="text-sm text-gray-500">近くにお店が見つかりませんでした</p>
      ) : (
        <div className="space-y-3">
          {sortedRestaurants.map((restaurant) => {
            const voteCount = getVoteCount(restaurant.id)
            const voted = hasUserVoted(restaurant.id)

            return (
              <div
                key={restaurant.id}
                className={`p-4 border-2 rounded-lg transition-all ${
                  voted
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{restaurant.name}</h3>
                      {voteCount > 0 && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                          {voteCount}票
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{restaurant.address}</p>
                    {restaurant.rating && (
                      <p className="text-xs text-gray-500">
                        評価: {restaurant.rating.toFixed(1)}
                        {restaurant.price_level !== null &&
                          restaurant.price_level !== undefined &&
                          ' • ' + '¥'.repeat(restaurant.price_level + 1)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleVote(restaurant.id)}
                    disabled={loading || !currentParticipantName.trim() || !currentParticipantEmail.trim()}
                    className={`ml-4 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                      voted
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {voted ? '✓' : '選ぶ'}
                  </button>
                </div>
                {voteCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      投票者: {userVotes
                        .filter((v) => v.restaurant_id === restaurant.id)
                        .map((v) => v.name || v.email?.split('@')[0] || '匿名')
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

