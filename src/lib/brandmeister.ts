export type BMTalkgroupType = 'static' | 'cluster' | 'timed' | 'dynamic'

export interface BMTalkgroupEntry {
  tgId: number
  name?: string
  type: BMTalkgroupType
  slot: number
  extTalkgroup?: number
  days?: string
  startTime?: string
  endTime?: string
}

export interface BMBlockedEntry {
  tgId: number
  slot: '1' | '2' | 'both'
}

export interface BMProfileResponse {
  talkgroups: BMTalkgroupEntry[]
  blocked: BMBlockedEntry[]
  cached?: boolean
  stale?: boolean
  error?: string
}

export interface BMProfileBySlot {
  ts1: BMTalkgroupEntry[]
  ts2: BMTalkgroupEntry[]
  blocked: BMBlockedEntry[]
}

const API_BASE_URL = (() => {
  const source =
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
    process.env.PAYLOAD_API_BASE_URL ||
    'http://localhost:3000'
  return source.replace(/\/$/, '')
})()

// Client-side cache
let cachedProfile: Map<number, { data: BMProfileBySlot; fetchedAt: number }> = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function organizeBySlot(profile: BMProfileResponse): BMProfileBySlot {
  return {
    ts1: profile.talkgroups.filter((tg) => tg.slot === 1),
    ts2: profile.talkgroups.filter((tg) => tg.slot === 2),
    blocked: profile.blocked,
  }
}

export async function getBrandmeisterProfile(dmrId: number): Promise<BMProfileBySlot | null> {
  const now = Date.now()
  const cached = cachedProfile.get(dmrId)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/brandmeister/profile/${dmrId}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as BMProfileResponse
    const organized = organizeBySlot(data)
    cachedProfile.set(dmrId, { data: organized, fetchedAt: now })
    return organized
  } catch {
    // Return stale cache if available
    if (cached) return cached.data
    return null
  }
}
