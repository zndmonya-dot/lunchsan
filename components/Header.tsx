'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  getManualLocation,
  setManualLocation as saveManualLocation,
  clearManualLocation,
} from '@/lib/manualLocation'
import { normalizeSearchQuery } from '@/lib/utils/search'

interface WeatherData {
  temperature: number
  condition: string
  icon: string
  location: string
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false) // 初期状態をfalseに変更（取得開始時にtrueにする）
  const [error, setError] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [manualLocationName, setManualLocationName] = useState('')
  const [addressSearch, setAddressSearch] = useState('')
  const [searchingAddress, setSearchingAddress] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)

  // トップに戻る関数
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (pathname === '/') {
      // ホームページの場合は、ハッシュをクリアしてスクロール
      if (typeof window !== 'undefined') {
        if (window.location.hash) {
          window.history.replaceState(null, '', '/')
        }
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    } else {
      // 他のページの場合は、ホームページに遷移
      router.push('/')
    }
  }

  useEffect(() => {
    // 位置情報を取得して天気情報を取得
    // 個人開発の日本人向けおすすめ: Open-Meteo API（完全無料、APIキー不要）
    // フォールバック: OpenWeatherMap API（APIキーが必要な場合）
    
    // キャッシュキー: 位置情報に基づいてキャッシュを管理（10分間キャッシュ）
    const getCachedWeather = (lat: number, lng: number): WeatherData | null => {
      if (typeof window === 'undefined') return null
      const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          // 10分間キャッシュを有効にする
          if (Date.now() - timestamp < 10 * 60 * 1000) {
            return data
          }
        } catch (error) {
          // キャッシュの解析に失敗した場合は無視
          console.warn('Failed to parse cached weather data:', error)
        }
      }
      return null
    }

    const setCachedWeather = (lat: number, lng: number, data: WeatherData) => {
      if (typeof window === 'undefined') return
      try {
        const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }))
      } catch (error) {
        // localStorageへの書き込みに失敗した場合は無視（容量制限など）
        console.warn('Failed to cache weather data:', error)
      }
    }

    const fetchWeatherWithOpenMeteo = async (lat: number, lng: number): Promise<WeatherData | null> => {
      try {
        // Open-Meteo API（完全無料、APIキー不要）
        // 適切なHTTPヘッダーを設定
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Asia/Tokyo&forecast_days=1`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            cache: 'default', // ブラウザのキャッシュを活用
          }
        )

        if (!response.ok) {
          return null
        }

        const data = await response.json()
        
        if (!data || !data.current) {
          return null
        }

        // 天気コードからアイコンと説明を取得
        const weatherCode = data.current.weather_code
        // 現在時刻を取得（日本時間）
        const now = new Date()
        const japanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
        const hour = japanTime.getHours()
        const isNight = hour >= 18 || hour < 6 // 18時〜6時を夜間とする

        const weatherIcons: { [key: number]: { day: string; night: string } } = {
          0: { day: '☀️', night: '🌙' }, // Clear sky
          1: { day: '🌤️', night: '☁️' }, // Mainly clear
          2: { day: '⛅', night: '☁️' }, // Partly cloudy
          3: { day: '☁️', night: '☁️' }, // Overcast
          45: { day: '🌫️', night: '🌫️' }, // Fog
          48: { day: '🌫️', night: '🌫️' }, // Depositing rime fog
          51: { day: '🌦️', night: '🌧️' }, // Light drizzle
          53: { day: '🌦️', night: '🌧️' }, // Moderate drizzle
          55: { day: '🌧️', night: '🌧️' }, // Dense drizzle
          56: { day: '🌨️', night: '🌨️' }, // Light freezing drizzle
          57: { day: '🌨️', night: '🌨️' }, // Dense freezing drizzle
          61: { day: '🌧️', night: '🌧️' }, // Slight rain
          63: { day: '🌧️', night: '🌧️' }, // Moderate rain
          65: { day: '🌧️', night: '🌧️' }, // Heavy rain
          66: { day: '🌨️', night: '🌨️' }, // Light freezing rain
          67: { day: '🌨️', night: '🌨️' }, // Heavy freezing rain
          71: { day: '🌨️', night: '🌨️' }, // Slight snow fall
          73: { day: '🌨️', night: '🌨️' }, // Moderate snow fall
          75: { day: '🌨️', night: '🌨️' }, // Heavy snow fall
          77: { day: '🌨️', night: '🌨️' }, // Snow grains
          80: { day: '🌧️', night: '🌧️' }, // Slight rain showers
          81: { day: '🌧️', night: '🌧️' }, // Moderate rain showers
          82: { day: '🌧️', night: '🌧️' }, // Violent rain showers
          85: { day: '🌨️', night: '🌨️' }, // Slight snow showers
          86: { day: '🌨️', night: '🌨️' }, // Heavy snow showers
          95: { day: '⛈️', night: '⛈️' }, // Thunderstorm
          96: { day: '⛈️', night: '⛈️' }, // Thunderstorm with slight hail
          99: { day: '⛈️', night: '⛈️' }, // Thunderstorm with heavy hail
        }

        const getWeatherIcon = (code: number): string => {
          const iconSet = weatherIcons[code]
          if (!iconSet) return '☀️'
          return isNight ? iconSet.night : iconSet.day
        }

        const weatherDescriptions: { [key: number]: string } = {
          0: '快晴', 1: '晴れ', 2: '一部曇り', 3: '曇り',
          45: '霧', 48: '霧', 51: '小雨', 53: '小雨', 55: '強い小雨',
          56: '軽い凍雨', 57: '強い凍雨', 61: '小雨', 63: '雨', 65: '大雨',
          66: '軽い凍雨', 67: '強い凍雨', 71: '小雪', 73: '雪', 75: '大雪',
          77: '雪', 80: 'にわか雨', 81: 'にわか雨', 82: '強いにわか雨',
          85: 'にわか雪', 86: '強いにわか雪', 95: '雷雨', 96: '雷雨', 99: '強い雷雨',
        }

        // 地名を取得（BigDataCloudの無料逆ジオコーディングAPI）
        let locationName = '位置情報取得中'
        try {
          const geocodeResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ja`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              cache: 'default',
            }
          )
          
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json()
            if (geocodeData) {
              if (geocodeData.countryCode === 'JP') {
                // 日本の場合、市区町村名を優先
                locationName = geocodeData.city || geocodeData.locality || geocodeData.principalSubdivision || '日本'
              } else {
                locationName = geocodeData.city || geocodeData.locality || geocodeData.countryName || '位置情報取得中'
              }
            }
          }
        } catch (error) {
          console.error('Error fetching location name:', error)
          if (lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146) {
            locationName = '日本'
          } else {
            locationName = `${lat.toFixed(2)}, ${lng.toFixed(2)}`
          }
        }

        const openMeteoWeatherData: WeatherData = {
          temperature: Math.round(data.current.temperature_2m),
          condition: weatherDescriptions[weatherCode] || '不明',
          icon: getWeatherIcon(weatherCode),
          location: locationName,
        }

        // キャッシュに保存
        setCachedWeather(lat, lng, openMeteoWeatherData)
        
        return openMeteoWeatherData
      } catch (error) {
        console.error('Error fetching weather from Open-Meteo:', error)
        return null
      }
    }

    const fetchWeatherWithOpenWeatherMap = async (lat: number, lng: number): Promise<WeatherData | null> => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
        if (!apiKey) {
          return null
        }

        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=ja`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            cache: 'default',
          }
        )

        if (!weatherResponse.ok) {
          return null
        }

        const apiResponse = await weatherResponse.json()

        if (!apiResponse || !apiResponse.main || !apiResponse.weather || !apiResponse.weather[0]) {
          return null
        }

        let locationName = '位置情報取得中'
        try {
          const geocodeResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=5&appid=${apiKey}`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              cache: 'default',
            }
          )
          
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json()
            if (geocodeData && geocodeData.length > 0) {
              const japanLocation = geocodeData.find((loc: any) => 
                loc.country === 'JP' || loc.local_names?.ja
              )
              
              if (japanLocation) {
                locationName = japanLocation.local_names?.ja || 
                               japanLocation.local_names?.en || 
                               japanLocation.name || 
                               '位置情報取得中'
              } else {
                locationName = geocodeData[0].local_names?.ja || 
                               geocodeData[0].local_names?.en || 
                               geocodeData[0].name || 
                               '位置情報取得中'
              }
              
              if (geocodeData[0].country === 'JP') {
                const state = geocodeData[0].state || geocodeData[0].local_names?.ja_state
                if (state && !locationName.includes(state)) {
                  locationName = `${locationName}（${state}）`
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching location name:', error)
          if (lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146) {
            locationName = '日本'
          } else {
            locationName = `${lat.toFixed(2)}, ${lng.toFixed(2)}`
          }
        }

        const weatherIcons: { [key: string]: string } = {
          '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
          '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
          '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
          '11d': '⛈️', '11n': '⛈️', '13d': '🌨️', '13n': '🌨️',
          '50d': '🌫️', '50n': '🌫️',
        }

        const openWeatherMapData: WeatherData = {
          temperature: Math.round(apiResponse.main.temp),
          condition: apiResponse.weather[0]?.description || '不明',
          icon: weatherIcons[apiResponse.weather[0]?.icon] || '☀️',
          location: locationName,
        }

        // キャッシュに保存
        setCachedWeather(lat, lng, openWeatherMapData)
        
        return openWeatherMapData
      } catch (error) {
        console.error('Error fetching weather from OpenWeatherMap:', error)
        return null
      }
    }


    // fetchWeather関数を定義（useEffect内で使用）
    const fetchWeather = async (lat: number, lng: number) => {
      try {
        // まずキャッシュを確認（10分間有効）
        const cachedData = getCachedWeather(lat, lng)
        if (cachedData) {
          setWeather(cachedData)
          setError(null)
          setLoading(false)
          return
        }

        // キャッシュがない場合、APIから取得
        // タイムアウトを設定（10秒でタイムアウト）
        const fetchWithTimeout = async (promise: Promise<WeatherData | null>, timeout: number): Promise<WeatherData | null> => {
          return Promise.race([
            promise,
            new Promise<WeatherData | null>((resolve) => {
              setTimeout(() => resolve(null), timeout)
            })
          ])
        }

        // まずOpen-Meteo APIを試す（完全無料、APIキー不要）
        let weatherData = await fetchWithTimeout(fetchWeatherWithOpenMeteo(lat, lng), 8000)
        
        // Open-Meteoが失敗した場合、OpenWeatherMapを試す（APIキーが必要）
        if (!weatherData) {
          weatherData = await fetchWithTimeout(fetchWeatherWithOpenWeatherMap(lat, lng), 8000)
        }

        if (weatherData) {
          setWeather(weatherData)
          setError(null)
        } else {
          // エラーではなく、デフォルト値を設定（ローディングを解除）
          setWeather({
            temperature: 0,
            condition: '情報なし',
            icon: '☀️',
            location: '日本'
          })
          setError(null)
        }
      } catch (error) {
        console.error('Error fetching weather:', error)
        // エラー時もデフォルト値を設定してローディングを解除
        setWeather({
          temperature: 0,
          condition: '情報なし',
          icon: '☀️',
          location: '日本'
        })
        setError(null)
      } finally {
        // 必ずローディングを解除
        setLoading(false)
      }
    }

    // 保存された位置情報を確認
    const getSavedLocation = (): { lat: number; lng: number } | null => {
      const saved = getManualLocation()
      if (saved) {
        return { lat: saved.lat, lng: saved.lng }
      }
      return null
    }

    // 位置情報を取得（タイムアウトを短くして、確実にローディングを解除）
    let timeoutId: NodeJS.Timeout | null = null
    let geolocationTimeoutId: NodeJS.Timeout | null = null

    // まず保存された位置情報を確認
    const savedLocation = getSavedLocation()
    if (savedLocation) {
      setLoading(true)
      fetchWeather(savedLocation.lat, savedLocation.lng).catch((error) => {
        console.error('Error in fetchWeather:', error)
        setLoading(false)
      })
      return
    }

    if (typeof window !== 'undefined' && navigator.geolocation) {
      // ローディング開始
      setLoading(true)

      // タイムアウトを設定（3秒に短縮して素早くフォールバック）
      const options = {
        enableHighAccuracy: false, // 高精度を無効化してタイムアウトを減らす
        timeout: 3000, // タイムアウトを3秒に短縮
        maximumAge: 300000 // 5分間キャッシュされた位置情報を使用可能
      }

      // 最大5秒後に強制的にデフォルト位置を使用（安全装置）
      geolocationTimeoutId = setTimeout(async () => {
        console.warn('位置情報の取得が最大タイムアウトに達しました。デフォルト位置（東京駅）を使用します。')
        await fetchWeather(35.6812, 139.7671)
      }, 5000)

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (geolocationTimeoutId) clearTimeout(geolocationTimeoutId)
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          await fetchWeather(lat, lng)
        },
        async (error) => {
          if (geolocationTimeoutId) clearTimeout(geolocationTimeoutId)
          // 位置情報が取得できない場合は正常なフォールバック動作
          // エラーコードに応じて適切なメッセージを表示
          // エラーコード: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
          if (error.code === 3) {
            // タイムアウトは警告レベル（正常なフォールバック）
            console.warn('位置情報の取得がタイムアウトしました。デフォルト位置（東京駅）を使用します。')
          } else if (error.code === 1) {
            // 許可拒否も警告レベル
            console.warn('位置情報の使用が許可されていません。デフォルト位置（東京駅）を使用します。')
          } else {
            // その他のエラーも警告レベル
            console.warn('位置情報を取得できませんでした。デフォルト位置（東京駅）を使用します。', error.message)
          }
          // デフォルト位置（東京駅）で天気情報を取得
          await fetchWeather(35.6812, 139.7671)
        },
        options
      )
    } else {
      // 位置情報APIが利用できない場合もデフォルト位置を使用（警告なし）
      setLoading(true)
      // 非同期処理を実行
      fetchWeather(35.6812, 139.7671).catch((error) => {
        console.error('Error in fetchWeather:', error)
        setLoading(false)
      })
    }

    // クリーンアップ関数
    return () => {
      if (geolocationTimeoutId) {
        clearTimeout(geolocationTimeoutId)
      }
    }
  }, [])

  // 位置設定のハンドラー
  const handleWeatherClick = () => {
    // 保存された位置情報を読み込む
    const saved = getManualLocation()
    if (saved) {
      setManualLat(saved.lat.toString())
      setManualLng(saved.lng.toString())
      setManualLocationName(saved.locationName || '')
    }
    setShowLocationModal(true)
  }

  const handleSearchAddress = async () => {
    const normalizedQuery = normalizeSearchQuery(addressSearch)
    if (!normalizedQuery) {
      setError('キーワードを入力してください')
      return
    }

    setSearchingAddress(true)
    setError(null)

    try {
      // Next.jsのAPIルート経由でOpenStreetMapのNominatim APIを使用（CORS回避）
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(normalizedQuery)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        // レスポンスの詳細を確認
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        setError(`検索に失敗しました（${response.status}）。しばらく時間をおいてから再度お試しください。`)
        setSearchingAddress(false)
        return
      }

      const data = await response.json()
      console.log('Search result:', data)
      
      // Nominatim APIは配列を返す
      if (!Array.isArray(data) || data.length === 0) {
        setError('見つかりませんでした。別のキーワードで検索してください。')
        setSearchingAddress(false)
        return
      }

      const locationData = data[0]
      
      if (!locationData || !locationData.lat || !locationData.lon) {
        setError('見つかりませんでした。別のキーワードで検索してください。')
        setSearchingAddress(false)
        return
      }

      // 緯度経度を設定
      setManualLat(locationData.lat.toString())
      setManualLng(locationData.lon.toString())
      
      // 地名を設定（Nominatimのaddressオブジェクトから取得）
      let locationName = ''
      if (locationData.address) {
        const addr = locationData.address
        // 日本の住所構造に合わせて地名を構築
        if (addr.name && addr.name !== addressSearch) {
          locationName = addr.name
        } else if (addr.road) {
          locationName = addr.road
          if (addr.city || addr.town || addr.village) {
            locationName = `${locationName}（${addr.city || addr.town || addr.village}）`
          }
        } else if (addr.city || addr.town || addr.village) {
          locationName = addr.city || addr.town || addr.village
          if (addr.state) {
            locationName = `${locationName}（${addr.state}）`
          }
        } else if (addr.state) {
          locationName = addr.state
        } else {
          locationName = locationData.display_name?.split(',')[0] || addressSearch
        }
      } else {
        locationName = locationData.display_name?.split(',')[0] || addressSearch
      }
      
      setManualLocationName(locationName)
      setAddressSearch('')
    } catch (error: any) {
      console.error('Error searching address:', error)
      // より詳細なエラーメッセージを表示
      if (error.message) {
        setError(`検索に失敗しました: ${error.message}`)
      } else {
        setError('検索に失敗しました。ネットワーク接続を確認してください。')
      }
    } finally {
      setSearchingAddress(false)
    }
  }

  const handleSaveLocation = async () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)

    if (isNaN(lat) || isNaN(lng)) {
      setError('位置情報が設定されていません。キーワードで検索するか、現在位置を取得してください。')
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('緯度は-90〜90、経度は-180〜180の範囲で入力してください')
      return
    }

    setSavingLocation(true)
    setError(null)

    try {
      // 位置情報を保存
      saveManualLocation({
        lat,
        lng,
        locationName: manualLocationName || '',
      })

      // 天気情報を再取得
      setLoading(true)
      await fetchWeather(lat, lng)

      setShowLocationModal(false)
      setManualLat('')
      setManualLng('')
      setManualLocationName('')
      setAddressSearch('')
    } catch (error) {
      console.error('Error saving location:', error)
      setError('位置情報の保存に失敗しました')
    } finally {
      setSavingLocation(false)
    }
  }

  const handleGetCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setSavingLocation(true)
      setError(null)
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setManualLat(lat.toString())
          setManualLng(lng.toString())
          
          // 地名を取得
          try {
            const geocodeResponse = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ja`
            )
            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json()
              if (geocodeData) {
                if (geocodeData.countryCode === 'JP') {
                  setManualLocationName(geocodeData.city || geocodeData.locality || geocodeData.principalSubdivision || '')
                } else {
                  setManualLocationName(geocodeData.city || geocodeData.locality || geocodeData.countryName || '')
                }
              }
            }
          } catch (error) {
            console.error('Error fetching location name:', error)
          }
          
          setSavingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('位置情報の取得に失敗しました')
          setSavingLocation(false)
        }
      )
    } else {
      setError('位置情報APIが利用できません')
    }
  }

  const handleClearLocation = () => {
    clearManualLocation()
    setManualLat('')
    setManualLng('')
    setManualLocationName('')
    setAddressSearch('')
    setShowLocationModal(false)
    // ページをリロードしてデフォルト位置で天気情報を取得
    window.location.reload()
  }

  // fetchWeather関数をuseEffectの外に移動（モーダルからも呼び出せるように）
  const fetchWeather = async (lat: number, lng: number) => {
    try {
      // キャッシュを確認
      const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < 10 * 60 * 1000) {
            setWeather(data)
            setError(null)
            setLoading(false)
            return
          }
        } catch (error) {
          console.warn('Failed to parse cached weather data:', error)
        }
      }

      // APIから取得
      const fetchWithTimeout = async (promise: Promise<WeatherData | null>, timeout: number): Promise<WeatherData | null> => {
        return Promise.race([
          promise,
          new Promise<WeatherData | null>((resolve) => {
            setTimeout(() => resolve(null), timeout)
          })
        ])
      }

      // Open-Meteo APIを試す
      const fetchWeatherWithOpenMeteo = async (): Promise<WeatherData | null> => {
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Asia/Tokyo&forecast_days=1`
          )
          if (!response.ok) return null
          const data = await response.json()
          if (!data || !data.current) return null

          const weatherCode = data.current.weather_code
          // 現在時刻を取得（日本時間）
          const now = new Date()
          const japanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
          const hour = japanTime.getHours()
          const isNight = hour >= 18 || hour < 6 // 18時〜6時を夜間とする

          const weatherIcons: { [key: number]: { day: string; night: string } } = {
            0: { day: '☀️', night: '🌙' },
            1: { day: '🌤️', night: '☁️' },
            2: { day: '⛅', night: '☁️' },
            3: { day: '☁️', night: '☁️' },
            45: { day: '🌫️', night: '🌫️' },
            48: { day: '🌫️', night: '🌫️' },
            51: { day: '🌦️', night: '🌧️' },
            53: { day: '🌦️', night: '🌧️' },
            55: { day: '🌧️', night: '🌧️' },
            56: { day: '🌨️', night: '🌨️' },
            57: { day: '🌨️', night: '🌨️' },
            61: { day: '🌧️', night: '🌧️' },
            63: { day: '🌧️', night: '🌧️' },
            65: { day: '🌧️', night: '🌧️' },
            66: { day: '🌨️', night: '🌨️' },
            67: { day: '🌨️', night: '🌨️' },
            71: { day: '🌨️', night: '🌨️' },
            73: { day: '🌨️', night: '🌨️' },
            75: { day: '🌨️', night: '🌨️' },
            77: { day: '🌨️', night: '🌨️' },
            80: { day: '🌧️', night: '🌧️' },
            81: { day: '🌧️', night: '🌧️' },
            82: { day: '🌧️', night: '🌧️' },
            85: { day: '🌨️', night: '🌨️' },
            86: { day: '🌨️', night: '🌨️' },
            95: { day: '⛈️', night: '⛈️' },
            96: { day: '⛈️', night: '⛈️' },
            99: { day: '⛈️', night: '⛈️' },
          }

          const getWeatherIcon = (code: number): string => {
            const iconSet = weatherIcons[code]
            if (!iconSet) return '☀️'
            return isNight ? iconSet.night : iconSet.day
          }

          const weatherDescriptions: { [key: number]: string } = {
            0: '快晴', 1: '晴れ', 2: '一部曇り', 3: '曇り', 45: '霧', 48: '霧',
            51: '小雨', 53: '小雨', 55: '強い小雨', 56: '軽い凍雨', 57: '強い凍雨',
            61: '小雨', 63: '雨', 65: '大雨', 66: '軽い凍雨', 67: '強い凍雨',
            71: '小雪', 73: '雪', 75: '大雪', 77: '雪', 80: 'にわか雨',
            81: 'にわか雨', 82: '強いにわか雨', 85: 'にわか雪', 86: '強いにわか雪',
            95: '雷雨', 96: '雷雨', 99: '強い雷雨',
          }

          let locationName = '位置情報取得中'
          try {
            const geocodeResponse = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ja`
            )
            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json()
              if (geocodeData) {
                if (geocodeData.countryCode === 'JP') {
                  locationName = geocodeData.city || geocodeData.locality || geocodeData.principalSubdivision || '日本'
                } else {
                  locationName = geocodeData.city || geocodeData.locality || geocodeData.countryName || '位置情報取得中'
                }
              }
            }
          } catch (error) {
            console.error('Error fetching location name:', error)
            if (lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146) {
              locationName = '日本'
            } else {
              locationName = `${lat.toFixed(2)}, ${lng.toFixed(2)}`
            }
          }

          const weatherData: WeatherData = {
            temperature: Math.round(data.current.temperature_2m),
            condition: weatherDescriptions[weatherCode] || '不明',
            icon: getWeatherIcon(weatherCode),
            location: locationName,
          }

          // キャッシュに保存
          localStorage.setItem(cacheKey, JSON.stringify({
            data: weatherData,
            timestamp: Date.now()
          }))

          return weatherData
        } catch (error) {
          console.error('Error fetching weather from Open-Meteo:', error)
          return null
        }
      }

      let weatherData = await fetchWithTimeout(fetchWeatherWithOpenMeteo(), 8000)

      if (weatherData) {
        setWeather(weatherData)
        setError(null)
      } else {
        setWeather({
          temperature: 0,
          condition: '情報なし',
          icon: '☀️',
          location: '日本'
        })
        setError(null)
      }
    } catch (error) {
      console.error('Error fetching weather:', error)
      setWeather({
        temperature: 0,
        condition: '情報なし',
        icon: '☀️',
        location: '日本'
      })
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* ロゴとサイトタイトル（左寄せ） */}
          <a 
            href="/" 
            onClick={handleLogoClick}
            className="flex items-center gap-2 sm:gap-2.5 hover:opacity-90 transition-opacity cursor-pointer touch-manipulation"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              {/* RemixIcon - お椀アイコン（ランチ用） */}
              <i className="ri-bowl-fill text-white text-lg sm:text-xl"></i>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 whitespace-nowrap">昼食さん</h1>
          </a>

          {/* 天気情報（右寄せ） */}
          <div className="flex items-center flex-shrink-0">
            {loading && !weather ? (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs sm:text-sm hidden sm:inline">取得中...</span>
              </div>
            ) : weather ? (
              <button
                onClick={handleWeatherClick}
                className="flex items-center gap-2 bg-gray-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer touch-manipulation"
                title="位置を設定"
              >
                <span className="text-xl sm:text-2xl leading-none">{weather.icon}</span>
                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm sm:text-base font-semibold text-gray-900 leading-none">{weather.temperature}</span>
                    <span className="text-xs text-gray-600 leading-none">°C</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate max-w-[100px] sm:max-w-none">{weather.location}</span>
                </div>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 位置設定モーダル */}
      {showLocationModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => setShowLocationModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">位置を設定</h3>
              <p className="text-sm text-gray-600">天気情報を表示する位置を設定できます</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  キーワードで検索 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSearchAddress()
                      }
                    }}
                    placeholder="例: 東京タワー、渋谷 駅、大阪 城、新宿駅など（スペース区切りで複数キーワード検索可）"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 text-sm bg-white font-medium"
                  />
                  <button
                    onClick={handleSearchAddress}
                    disabled={searchingAddress || !addressSearch.trim()}
                    className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 min-w-[80px]"
                  >
                    {searchingAddress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>検索中</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-search-line"></i>
                        <span>検索</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">地名、駅名、施設名など、キーワードで検索できます。複数のキーワードをスペース区切りで入力すると、より詳細に検索できます。</p>
              </div>

              {(manualLat || manualLng) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-2">✓ 位置が設定されました</p>
                  {manualLocationName && (
                    <p className="text-xs text-green-700 font-medium">{manualLocationName}</p>
                  )}
                  <p className="text-xs text-green-600 mt-1">
                    緯度: {manualLat}, 経度: {manualLng}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={handleGetCurrentLocation}
                  disabled={savingLocation}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  <i className="ri-map-pin-line"></i>
                  <span>現在位置を取得</span>
                </button>
                <button
                  onClick={handleSaveLocation}
                  disabled={savingLocation || !manualLat || !manualLng}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {savingLocation ? '保存中...' : '保存'}
                </button>
              </div>

              <button
                onClick={handleClearLocation}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                設定をクリア（自動取得に戻す）
              </button>

              <button
                onClick={() => setShowLocationModal(false)}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

