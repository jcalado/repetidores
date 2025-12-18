export interface NewsItem {
  id: string
  title: string
  slug: string
  excerpt: string
  content: unknown // Rich text content (Lexical JSON)
  featuredImage?: {
    id: string
    url: string
    alt: string
    width?: number
    height?: number
  }
  publishedDate: string
  author?: string
  category?: 'announcement' | 'news' | 'event' | 'technical'
  featured: boolean
  externalLink?: string
  createdAt?: string
  updatedAt?: string
}

export interface NewsListResponse {
  docs: NewsItem[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface FeaturedNewsResponse {
  docs: Omit<NewsItem, 'content' | 'createdAt' | 'updatedAt'>[]
}

const getApiBaseUrl = () => {
  const source =
    process.env.PAYLOAD_API_BASE_URL ||
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
    'http://localhost:3000'
  return source.replace(/\/$/, '')
}

export interface FetchNewsOptions {
  limit?: number
  page?: number
  sort?: 'dateAsc' | 'dateDesc'
  category?: string
  search?: string
}

export async function fetchNews(options: FetchNewsOptions = {}): Promise<NewsListResponse> {
  const params = new URLSearchParams({
    limit: String(options.limit ?? 20),
    page: String(options.page ?? 1),
    sort: options.sort ?? 'dateDesc',
  })

  if (options.category) {
    params.set('category', options.category)
  }

  if (options.search) {
    params.set('search', options.search)
  }

  const response = await fetch(`${getApiBaseUrl()}/api/news/list?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch news: HTTP ${response.status}`)
  }

  return response.json()
}

export async function fetchFeaturedNews(): Promise<FeaturedNewsResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/news/featured`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch featured news: HTTP ${response.status}`)
  }

  return response.json()
}

export async function fetchNewsBySlug(slug: string): Promise<NewsItem | null> {
  // Use Payload's REST API to find news by slug
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    limit: '1',
  })

  const response = await fetch(`${getApiBaseUrl()}/api/news?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch news by slug: HTTP ${response.status}`)
  }

  const data = await response.json()
  return data.docs?.[0] || null
}

export async function fetchAllNewsSlugs(): Promise<string[]> {
  const params = new URLSearchParams({
    'where[status][equals]': 'published',
    limit: '1000',
  })

  const response = await fetch(`${getApiBaseUrl()}/api/news?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data.docs?.map((item: { slug: string }) => item.slug) || []
}
