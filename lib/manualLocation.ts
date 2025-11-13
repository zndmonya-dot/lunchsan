export interface ManualLocation {
  lat: number
  lng: number
  locationName?: string
}

export const MANUAL_LOCATION_STORAGE_KEY = 'manual_location'
export const MANUAL_LOCATION_EVENT = 'locationUpdated'

export function parseManualLocation(value: string | null): ManualLocation | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as ManualLocation
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return parsed
    }
  } catch (error) {
    console.warn('Failed to parse manual location:', error)
  }
  return null
}

export function getManualLocation(): ManualLocation | null {
  if (typeof window === 'undefined') return null
  return parseManualLocation(localStorage.getItem(MANUAL_LOCATION_STORAGE_KEY))
}

export function setManualLocation(location: ManualLocation) {
  if (typeof window === 'undefined') return
  localStorage.setItem(MANUAL_LOCATION_STORAGE_KEY, JSON.stringify(location))
  window.dispatchEvent(new CustomEvent<ManualLocation>(MANUAL_LOCATION_EVENT, { detail: location }))
}

export type ManualLocationListener = (location: ManualLocation | null, event?: Event) => void

export function subscribeManualLocation(listener: ManualLocationListener) {
  if (typeof window === 'undefined') return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key === MANUAL_LOCATION_STORAGE_KEY) {
      listener(parseManualLocation(event.newValue), event)
    }
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<ManualLocation>
    if (customEvent.detail) {
      listener(customEvent.detail, customEvent)
    } else {
      listener(getManualLocation(), event)
    }
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(MANUAL_LOCATION_EVENT, handleCustomEvent as EventListener)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(MANUAL_LOCATION_EVENT, handleCustomEvent as EventListener)
  }
}

export function clearManualLocation() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(MANUAL_LOCATION_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent<ManualLocation | null>(MANUAL_LOCATION_EVENT, { detail: null }))
}

