import NewsList from "@/components/NewsList"
import { fetchNews, type NewsItem } from "@/lib/news"
import { getTranslations } from "next-intl/server"

async function getNews(): Promise<NewsItem[]> {
  try {
    const response = await fetchNews({ limit: 50 })
    return response.docs || []
  } catch (error) {
    console.error("[NewsPage] Error fetching news:", error)
    return []
  }
}

export default async function NewsPage() {
  const [news, t] = await Promise.all([
    getNews(),
    getTranslations("news"),
  ])

  return (
    <div className="min-h-screen bg-white dark:bg-ship-cove-950">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <header className="mb-10 sm:mb-14 lg:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ship-cove-900 dark:text-ship-cove-50 tracking-tight mb-3">
            {t("title")}
          </h1>
          <p className="text-lg sm:text-xl text-ship-cove-600 dark:text-ship-cove-400 max-w-2xl">
            {t("description")}
          </p>
          <div className="mt-6 h-1 w-16 bg-ship-cove-600 dark:bg-ship-cove-400 rounded-full" />
        </header>

        {/* News */}
        <NewsList news={news} />
      </div>
    </div>
  )
}

export async function generateMetadata() {
  const t = await getTranslations("news")
  const title = t("title")
  const description = t("description")

  return {
    title,
    description,
    alternates: {
      canonical: "/noticias",
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/noticias",
      siteName: "Repetidores",
      locale: "pt_PT",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}
