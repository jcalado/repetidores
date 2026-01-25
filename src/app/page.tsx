import type { NewsItem } from '@/lib/news'
import LandingPageClient from './LandingPageClient'

async function fetchFeaturedNews(): Promise<NewsItem[]> {
    const apiBaseUrl = (
        process.env.PAYLOAD_API_BASE_URL ||
        process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
        'http://localhost:3000'
    ).replace(/\/$/, '')

    try {
        const response = await fetch(`${apiBaseUrl}/api/news/featured`, {
            next: { revalidate: 3600 } // Revalidate every hour
        })
        if (!response.ok) return []
        const data = await response.json()
        return data.docs || []
    } catch (error) {
        console.error('Failed to fetch featured news:', error)
        return []
    }
}

export default async function LandingPage() {
    const news = await fetchFeaturedNews()
    return <LandingPageClient initialNews={news} />
}
