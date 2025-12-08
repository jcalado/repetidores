import { MetadataRoute } from 'next'

const BASE_URL = 'https://repetidores.jcalado.com'

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

async function fetchAllEventIds(): Promise<string[]> {
  const baseUrl = getApiBaseUrl()

  try {
    const response = await fetch(`${baseUrl}/api/events/list?limit=500`)
    if (!response.ok) return []

    const data = await response.json()
    return (data.docs || []).map((event: { id: string }) => event.id)
  } catch (error) {
    console.error('[Sitemap] Error fetching events:', error)
    return []
  }
}

async function fetchAllNewsSlugs(): Promise<string[]> {
  const baseUrl = getApiBaseUrl()

  try {
    const params = new URLSearchParams({
      'where[status][equals]': 'published',
      limit: '1000',
    })

    const response = await fetch(`${baseUrl}/api/news?${params}`)
    if (!response.ok) return []

    const data = await response.json()
    return (data.docs || []).map((item: { slug: string }) => item.slug)
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
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/repetidores`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/noticias`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/bands`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/qth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/propagation`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Fetch dynamic content in parallel
  const [repeaterCallsigns, eventIds, newsSlugs, associationSlugs] = await Promise.all([
    fetchAllRepeaterCallsigns(),
    fetchAllEventIds(),
    fetchAllNewsSlugs(),
    fetchAllAssociationSlugs(),
  ])

  // Repeater pages
  const repeaterPages: MetadataRoute.Sitemap = repeaterCallsigns.map((callsign) => ({
    url: `${BASE_URL}/repeater/${encodeURIComponent(callsign)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Event pages
  const eventPages: MetadataRoute.Sitemap = eventIds.map((id) => ({
    url: `${BASE_URL}/events/${encodeURIComponent(id)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // News pages
  const newsPages: MetadataRoute.Sitemap = newsSlugs.map((slug) => ({
    url: `${BASE_URL}/noticias/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Association pages
  const associationPages: MetadataRoute.Sitemap = associationSlugs.map((slug) => ({
    url: `${BASE_URL}/association/${slug}`,
    lastModified: new Date(),
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
