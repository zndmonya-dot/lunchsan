import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    )
  }

  try {
    // OpenStreetMapのNominatim APIを使用（無料、APIキー不要）
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=jp&addressdetails=1&accept-language=ja`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LunchSan/1.0',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding API error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

