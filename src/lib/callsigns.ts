import type {
  Callsign,
  CallsignChange,
  CallsignStats,
  CallsignTrends,
  PaginatedCallsignResponse,
} from '@/types/callsign'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000'
  }
  return process.env.PAYLOAD_API_BASE_URL || 'http://localhost:3000'
}

export interface CallsignListParams {
  page?: number
  limit?: number
  distrito?: string
  categoria?: string
  estado?: string
  concelho?: string
  search?: string
}

export async function fetchCallsigns(
  params: CallsignListParams = {},
): Promise<PaginatedCallsignResponse<Callsign>> {
  const base = getApiBaseUrl()
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.distrito) searchParams.set('distrito', params.distrito)
  if (params.categoria) searchParams.set('categoria', params.categoria)
  if (params.estado) searchParams.set('estado', params.estado)
  if (params.concelho) searchParams.set('concelho', params.concelho)
  if (params.search) searchParams.set('search', params.search)

  const qs = searchParams.toString()
  const url = `${base}/api/indicativos/list${qs ? `?${qs}` : ''}`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Failed to fetch callsigns: ${res.status}`)
  return res.json()
}

export async function fetchCallsignStats(): Promise<CallsignStats> {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/indicativos/stats`)
  if (!res.ok) throw new Error(`Failed to fetch callsign stats: ${res.status}`)
  return res.json()
}

export async function fetchCallsignChanges(params: {
  page?: number
  limit?: number
  changeType?: string
  indicativo?: string
} = {}): Promise<PaginatedCallsignResponse<CallsignChange>> {
  const base = getApiBaseUrl()
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.changeType) searchParams.set('changeType', params.changeType)
  if (params.indicativo) searchParams.set('indicativo', params.indicativo)

  const qs = searchParams.toString()
  const url = `${base}/api/indicativos/changes${qs ? `?${qs}` : ''}`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Failed to fetch callsign changes: ${res.status}`)
  return res.json()
}

export async function fetchCallsignTrends(params?: {
  startDate?: string
  endDate?: string
  distrito?: string
  categoria?: string
  estado?: string
  search?: string
}): Promise<CallsignTrends> {
  const base = getApiBaseUrl()
  const searchParams = new URLSearchParams()
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)
  if (params?.distrito) searchParams.set('distrito', params.distrito)
  if (params?.categoria) searchParams.set('categoria', params.categoria)
  if (params?.estado) searchParams.set('estado', params.estado)
  if (params?.search) searchParams.set('search', params.search)
  const qs = searchParams.toString()
  const url = `${base}/api/indicativos/trends${qs ? `?${qs}` : ''}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Failed to fetch callsign trends: ${res.status}`)
  return res.json()
}

export async function searchCallsigns(query: string): Promise<Callsign[]> {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/indicativos/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`Failed to search callsigns: ${res.status}`)
  const data = await res.json()
  return data.docs
}
