// 場所の候補の型定義
export interface LocationCandidate {
  id: string
  name: string
  type: 'text' | 'restaurant'
  restaurantId?: string | null
  restaurantName?: string | null
  restaurantAddress?: string | null
}

// レストラン情報の型定義
export interface RestaurantInfo {
  id: string
  name: string
  address: string
  place_id?: string | null
}

