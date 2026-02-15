export interface AutoCheckEntry {
  source: 'brandmeister' | 'allstar' | 'echolink'
  isOnline: boolean
  lastSeen: string | null
  checkedAt: string
}

export interface RepeaterAutoStatus {
  isOnline: boolean
  lastSeen: string | null
  sources: AutoCheckEntry[]
}

export type AutoStatusMap = Record<string, RepeaterAutoStatus>

const API_BASE_URL = (() => {
  const source =
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
    process.env.PAYLOAD_API_BASE_URL ||
    'http://localhost:3000'
  return source.replace(/\/$/, '')
})()

// Cache for bulk auto status (shared across components)
let cachedAutoStatus: AutoStatusMap | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getAllAutoStatus(): Promise<AutoStatusMap> {
  const now = Date.now()
  if (cachedAutoStatus && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedAutoStatus
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auto-status`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    cachedAutoStatus = data
    cacheTimestamp = now
    return data
  } catch {
    return cachedAutoStatus ?? {}
  }
}
