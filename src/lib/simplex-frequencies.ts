import type { SimplexFrequency } from '@/types/simplex-frequency'

const API_BASE_URL = (() => {
  const source = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000'
  return source.replace(/\/$/, '')
})()

export async function fetchSimplexFrequencies(): Promise<SimplexFrequency[]> {
  const isServer = typeof window === 'undefined'
  const response = await fetch(`${API_BASE_URL}/api/simplex-frequencies/list`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: isServer ? 'force-cache' : 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch simplex frequencies: HTTP ${response.status}`)
  }
  const data = await response.json()
  return Array.isArray(data.docs) ? data.docs : []
}
