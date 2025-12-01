/**
 * Favorites system using localStorage
 */

const FAVORITES_KEY = 'repeater_favorites'

/**
 * Get all favorited repeater callsigns
 */
export function getFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set()

  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    if (!stored) return new Set()
    return new Set(JSON.parse(stored))
  } catch {
    return new Set()
  }
}

/**
 * Check if a repeater is favorited
 */
export function isFavorite(callsign: string): boolean {
  return getFavorites().has(callsign)
}

/**
 * Toggle favorite status for a repeater
 * @returns The new favorite status (true if added, false if removed)
 */
export function toggleFavorite(callsign: string): boolean {
  const favorites = getFavorites()
  const wasSet = favorites.has(callsign)

  if (wasSet) {
    favorites.delete(callsign)
  } else {
    favorites.add(callsign)
  }

  saveFavorites(favorites)
  return !wasSet
}

/**
 * Add a repeater to favorites
 */
export function addFavorite(callsign: string): void {
  const favorites = getFavorites()
  favorites.add(callsign)
  saveFavorites(favorites)
}

/**
 * Remove a repeater from favorites
 */
export function removeFavorite(callsign: string): void {
  const favorites = getFavorites()
  favorites.delete(callsign)
  saveFavorites(favorites)
}

/**
 * Save favorites to localStorage
 */
function saveFavorites(favorites: Set<string>): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Export favorites as JSON string
 */
export function exportFavorites(): string {
  const favorites = getFavorites()
  return JSON.stringify([...favorites], null, 2)
}

/**
 * Import favorites from JSON string
 * @returns Number of favorites imported
 */
export function importFavorites(json: string): number {
  try {
    const imported = JSON.parse(json)
    if (!Array.isArray(imported)) {
      throw new Error('Invalid format')
    }
    const favorites = getFavorites()
    let count = 0
    for (const callsign of imported) {
      if (typeof callsign === 'string' && !favorites.has(callsign)) {
        favorites.add(callsign)
        count++
      }
    }
    saveFavorites(favorites)
    return count
  } catch {
    return 0
  }
}
