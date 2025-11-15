'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getManualLocation,
  subscribeManualLocation,
  ManualLocation,
} from '@/lib/manualLocation'
import { normalizeSearchQuery } from '@/lib/utils/search'

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
  const [expandedRestaurantIds, setExpandedRestaurantIds] = useState<Set<string>>(new Set())
  const [expandedDetails, setExpandedDetails] = useState<Record<string, Restaurant>>({})
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const previousLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const supabase = createClient()

  const showResultsRef = useRef(showResults)
  useEffect(() => {
    showResultsRef.current = showResults
  }, [showResults])

  const queryRef = useRef(query)
  useEffect(() => {
    queryRef.current = query
  }, [query])

  const restaurantsRef = useRef(restaurants)
  useEffect(() => {
    restaurantsRef.current = restaurants
  }, [restaurants])

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
    const updateLocation = (shouldResearch: boolean = false) => {
      // 優先順位: 1. propsから渡された位置情報 2. localStorageに保存された位置情報 3. 現在位置 4. デフォルト位置
      let newLocation: { lat: number; lng: number } | null = null

      if (propUserLocation) {
        newLocation = propUserLocation
      } else if (typeof window !== 'undefined') {
        // localStorageから保存された位置情報を確認
        const saved = getManualLocation()
        if (saved) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Using saved location from localStorage:', saved.lat, saved.lng)
          }
          newLocation = { lat: saved.lat, lng: saved.lng }
        }
      }

      if (!newLocation) {
        // ユーザーの位置情報を取得
        if (typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const loc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
              const locationChanged = previousLocationRef.current && 
                (previousLocationRef.current.lat !== loc.lat || previousLocationRef.current.lng !== loc.lng)
              previousLocationRef.current = loc
              setUserLocation(loc)
              // 位置情報が更新された場合、既に検索結果が表示されている場合は再検索
              if (shouldResearch && locationChanged && (showResults || restaurants.length > 0)) {
                const normalized = normalizeSearchQuery(query)
                searchRestaurants(normalized ?? undefined, loc)
              }
            },
            (error) => {
              console.error('Error getting location:', error)
              // デフォルトの位置（東京駅）を使用
              const loc = { lat: 35.6812, lng: 139.7671 }
              const locationChanged = previousLocationRef.current && 
                (previousLocationRef.current.lat !== loc.lat || previousLocationRef.current.lng !== loc.lng)
              previousLocationRef.current = loc
              setUserLocation(loc)
              if (shouldResearch && locationChanged && (showResults || restaurants.length > 0)) {
                const normalized = normalizeSearchQuery(query)
                searchRestaurants(normalized ?? undefined, loc)
              }
            }
          )
          return
        } else {
          // デフォルトの位置（東京駅）を使用
          newLocation = { lat: 35.6812, lng: 139.7671 }
        }
      }

      // 位置情報が変更されたかチェック
      const locationChanged = previousLocationRef.current && newLocation && 
        (previousLocationRef.current.lat !== newLocation.lat || previousLocationRef.current.lng !== newLocation.lng)

      previousLocationRef.current = newLocation
      setUserLocation(newLocation)

      // 位置情報が更新された場合、自動的に検索を実行
      if (shouldResearch && newLocation) {
        if (locationChanged) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Location changed, updating search results...', newLocation)
          }
          setRestaurants([])
          setShowResults(false)
        }

        // 最新の位置情報を取得してから検索
        const triggerSearch = () => {
          let locationToUse = newLocation
          if (typeof window !== 'undefined' && !propUserLocation) {
            const saved = getManualLocation()
            if (saved) {
              locationToUse = { lat: saved.lat, lng: saved.lng }
              if (process.env.NODE_ENV === 'development') {
                console.log('Auto-searching with latest location from localStorage:', locationToUse)
              }
            }
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('Auto-searching with location:', locationToUse)
          }
          setShowResults(true)
          const normalized = normalizeSearchQuery(queryRef.current)
          searchRestaurants(normalized ?? undefined, locationToUse)
        }

        // 状態更新を確実に反映させるため、やや遅延させる
        setTimeout(triggerSearch, locationChanged ? 500 : 250)
      }
    }

    updateLocation(false)

    if (!propUserLocation) {
      const unsubscribe = subscribeManualLocation((location: ManualLocation | null) => {
        if (location) {
          const next = { lat: location.lat, lng: location.lng }
          const prev = previousLocationRef.current
          const changed =
            !prev ||
            prev.lat !== next.lat ||
            prev.lng !== next.lng
          previousLocationRef.current = next
          setUserLocation(next)
          if ((showResultsRef.current || restaurantsRef.current.length > 0) && next) {
            const normalized = normalizeSearchQuery(queryRef.current)
            searchRestaurants(normalized ?? undefined, next)
          }
        }
      })
      return () => {
        unsubscribe?.()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propUserLocation])

  const searchRestaurants = async (searchQuery?: string, forceLocation?: { lat: number; lng: number }) => {
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

      // 検索実行時に必ず最新の位置情報を取得（localStorageから再読み込み）
      // これは重要：位置情報が更新された直後でも、最新の位置情報を確実に使用する
      // 状態の更新を待たずに、直接localStorageから取得した位置情報を使用する
      let currentLocation: { lat: number; lng: number } | null = null
      
      // 優先順位: 1. 強制指定された位置情報 2. propsから渡された位置情報 3. localStorageに保存された位置情報 4. 現在のuserLocation
      if (forceLocation) {
        currentLocation = forceLocation
        if (process.env.NODE_ENV === 'development') {
          console.log('Using forced location:', currentLocation)
        }
      } else if (propUserLocation) {
        currentLocation = propUserLocation
        if (process.env.NODE_ENV === 'development') {
          console.log('Using propUserLocation:', currentLocation)
        }
      } else if (typeof window !== 'undefined') {
        // 常にlocalStorageから最新の位置情報を取得（状態に依存しない）
        const saved = getManualLocation()
        if (saved) {
          currentLocation = { lat: saved.lat, lng: saved.lng }
          if (process.env.NODE_ENV === 'development') {
            console.log('Using latest location from localStorage:', currentLocation)
          }
          // 位置情報が変更された場合は状態も更新（次回の検索のために）
          if (!userLocation || userLocation.lat !== saved.lat || userLocation.lng !== saved.lng) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Location changed, updating state:', saved.lat, saved.lng)
            }
            setUserLocation(currentLocation)
          }
        }
      }
      
      // localStorageに位置情報がない場合は、現在のuserLocationを使用
      if (!currentLocation) {
        currentLocation = userLocation
        if (process.env.NODE_ENV === 'development') {
          console.log('Using fallback userLocation:', currentLocation)
        }
      }

      if (!currentLocation) {
        console.error('RestaurantSearch: userLocation is not available')
        setLoading(false)
        return
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Searching restaurants with location:', currentLocation, 'at', new Date().toISOString())
      }

      // Places API (New)を使用
      // JavaScript APIでは、PlacesServiceは従来通り使用できますが、
      // 新しいAPIのフィールド（currentOpeningHoursなど）をサポートしています
      const service = new google.maps.places.PlacesService(document.createElement('div'))
      const location = new google.maps.LatLng(currentLocation.lat, currentLocation.lng)

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

        // 全件の詳細情報を取得（営業時間フィルタリングのため）
        const detailPromises = basicRestaurants.map((restaurant) => {
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
            const merged = prevRestaurants.map(r => updatedMap.get(r.place_id || r.id) || r)
            
            // 営業時間でフィルタリング
            if (startTime && endTime) {
              return merged.filter(restaurant => isOpenDuringTime(restaurant, startTime, endTime, eventDate))
            }
            return merged
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

    // 位置情報を取得（最新の状態を確認）
    let hasLocation = false
    if (propUserLocation) {
      hasLocation = true
    } else if (typeof window !== 'undefined') {
      const saved = getManualLocation()
      if (saved) {
        hasLocation = true
      }
    }
    
    if (!hasLocation && !userLocation) {
      return
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, userLocation, propUserLocation]) // query、userLocation、またはpropUserLocationが変更されたときに実行

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    // デバウンスをキャンセルして即座に検索
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 検索前に必ず最新の位置情報を取得
    let latestLocation: { lat: number; lng: number } | null = null
    if (!propUserLocation) {
      const saved = getManualLocation()
      if (saved) {
        latestLocation = { lat: saved.lat, lng: saved.lng }
        setUserLocation(latestLocation)
        if (process.env.NODE_ENV === 'development') {
          console.log('Location updated before search:', latestLocation)
        }
      }
    }

    setShowResults(true)
    const normalizedQuery = normalizeSearchQuery(query)
    searchRestaurants(normalizedQuery ?? undefined, latestLocation || undefined)
  }

  const handleSearchClick = async () => {
    // デバウンスをキャンセルして即座に検索
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 検索前に必ず最新の位置情報を取得
    let latestLocation: { lat: number; lng: number } | null = null
    if (!propUserLocation) {
      const saved = getManualLocation()
      if (saved) {
        latestLocation = { lat: saved.lat, lng: saved.lng }
        setUserLocation(latestLocation)
        if (process.env.NODE_ENV === 'development') {
          console.log('Location updated before search click:', latestLocation)
        }
      }
    }

    setShowResults(true)
    const normalizedQuery = normalizeSearchQuery(query)
    searchRestaurants(normalizedQuery ?? undefined, latestLocation || undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearchClick()
    }
  }

  // お店の詳細情報（口コミ含む）を取得
  const loadRestaurantDetails = async (restaurant: Restaurant): Promise<Restaurant> => {
    const placeId = restaurant.place_id
    if (
      !placeId ||
      typeof placeId !== 'string' ||
      placeId.trim() === '' ||
      placeId.length < 10 ||
      typeof window === 'undefined' ||
      !(window as any).google?.maps?.places
    ) {
      return restaurant
    }

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

      return await new Promise((resolve) => {
        detailService.getDetails(detailRequest, (placeDetails: any, detailStatus: string) => {
          if (detailStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
            const reviews: Review[] = placeDetails.reviews
              ? placeDetails.reviews.map((review: any) => ({
                  author_name: review.author_name || '匿名',
                  rating: review.rating || 0,
                  text: review.text || '',
                  time: review.time || 0,
                  relative_time_description: review.relative_time_description || '',
                }))
              : []

            let weekdayText: string[] = []
            let periods: any[] = []

            if (placeDetails.currentOpeningHours) {
              weekdayText =
                placeDetails.currentOpeningHours.weekdayDescriptions ||
                placeDetails.currentOpeningHours.weekdayText ||
                []
              periods = placeDetails.currentOpeningHours.periods || []
            } else if (placeDetails.opening_hours) {
              weekdayText = placeDetails.opening_hours.weekday_text || []
              periods = placeDetails.opening_hours.periods || []
            }

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
              opening_hours:
                periods.length > 0 || weekdayText.length > 0
                  ? {
                      periods: periods,
                      weekday_text: weekdayText,
                    }
                  : restaurant.opening_hours || null,
            }

            resolve(detailedRestaurant)
          } else {
            resolve(restaurant)
          }
        })
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching restaurant details:', error)
      }
      return restaurant
    }
  }

  const handleToggleDetails = async (restaurant: Restaurant) => {
    const restaurantId = restaurant.place_id || restaurant.id
    if (!restaurantId) return

    const isCurrentlyExpanded = expandedRestaurantIds.has(restaurantId)
    
    setExpandedRestaurantIds((prev) => {
      const newSet = new Set(prev)
      if (isCurrentlyExpanded) {
        newSet.delete(restaurantId)
      } else {
        newSet.add(restaurantId)
      }
      return newSet
    })

    // 開く場合で、まだ詳細データを読み込んでいない場合のみ読み込む
    if (!isCurrentlyExpanded && !expandedDetails[restaurantId]) {
      setDetailLoadingId(restaurantId)
      const detailed = await loadRestaurantDetails(restaurant)
      setExpandedDetails((prev) => ({ ...prev, [restaurantId]: detailed }))
      setDetailLoadingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <label htmlFor="restaurantSearch" className="sr-only">
          お店を検索
        </label>
        <div className="flex-1 relative">
          <input
            id="restaurantSearch"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={userLocation ? "お店の名前で絞り込み（空白で近くのお店を表示）" : "お店の名前やエリアで検索"}
            className="w-full px-5 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm min-h-[48px] bg-white font-medium"
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
          <div className="max-h-[600px] overflow-y-auto space-y-4">
            {restaurants
              .filter(restaurant => {
                // 営業時間でフィルタリング（詳細情報が取得済みの場合のみ）
                if (startTime && endTime) {
                  return isOpenDuringTime(restaurant, startTime, endTime, eventDate)
                }
                return true
              })
              .map((restaurant) => {
              const restaurantId = restaurant.place_id || restaurant.id
              const isAdded = addedRestaurantIds.has(restaurantId)
              const isExpanded = expandedRestaurantIds.has(restaurantId)
              const detailData = expandedDetails[restaurantId] || restaurant

              return (
                <div
                  key={restaurant.id}
                  className={`group w-full p-5 border-2 rounded-2xl transition-all duration-200 ${
                    isAdded
                      ? 'border-green-400 bg-green-50 hover:bg-green-100 shadow-md'
                      : selectedRestaurant?.id === restaurant.id
                      ? 'border-orange-400 bg-orange-50 shadow-md'
                      : 'border-orange-100 bg-white hover:bg-orange-50 hover:border-orange-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    {/* ヘッダー: 名前とアクションボタン */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1.5">{restaurant.name}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed flex items-start gap-1.5">
                          <i className="ri-map-pin-line text-orange-500 mt-0.5 text-base flex-shrink-0"></i>
                          <span className="break-words">{restaurant.address}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm min-w-[70px]"
                          onClick={() => onSelect(detailData)}
                          aria-label={isAdded ? `${restaurant.name}を候補から解除` : `${restaurant.name}を候補に追加`}
                        >
                          <i className={`ri-${isAdded ? 'close' : 'add'}-line text-sm`} aria-hidden="true"></i>
                          <span className="whitespace-nowrap">{isAdded ? '解除' : '追加'}</span>
                        </button>
                      </div>
                    </div>

                    {/* メイン情報: 評価、地図 */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-2">
                      {restaurant.rating && (
                        <span className="inline-flex items-center justify-center gap-1.5 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200 text-gray-800 w-fit min-h-[40px]">
                          <i className="ri-star-fill text-yellow-500 text-sm"></i>
                          <span className="font-semibold text-sm">{restaurant.rating.toFixed(1)}</span>
                          {restaurant.user_ratings_total && (
                            <span className="text-xs text-gray-600 hidden sm:inline">
                              ({restaurant.user_ratings_total.toLocaleString()})
                            </span>
                          )}
                        </span>
                      )}
                      <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:ml-auto">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors flex-1 sm:flex-initial touch-manipulation min-h-[40px]"
                          onClick={() => {
                            const query = restaurant.address ? `${restaurant.name} ${restaurant.address}` : restaurant.name
                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${
                              restaurant.place_id ? `&query_place_id=${restaurant.place_id}` : ''
                            }`
                            window.open(url, '_blank', 'noopener,noreferrer')
                          }}
                          aria-label={`${restaurant.name}をGoogleマップで開く`}
                        >
                          <i className="ri-map-pin-2-line text-sm" aria-hidden="true"></i>
                          <span className="whitespace-nowrap">地図</span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-initial touch-manipulation min-h-[40px]"
                          onClick={() => handleToggleDetails(restaurant)}
                          aria-label={isExpanded ? `${restaurant.name}の詳細を閉じる` : `${restaurant.name}の詳細を開く`}
                          aria-expanded={isExpanded}
                        >
                          <i className={`ri-${isExpanded ? 'arrow-up' : 'arrow-down'}-s-line text-sm`} aria-hidden="true"></i>
                          <span className="whitespace-nowrap">{isExpanded ? '閉じる' : '詳細'}</span>
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                        {detailLoadingId === restaurantId ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
                            <div className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">読み込み中...</span>
                          </div>
                        ) : (
                          <>
                            {/* 連絡先情報 */}
                            {(detailData.phone_number || detailData.website) && (
                              <div className="flex flex-wrap gap-2">
                                {detailData.phone_number && (
                                  <a
                                    href={`tel:${detailData.phone_number}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <i className="ri-phone-line text-orange-600"></i>
                                    {detailData.phone_number}
                                  </a>
                                )}
                                {detailData.website && (
                                  <a
                                    href={detailData.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <i className="ri-global-line text-orange-600"></i>
                                    ウェブサイト
                                  </a>
                                )}
                              </div>
                            )}

                            {/* 概要 */}
                            {detailData.editorialSummary && (
                              <div className="text-xs text-gray-700 bg-orange-50/50 rounded-lg p-3 border border-orange-100 leading-relaxed">
                                {detailData.editorialSummary}
                              </div>
                            )}

                            {/* 口コミ（最大2件） */}
                            {detailData.reviews && detailData.reviews.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-2">
                                  口コミ
                                  {detailData.user_ratings_total && (
                                    <span className="text-gray-500 font-normal ml-1">
                                      （{detailData.user_ratings_total.toLocaleString()}件中）
                                    </span>
                                  )}
                                </p>
                                <div className="space-y-2">
                                  {detailData.reviews.slice(0, 5).map((review, idx) => (
                                    <div key={`${restaurantId}-review-${idx}`} className="bg-white border border-gray-200 rounded-lg p-2.5">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-semibold text-gray-800">{review.author_name}</span>
                                          <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                              <i
                                                key={i}
                                                className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-yellow-500 text-[10px]`}
                                              ></i>
                                            ))}
                                          </div>
                                        </div>
                                        <span className="text-[10px] text-gray-500">{review.relative_time_description}</span>
                                      </div>
                                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{review.text}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
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

    </div>
  )
}
