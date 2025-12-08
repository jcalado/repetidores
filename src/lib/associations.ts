import type { Repeater } from '@/app/columns'

export interface Association {
  id: number
  name: string
  abbreviation: string
  slug: string
  address?: string
  website?: string
  email?: string
  description?: unknown // Rich text (Lexical JSON)
  logo?: {
    id: number
    url: string
    alt?: string
  }
  repeaterCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface AssociationWithRepeaters extends Association {
  repeaters: Repeater[]
}

const getApiBaseUrl = () => {
  const source =
    process.env.PAYLOAD_API_BASE_URL ||
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
    'http://localhost:3000'
  return source.replace(/\/$/, '')
}

export async function fetchAssociations(): Promise<Association[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/associations/list`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch associations: HTTP ${response.status}`)
  }

  const data = await response.json()
  return data.docs || []
}

export async function fetchAssociationBySlug(
  slug: string
): Promise<AssociationWithRepeaters | null> {
  const response = await fetch(`${getApiBaseUrl()}/api/associations/${slug}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Failed to fetch association: HTTP ${response.status}`)
  }

  return response.json()
}

export async function fetchAllAssociationSlugs(): Promise<string[]> {
  const associations = await fetchAssociations()
  return associations.map((a) => a.slug)
}
