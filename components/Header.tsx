'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

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
        const weatherIcons: { [key: number]: string } = {
          0: '☀️', // Clear sky
          1: '🌤️', // Mainly clear
          2: '⛅', // Partly cloudy
          3: '☁️', // Overcast
          45: '🌫️', // Fog
          48: '🌫️', // Depositing rime fog
          51: '🌦️', // Light drizzle
          53: '🌦️', // Moderate drizzle
          55: '🌧️', // Dense drizzle
          56: '🌨️', // Light freezing drizzle
          57: '🌨️', // Dense freezing drizzle
          61: '🌧️', // Slight rain
          63: '🌧️', // Moderate rain
          65: '🌧️', // Heavy rain
          66: '🌨️', // Light freezing rain
          67: '🌨️', // Heavy freezing rain
          71: '🌨️', // Slight snow fall
          73: '🌨️', // Moderate snow fall
          75: '🌨️', // Heavy snow fall
          77: '🌨️', // Snow grains
          80: '🌧️', // Slight rain showers
          81: '🌧️', // Moderate rain showers
          82: '🌧️', // Violent rain showers
          85: '🌨️', // Slight snow showers
          86: '🌨️', // Heavy snow showers
          95: '⛈️', // Thunderstorm
          96: '⛈️', // Thunderstorm with slight hail
          99: '⛈️', // Thunderstorm with heavy hail
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
          icon: weatherIcons[weatherCode] || '☀️',
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

    // 位置情報を取得（タイムアウトを短くして、確実にローディングを解除）
    let timeoutId: NodeJS.Timeout | null = null
    let geolocationTimeoutId: NodeJS.Timeout | null = null

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
              <div className="flex items-center gap-2 bg-gray-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200">
                <span className="text-xl sm:text-2xl leading-none">{weather.icon}</span>
                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm sm:text-base font-semibold text-gray-900 leading-none">{weather.temperature}</span>
                    <span className="text-xs text-gray-600 leading-none">°C</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate max-w-[100px] sm:max-w-none">{weather.location}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

