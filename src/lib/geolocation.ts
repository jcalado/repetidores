/**
 * Geolocation utilities for distance calculation and location management
 */

export type UserLocation = {
  latitude: number
  longitude: number
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`
  }
  return `${Math.round(km)} km`
}

// Storage key for caching user location
const LOCATION_STORAGE_KEY = 'user_location'
const LOCATION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Geocoding result from Nominatim API
 */
export type GeocodingResult = {
  lat: string
  lon: string
  display_name: string
  place_id: number
}

/**
 * Search for a location using OpenStreetMap Nominatim API
 * Limited to Portugal for better results
 */
export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return []

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    countrycodes: 'pt', // Limit to Portugal
    addressdetails: '1',
  })

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'Accept': 'application/json',
          // Nominatim requires a User-Agent
          'User-Agent': 'Repetidores-PT/1.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Geocoding error:', error)
    return []
  }
}

/**
 * Get cached user location from localStorage
 */
export function getCachedLocation(): UserLocation | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(LOCATION_STORAGE_KEY)
    if (!cached) return null

    const { location, timestamp } = JSON.parse(cached)

    // Check if cache is still valid
    if (Date.now() - timestamp > LOCATION_CACHE_DURATION) {
      localStorage.removeItem(LOCATION_STORAGE_KEY)
      return null
    }

    return location as UserLocation
  } catch {
    return null
  }
}

/**
 * Cache user location in localStorage
 */
export function cacheLocation(location: UserLocation): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify({
        location,
        timestamp: Date.now(),
      })
    )
  } catch {
    // Ignore storage errors
  }
}
