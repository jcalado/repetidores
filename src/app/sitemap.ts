import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const BASE_URL = 'https://www.radioamador.info'

function getApiBaseUrl(): string {
  const source =
    process.env.PAYLOAD_API_BASE_URL ||
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
    'http://localhost:3000'
  return source.replace(/\/$/, '')
}

async function fetchAllRepeaterCallsigns(): Promise<string[]> {
  const baseUrl = getApiBaseUrl()
  const callsigns: string[] = []

  try {
    let page = 1
    while (true) {
      const params = new URLSearchParams({
        limit: '200',
        page: page.toString(),
      })

      const response = await fetch(`${baseUrl}/api/repeaters?${params}`)
      if (!response.ok) break

      const data = await response.json()
      const docs = Array.isArray(data.docs) ? data.docs : []

      for (const doc of docs) {
        if (typeof doc.callsign === 'string' && doc.callsign) {
          callsigns.push(doc.callsign)
        }
      }

      if (!data.hasNextPage || docs.length === 0) break
      page++
    }
  } catch (error) {
    console.error('[Sitemap] Error fetching repeaters:', error)
  }

  return callsigns
}

interface EventEntry {
  id: string
  updatedAt?: string
}

async function fetchAllEventIds(): Promise<EventEntry[]> {
  const baseUrl = getApiBaseUrl()

  try {
    const response = await fetch(`${baseUrl}/api/events/list?limit=500`)
    if (!response.ok) return []

    const data = await response.json()
    return (data.docs || []).map((event: { id: string; updatedAt?: string }) => ({
      id: event.id,
      updatedAt: event.updatedAt,
    }))
  } catch (error) {
    console.error('[Sitemap] Error fetching events:', error)
    return []
  }
}

interface NewsEntry {
  slug: string
  updatedAt?: string
}

async function fetchAllNewsSlugs(): Promise<NewsEntry[]> {
  const baseUrl = getApiBaseUrl()

  try {
    const params = new URLSearchParams({
      'where[status][equals]': 'published',
      limit: '1000',
    })

    const response = await fetch(`${baseUrl}/api/news?${params}`)
    if (!response.ok) return []

    const data = await response.json()
    return (data.docs || []).map((item: { slug: string; updatedAt?: string }) => ({
      slug: item.slug,
      updatedAt: item.updatedAt,
    }))
  } catch (error) {
    console.error('[Sitemap] Error fetching news:', error)
    return []
  }
}

async function fetchAllAssociationSlugs(): Promise<string[]> {
  const baseUrl = getApiBaseUrl()

  try {
    const response = await fetch(`${baseUrl}/api/associations/list`)
    if (!response.ok) return []

    const data = await response.json()
    return (data.docs || []).map((item: { slug: string }) => item.slug)
  } catch (error) {
    console.error('[Sitemap] Error fetching associations:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    // Main pages
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/repetidores/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/repetidores/mapa/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/repetidores/proximo/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/events/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/noticias/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/associations/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Reference tools
    {
      url: `${BASE_URL}/bands/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/qth/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/propagation/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/utc/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/nato/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/qcodes/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/morse/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/antenna/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Satellite pages
    {
      url: `${BASE_URL}/satelites/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/iss/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    // Calculators
    {
      url: `${BASE_URL}/calculadoras/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/calculadoras/db/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/calculadoras/swr/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/calculadoras/coax/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/calculadoras/frequencia/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/calculadoras/power/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/calculadoras/distance/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/calculadoras/los/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Info pages
    {
      url: `${BASE_URL}/about/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Fetch dynamic content in parallel
  const [repeaterCallsigns, eventEntries, newsEntries, associationSlugs] = await Promise.all([
    fetchAllRepeaterCallsigns(),
    fetchAllEventIds(),
    fetchAllNewsSlugs(),
    fetchAllAssociationSlugs(),
  ])

  // Repeater pages
  const repeaterPages: MetadataRoute.Sitemap = repeaterCallsigns.map((callsign) => ({
    url: `${BASE_URL}/repeater/${encodeURIComponent(callsign)}/`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Event pages - use real updatedAt when available
  const eventPages: MetadataRoute.Sitemap = eventEntries.map((entry) => ({
    url: `${BASE_URL}/events/${encodeURIComponent(entry.id)}/`,
    lastModified: entry.updatedAt ? new Date(entry.updatedAt) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // News pages - use real updatedAt when available
  const newsPages: MetadataRoute.Sitemap = newsEntries.map((entry) => ({
    url: `${BASE_URL}/noticias/${entry.slug}/`,
    lastModified: entry.updatedAt ? new Date(entry.updatedAt) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Association pages
  const associationPages: MetadataRoute.Sitemap = associationSlugs.map((slug) => ({
    url: `${BASE_URL}/association/${slug}/`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...repeaterPages,
    ...eventPages,
    ...newsPages,
    ...associationPages,
  ]
}
