import { useState, useCallback } from 'react'
import { LocationCandidate, RestaurantInfo } from '@/lib/types/locationCandidate'

/**
 * 場所の候補を管理するカスタムフック
 */
export function useLocationCandidates(initialCandidates: LocationCandidate[] = []) {
  const [locationCandidates, setLocationCandidates] = useState<LocationCandidate[]>(initialCandidates)
  const [addedRestaurantIds, setAddedRestaurantIds] = useState<Set<string>>(new Set())

  // 候補を削除する関数
  const removeCandidate = useCallback((id: string) => {
    setLocationCandidates((prevCandidates) => {
      const candidate = prevCandidates.find((c) => c.id === id)
      if (candidate && candidate.restaurantId) {
        setAddedRestaurantIds((prevIds) => {
          const newSet = new Set(prevIds)
          newSet.delete(candidate.restaurantId!)
          return newSet
        })
      }
      return prevCandidates.filter((c) => c.id !== id)
    })
  }, [])

  // レストラン候補を追加/解除する関数
  const toggleRestaurantCandidate = useCallback((restaurant: RestaurantInfo) => {
    const restaurantId = restaurant.place_id || restaurant.id
    
    setLocationCandidates((prevCandidates) => {
      // 既に同じお店が追加されているかチェック
      const existing = prevCandidates.find((c) => {
        const candidateRestaurantId = c.restaurantId
        return (
          candidateRestaurantId === restaurantId ||
          candidateRestaurantId === restaurant.place_id ||
          candidateRestaurantId === restaurant.id
        )
      })

      if (existing) {
        // 既に追加されている場合は解除
        if (existing.restaurantId) {
          setAddedRestaurantIds((prevIds) => {
            const newSet = new Set(prevIds)
            newSet.delete(existing.restaurantId!)
            return newSet
          })
        }
        return prevCandidates.filter((c) => c.id !== existing.id)
      }

      // 新規追加
      const candidate: LocationCandidate = {
        id: `temp-restaurant-${Date.now()}`,
        name: restaurant.name,
        type: 'restaurant',
        restaurantId: restaurant.place_id || restaurant.id,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
      }
      
      setAddedRestaurantIds((prevIds) => new Set([...prevIds, restaurantId]))
      return [...prevCandidates, candidate]
    })
  }, [])

  // テキスト候補を追加する関数
  const addTextCandidate = useCallback((name: string) => {
    const candidate: LocationCandidate = {
      id: `temp-${Date.now()}`,
      name,
      type: 'text',
    }
    setLocationCandidates((prev) => [...prev, candidate])
  }, [])

  // 候補リストをリセットする関数
  const resetCandidates = useCallback((candidates: LocationCandidate[]) => {
    setLocationCandidates(candidates)
    // レストランIDのセットも更新
    const restaurantIds = new Set<string>()
    candidates.forEach((c) => {
      if (c.restaurantId) {
        restaurantIds.add(c.restaurantId)
      }
    })
    setAddedRestaurantIds(restaurantIds)
  }, [])

  return {
    locationCandidates,
    addedRestaurantIds,
    removeCandidate,
    toggleRestaurantCandidate,
    addTextCandidate,
    resetCandidates,
    setLocationCandidates,
  }
}

