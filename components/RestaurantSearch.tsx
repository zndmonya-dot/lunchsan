'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Review {
  author_name: string
  rating: number
  text: string
  time: number
  relative_time_description: string
}

interface Restaurant {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  place_id?: string | null
  rating?: number | null
  price_level?: number | null
  user_ratings_total?: number | null
  editorialSummary?: string | null
  description?: string | null
  phone_number?: string | null
  website?: string | null
  reviews?: Review[] | null
  opening_hours?: {
    periods?: Array<{
      open: { day: number; time: string }
      close?: { day: number; time: string }
    }>
    weekday_text?: string[]
  } | null
}

interface RestaurantSearchProps {
  onSelect: (restaurant: Restaurant) => void
  selectedRestaurant: Restaurant | null
  userLocation?: { lat: number; lng: number } | null
  startTime?: string // HH:MM format
  endTime?: string // HH:MM format
  eventDate?: string // YYYY-MM-DD format (for checking opening hours on that day)
  addedRestaurantIds?: Set<string> // 既に追加されたお店のIDリスト
}

export default function RestaurantSearch({ onSelect, selectedRestaurant, userLocation: propUserLocation, startTime, endTime, eventDate, addedRestaurantIds = new Set() }: RestaurantSearchProps) {
  const [query, setQuery] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(propUserLocation || null)
  const [showResults, setShowResults] = useState(false)
  const [selectedRestaurantForDetail, setSelectedRestaurantForDetail] = useState<Restaurant | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // モーダルが開いているときに背景のスクロールを無効化
  useEffect(() => {
    if (selectedRestaurantForDetail) {
      // モーダルが開いているときは背景のスクロールを無効化
      document.body.style.overflow = 'hidden'
    } else {
      // モーダルが閉じているときはスクロールを有効化
      document.body.style.overflow = ''
    }
    // クリーンアップ関数
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedRestaurantForDetail])

  // 営業時間のチェック関数
  const isOpenDuringTime = (restaurant: Restaurant, startTimeStr?: string, endTimeStr?: string, eventDateStr?: string): boolean => {
    if (!startTimeStr || !endTimeStr) {
      return true // 時間が指定されていない場合は全て表示
    }

    // opening_hoursがない場合は表示（情報が不十分な場合は表示）
    if (!restaurant.opening_hours || !restaurant.opening_hours.periods) {
      return true
    }

    // 開始時間と終了時間を分に変換
    const [startHour, startMin] = startTimeStr.split(':').map(Number)
    const [endHour, endMin] = endTimeStr.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    // イベントの日付の曜日を取得（0=日曜日, 6=土曜日）
    const targetDate = eventDateStr ? new Date(eventDateStr + 'T00:00:00') : new Date()
    const dayOfWeek = targetDate.getDay()

    // 営業時間の期間をチェック
    const periods = restaurant.opening_hours.periods
    for (const period of periods) {
      if (period.open.day === dayOfWeek) {
        // Google Places APIの時間フォーマットは "HHMM" 形式（例: "1200", "1330"）
        const openTimeStr = String(period.open.time).padStart(4, '0')
        const openHour = parseInt(openTimeStr.slice(0, 2), 10)
        const openMin = parseInt(openTimeStr.slice(2, 4), 10)
        const openMinutes = openHour * 60 + openMin

        if (period.close && period.close.day !== undefined) {
          const closeTimeStr = String(period.close.time).padStart(4, '0')
          const closeHour = parseInt(closeTimeStr.slice(0, 2), 10)
          const closeMin = parseInt(closeTimeStr.slice(2, 4), 10)
          let closeMinutes = closeHour * 60 + closeMin
          let closeDay = period.close.day

          // 日をまたぐ場合を考慮（閉店時間が翌日の場合）
          if (closeDay !== dayOfWeek) {
            // 翌日の場合
            if (closeDay === (dayOfWeek + 1) % 7) {
              closeMinutes += 24 * 60
            }
            // 前日の場合は考慮しない（通常はない）
          } else if (closeMinutes < openMinutes) {
            // 同じ日で閉店時間が開始時間より前の場合は翌日まで
            closeMinutes += 24 * 60
          }

          // イベント時間が営業時間と重複しているかチェック
          // 開始時間が営業時間内、または終了時間が営業時間内、または営業時間がイベント時間に完全に含まれる
          if (
            (startMinutes >= openMinutes && startMinutes < closeMinutes) ||
            (endMinutes > openMinutes && endMinutes <= closeMinutes) ||
            (startMinutes <= openMinutes && endMinutes >= closeMinutes)
          ) {
            return true
          }
        } else {
          // 閉店時間がない場合（24時間営業など）は常に営業中
          return true
        }
      }
    }

    return false
  }

  // 人気順ソート関数（評価×評価数の組み合わせ）
  const sortByPopularity = (restaurants: Restaurant[]): Restaurant[] => {
    return [...restaurants].sort((a, b) => {
      // 評価と評価数の組み合わせでスコアを計算
      const scoreA = (a.rating || 0) * Math.log10((a.user_ratings_total || 0) + 1)
      const scoreB = (b.rating || 0) * Math.log10((b.user_ratings_total || 0) + 1)
      return scoreB - scoreA // 降順
    })
  }

  useEffect(() => {
    // propsから位置情報が渡されている場合はそれを使用
    if (propUserLocation) {
      setUserLocation(propUserLocation)
      return
    }

    // ユーザーの位置情報を取得
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
          // デフォルトの位置（東京駅）を使用
          setUserLocation({ lat: 35.6812, lng: 139.7671 })
        }
      )
    } else {
      // デフォルトの位置（東京駅）を使用
      setUserLocation({ lat: 35.6812, lng: 139.7671 })
    }
  }, [propUserLocation])

  const searchRestaurants = async (searchQuery?: string) => {
    setLoading(true)
    try {
      // Google Places APIが利用可能かチェック
      if (typeof window === 'undefined') {
        console.error('RestaurantSearch: window is undefined')
        setLoading(false)
        return
      }

      const google = (window as any).google
      if (!google || !google.maps || !google.maps.places) {
        console.error('RestaurantSearch: Google Places API is not loaded. Please check your API key and ensure Places API is enabled.')
        console.error('API Key exists:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
        // Google Places APIが利用できない場合、データベースから検索
        if (searchQuery && searchQuery.trim()) {
          const { data: dbData } = await supabase
            .from('restaurants')
            .select('*')
            .or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
            .limit(10)

          if (dbData && dbData.length > 0) {
            setRestaurants(dbData)
          } else {
            setRestaurants([])
          }
        } else {
          setRestaurants([])
        }
        setLoading(false)
        return
      }

      if (!userLocation) {
        console.error('RestaurantSearch: userLocation is not available')
        setLoading(false)
        return
      }

      // Places API (New)を使用
      // JavaScript APIでは、PlacesServiceは従来通り使用できますが、
      // 新しいAPIのフィールド（currentOpeningHoursなど）をサポートしています
      const service = new google.maps.places.PlacesService(document.createElement('div'))
      const location = new google.maps.LatLng(userLocation.lat, userLocation.lng)

      let results: any[] = []

      if (searchQuery && searchQuery.trim()) {
        // テキスト検索（Places API (New)対応）
        const textSearchRequest = {
          query: searchQuery,
          location: location,
          radius: 2000, // 2km
          type: 'restaurant',
        }

        results = await new Promise<any[]>((resolve, reject) => {
          service.textSearch(textSearchRequest, (results: any[], status: string) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              resolve(results || [])
            } else {
              console.error('Text search error:', status)
              resolve([]) // エラーの場合は空配列を返す
            }
          })
        })
      } else {
        // 近隣検索（Places API (New)対応）
        const nearbySearchRequest = {
          location: location,
          radius: 2000, // 2km
          type: 'restaurant',
        }

        results = await new Promise<any[]>((resolve, reject) => {
          service.nearbySearch(nearbySearchRequest, (results: any[], status: string) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              resolve(results || [])
            } else {
              console.error('Nearby search error:', status)
              resolve([]) // エラーの場合は空配列を返す
            }
          })
        })
      }

      if (results && results.length > 0) {
        // まず基本情報だけを表示（高速化のため）
        // 詳細情報（営業時間、レビューなど）は、ユーザーがお店をクリックした時に取得
        const basicRestaurants: Restaurant[] = results.slice(0, 20).map((place) => ({
          id: place.place_id || `temp-${Date.now()}-${Math.random()}`,
          name: place.name,
          address: place.formatted_address || place.vicinity || '',
          latitude: place.geometry?.location?.lat() || 0,
          longitude: place.geometry?.location?.lng() || 0,
          place_id: place.place_id || null,
          rating: place.rating || null,
          price_level: place.price_level !== undefined ? place.price_level : null,
          user_ratings_total: place.user_ratings_total || null,
          editorialSummary: null,
          description: null,
          phone_number: null,
          website: null,
          reviews: null,
          opening_hours: null,
        }))

        // 基本情報をすぐに表示
        setRestaurants(basicRestaurants)
        setShowResults(true)
        setLoading(false)

        // バックグラウンドで詳細情報を取得（営業時間のみ、レビューなどは除く）
        const detailFields = [
          'place_id',
          'opening_hours',
          'current_opening_hours',
        ]

        // 最大10件まで詳細情報を取得（パフォーマンス向上）
        const detailPromises = basicRestaurants.slice(0, 10).map((restaurant) => {
          // place_idが存在し、有効な形式かチェック
          const placeId = restaurant.place_id
          if (!placeId || typeof placeId !== 'string' || placeId.trim() === '' || placeId.length < 10) {
            return Promise.resolve(restaurant)
          }
          
          return new Promise<Restaurant>((resolve) => {
            const detailService = new google.maps.places.PlacesService(document.createElement('div'))
            const detailRequest = {
              placeId: placeId.trim(),
              fields: detailFields,
            }

            detailService.getDetails(detailRequest, (placeDetails: any, detailStatus: string) => {
              if (detailStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                let weekdayText: string[] = []
                let periods: any[] = []

                // 新しいAPIのcurrentOpeningHoursを使用
                if (placeDetails.currentOpeningHours) {
                  weekdayText = placeDetails.currentOpeningHours.weekdayDescriptions || 
                               placeDetails.currentOpeningHours.weekdayText || []
                  periods = placeDetails.currentOpeningHours.periods || []
                } else if (placeDetails.opening_hours) {
                  // 古いAPIの場合、periodsのみを使用（open_nowは非推奨のため使用しない）
                  weekdayText = placeDetails.opening_hours.weekday_text || []
                  periods = placeDetails.opening_hours.periods || []
                }

                // 既存のレストラン情報を更新
                resolve({
                  ...restaurant,
                  opening_hours: (periods.length > 0 || weekdayText.length > 0) ? {
                    periods: periods,
                    weekday_text: weekdayText,
                  } : null,
                })
              } else {
                // 詳細情報が取得できない場合は基本情報のみ
                resolve(restaurant)
              }
            })
          })
        })

        // バックグラウンドで詳細情報を取得して更新
        Promise.all(detailPromises).then((updatedRestaurants) => {
          // 既存のリストを更新
          setRestaurants((prevRestaurants) => {
            const updatedMap = new Map(updatedRestaurants.map(r => [r.place_id || r.id, r]))
            return prevRestaurants.map(r => updatedMap.get(r.place_id || r.id) || r)
          })
        }).catch((error) => {
          // エラーは静かに処理（ユーザーには表示しない）
          if (process.env.NODE_ENV === 'development') {
            console.error('Error updating restaurant details:', error)
          }
        })
      } else {
        // デバッグ用ログは開発環境のみ
        if (process.env.NODE_ENV === 'development') {
          console.log('RestaurantSearch: No restaurants found')
        }
        setRestaurants([])
        setShowResults(false)
      }
    } catch (error) {
      // エラーは静かに処理（ユーザーには表示しない）
      if (process.env.NODE_ENV === 'development') {
        console.error('Error searching restaurants:', error)
      }
      setRestaurants([])
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }

  // デバウンス付き検索
  useEffect(() => {
    // 既存のタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // クエリが空で、かつ結果が表示されていない場合は何もしない
    if (!query.trim() && !showResults) {
      return
    }

    // 300ms後に検索を実行
    debounceTimerRef.current = setTimeout(() => {
      if (query.trim() || showResults) {
        searchRestaurants(query)
      }
    }, 300)

    // クリーンアップ関数
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query]) // queryが変更されたときに実行

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // デバウンスをキャンセルして即座に検索
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setShowResults(true)
    searchRestaurants(query)
  }

  const handleSearchClick = () => {
    // デバウンスをキャンセルして即座に検索
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setShowResults(true)
    searchRestaurants(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearchClick()
    }
  }

  // お店の詳細情報（口コミ含む）を取得
  const fetchRestaurantDetails = async (restaurant: Restaurant) => {
    setIsModalOpen(true)
    
    // place_idが存在し、有効な形式かチェック
    const placeId = restaurant.place_id
    if (!placeId || typeof placeId !== 'string' || placeId.trim() === '' || placeId.length < 10 || typeof window === 'undefined' || !(window as any).google?.maps?.places) {
      setSelectedRestaurantForDetail(restaurant)
      return
    }

    setLoadingDetails(true)
    try {
      const google = (window as any).google
      const detailService = new google.maps.places.PlacesService(document.createElement('div'))
      const detailRequest = {
        placeId: placeId.trim(),
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'rating',
          'price_level',
          'user_ratings_total',
          'opening_hours',
          'current_opening_hours',
          'editorial_summary',
          'reviews',
          'formatted_phone_number',
          'website',
        ],
      }

      detailService.getDetails(detailRequest, (placeDetails: any, detailStatus: string) => {
        if (detailStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
          // 口コミ情報を取得
          const reviews: Review[] = placeDetails.reviews ? placeDetails.reviews.map((review: any) => ({
            author_name: review.author_name || '匿名',
            rating: review.rating || 0,
            text: review.text || '',
            time: review.time || 0,
            relative_time_description: review.relative_time_description || '',
          })) : []

          // 営業時間情報を取得
          let weekdayText: string[] = []
          let periods: any[] = []

          if (placeDetails.currentOpeningHours) {
            weekdayText = placeDetails.currentOpeningHours.weekdayDescriptions || 
                         placeDetails.currentOpeningHours.weekdayText || []
            periods = placeDetails.currentOpeningHours.periods || []
          } else if (placeDetails.opening_hours) {
            // 古いAPIの場合、periodsのみを使用（open_nowは非推奨のため使用しない）
            weekdayText = placeDetails.opening_hours.weekday_text || []
            periods = placeDetails.opening_hours.periods || []
          }

          // 概要情報を取得
          let editorialSummary: string | null = null
          if (placeDetails.editorialSummary) {
            if (typeof placeDetails.editorialSummary === 'string') {
              editorialSummary = placeDetails.editorialSummary
            } else if (placeDetails.editorialSummary?.overview) {
              editorialSummary = placeDetails.editorialSummary.overview
            } else if (placeDetails.editorialSummary?.text) {
              editorialSummary = placeDetails.editorialSummary.text
            }
          }
          if (!editorialSummary && placeDetails.editorial_summary) {
            if (typeof placeDetails.editorial_summary === 'string') {
              editorialSummary = placeDetails.editorial_summary
            } else if (placeDetails.editorial_summary?.overview) {
              editorialSummary = placeDetails.editorial_summary.overview
            } else if (placeDetails.editorial_summary?.text) {
              editorialSummary = placeDetails.editorial_summary.text
            }
          }

          const detailedRestaurant: Restaurant = {
            ...restaurant,
            phone_number: placeDetails.formatted_phone_number || null,
            website: placeDetails.website || null,
            reviews: reviews.length > 0 ? reviews : null,
            editorialSummary: editorialSummary || restaurant.editorialSummary,
            opening_hours: (periods.length > 0 || weekdayText.length > 0) ? {
              periods: periods,
              weekday_text: weekdayText,
            } : null,
          }

          setSelectedRestaurantForDetail(detailedRestaurant)
        } else {
          setSelectedRestaurantForDetail(restaurant)
        }
        setLoadingDetails(false)
      })
    } catch (error) {
      // エラーは静かに処理（ユーザーには表示しない）
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching restaurant details:', error)
      }
      setSelectedRestaurantForDetail(restaurant)
      setLoadingDetails(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg z-10"></i>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={userLocation ? "お店の名前で絞り込み（空白で近くのお店を表示）" : "お店の名前やエリアで検索"}
            className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm min-h-[48px] bg-white font-medium"
          />
        </div>
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={loading}
          className="px-5 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg h-[48px] min-w-[90px] touch-manipulation transition-all flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>検索中</span>
            </>
          ) : (
            <>
              <i className="ri-search-line text-base"></i>
              <span>探す</span>
            </>
          )}
        </button>
      </div>
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium text-gray-600">お店を検索中...</p>
        </div>
      )}

      {selectedRestaurant && (
        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
          <p className="text-sm font-bold text-orange-900 mb-1">選んだお店:</p>
          <p className="text-base font-medium text-orange-800">{selectedRestaurant.name}</p>
          <p className="text-sm text-orange-700">{selectedRestaurant.address}</p>
        </div>
      )}

      {showResults && restaurants.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-sm">
              <i className="ri-restaurant-line text-white text-xl"></i>
            </div>
            <p className="text-base font-bold text-gray-900">
              {startTime && endTime ? (
                <>
                  <span className="text-orange-600">{startTime}〜{endTime}</span>
                  <span className="text-gray-700">の営業時間内のお店（人気順）</span>
                </>
              ) : (
                '検索結果（人気順）'
              )}
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-4">
            {restaurants.map((restaurant) => {
              const restaurantId = restaurant.place_id || restaurant.id
              const isAdded = addedRestaurantIds.has(restaurantId)
              
              return (
                <div key={restaurant.id}>
                  <button
                    type="button"
                    onClick={() => fetchRestaurantDetails(restaurant)}
                    className={`group w-full text-left p-5 border-2 rounded-xl transition-all duration-200 ${
                      isAdded
                        ? 'border-green-400 bg-green-50 hover:bg-green-100 shadow-md'
                        : selectedRestaurant?.id === restaurant.id
                        ? 'border-orange-400 bg-orange-50 shadow-md'
                        : 'border-orange-200 bg-white hover:bg-orange-50 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                            <i className="ri-restaurant-line text-white text-base"></i>
                          </div>
                          <p className="font-bold text-gray-900 text-base">{restaurant.name}</p>
                          {isAdded && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg border border-green-300 shadow-sm">
                              <i className="ri-check-line text-sm"></i>
                              追加済み
                            </span>
                          )}
                        </div>
                        <div className="flex items-start gap-2.5 mb-3">
                          <i className="ri-map-pin-line text-orange-600 text-base mt-0.5 flex-shrink-0"></i>
                          <p className="text-sm text-gray-600 leading-loose">{restaurant.address}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap mt-4">
                          {restaurant.rating && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200 shadow-sm">
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="font-bold">{restaurant.rating.toFixed(1)}</span>
                              {restaurant.user_ratings_total && (
                                <span className="text-gray-600">({restaurant.user_ratings_total.toLocaleString()}件)</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <i className="ri-arrow-right-s-line text-orange-600 text-xl"></i>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showResults && !loading && restaurants.length === 0 && (
        <p className="text-sm text-gray-500">
          {startTime && endTime
            ? `${startTime}〜${endTime}の営業時間内のお店が見つかりませんでした。`
            : 'お店が見つかりませんでした。'}
        </p>
      )}

      {!userLocation && !loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 border-[3px] border-orange-200 border-t-orange-600 rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-gray-600">位置情報を取得中...</p>
        </div>
      )}

      {/* お店の詳細ダイアログ */}
      {selectedRestaurantForDetail && (
        <>
          {/* オーバーレイ（背景） */}
          <div
            className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
              isModalOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => {
              setIsModalOpen(false)
              setTimeout(() => setSelectedRestaurantForDetail(null), 300)
            }}
          />
          {/* ダイアログ */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transition-all duration-300 ${
                isModalOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 md:p-6">
                {/* ヘッダー */}
                <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-gray-200">
                  <div className="flex-1 min-w-0">
                    {loadingDetails ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">詳細情報を読み込み中...</span>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1.5 leading-tight">
                          {selectedRestaurantForDetail.name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 break-words leading-relaxed">{selectedRestaurantForDetail.address}</p>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
              setIsModalOpen(false)
              setTimeout(() => setSelectedRestaurantForDetail(null), 300)
            }}
                    className="hover-button p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex-shrink-0 transition-colors"
                    aria-label="閉じる"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>

                {/* 詳細情報 */}
                <div className="space-y-4">
                  {/* 評価と営業状況 */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {selectedRestaurantForDetail.rating && (
                      <div className="flex items-center gap-1.5">
                        <i className="ri-star-fill text-yellow-500 text-base"></i>
                        <span className="text-sm font-semibold text-gray-900">
                          {selectedRestaurantForDetail.rating.toFixed(1)}
                        </span>
                        {selectedRestaurantForDetail.user_ratings_total && (
                          <span className="text-xs text-gray-600">
                            ({selectedRestaurantForDetail.user_ratings_total.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}
                    
                  </div>

                  {/* お店の概要 */}
                  {selectedRestaurantForDetail.editorialSummary && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <i className="ri-information-line text-orange-600 text-sm"></i>
                        概要
                      </h4>
                      <p className="text-xs text-gray-700 leading-relaxed bg-orange-50/50 rounded-lg p-3 border border-orange-100">
                        {selectedRestaurantForDetail.editorialSummary}
                      </p>
                    </div>
                  )}

                  {/* 営業時間 */}
                  {selectedRestaurantForDetail.opening_hours?.weekday_text &&
                    selectedRestaurantForDetail.opening_hours.weekday_text.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                          <i className="ri-time-line text-orange-600 text-sm"></i>
                          営業時間
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {selectedRestaurantForDetail.opening_hours.weekday_text.map((hours, idx) => {
                            // 営業時間のテキストをパースして見やすく表示
                            const isToday = hours.includes('今日') || hours.includes('本日')
                            const isClosed = hours.includes('定休日') || hours.includes('閉店')
                            // 曜日と時間を分離
                            const dayMatch = hours.match(/^(月|火|水|木|金|土|日)曜日/)
                            const day = dayMatch ? dayMatch[1] : ''
                            const timeText = hours.replace(/^(月|火|水|木|金|土|日)曜日[:：]?\s*/, '')
                            return (
                              <div 
                                key={idx} 
                                className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded ${
                                  isToday 
                                    ? 'bg-orange-50 border border-orange-200 font-medium text-orange-700' 
                                    : 'bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span className="font-medium min-w-[2rem]">{day}曜</span>
                                <span className="flex-1 text-right ml-2">{timeText}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                  {/* お店情報（電話番号、ウェブサイト） */}
                  {(selectedRestaurantForDetail.phone_number || selectedRestaurantForDetail.website) && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <i className="ri-phone-line text-orange-600 text-sm"></i>
                        連絡先
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {selectedRestaurantForDetail.phone_number && (
                          <a 
                            href={`tel:${selectedRestaurantForDetail.phone_number}`}
                            className="flex items-center gap-2 text-xs text-gray-700 hover:text-orange-600 font-medium bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 hover:border-orange-300 transition-colors"
                          >
                            <i className="ri-phone-line text-orange-600"></i>
                            {selectedRestaurantForDetail.phone_number}
                          </a>
                        )}
                        {selectedRestaurantForDetail.website && (
                          <a 
                            href={selectedRestaurantForDetail.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-gray-700 hover:text-orange-600 font-medium bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 hover:border-orange-300 transition-colors break-all"
                          >
                            <i className="ri-global-line text-orange-600"></i>
                            <span className="truncate">ウェブサイト</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 口コミ */}
                  {selectedRestaurantForDetail.reviews && selectedRestaurantForDetail.reviews.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <i className="ri-star-line text-orange-600 text-sm"></i>
                        口コミ
                        {selectedRestaurantForDetail.user_ratings_total ? (
                          <span className="text-gray-600">（全{selectedRestaurantForDetail.user_ratings_total.toLocaleString()}件中、最新{selectedRestaurantForDetail.reviews.length}件を表示）</span>
                        ) : (
                          <span className="text-gray-600">（{selectedRestaurantForDetail.reviews.length}件）</span>
                        )}
                      </h4>
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {selectedRestaurantForDetail.reviews.map((review, idx) => (
                          <div key={idx} className="bg-white border border-orange-200 rounded-lg p-3 shadow-sm">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                  <span className="text-white text-[10px] font-bold">
                                    {review.author_name.charAt(0)}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{review.author_name}</p>
                                  <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <i
                                        key={i}
                                        className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-yellow-500 text-[10px]`}
                                      ></i>
                                    ))}
                                    <span className="text-[10px] text-gray-600 ml-0.5">{review.rating}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-500 flex-shrink-0">
                                {review.relative_time_description}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* フッター（アクションボタン） */}
                <div className="pt-4 mt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
                  {addedRestaurantIds.has(selectedRestaurantForDetail.place_id || selectedRestaurantForDetail.id) ? (
                    <button
                      type="button"
                      disabled
                      className="flex-1 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg font-semibold cursor-not-allowed border border-green-200 flex items-center justify-center gap-2 h-[44px] text-sm"
                    >
                      <i className="ri-check-line"></i>
                      追加済み
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(selectedRestaurantForDetail)
                        setSelectedRestaurantForDetail(null)
                      }}
                      className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 h-[44px] text-sm"
                    >
                      <i className="ri-add-line"></i>
                      このお店を追加
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
              setIsModalOpen(false)
              setTimeout(() => setSelectedRestaurantForDetail(null), 300)
            }}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 h-[44px] text-sm"
                  >
                    <i className="ri-close-line"></i>
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
