import NewsList from "@/components/NewsList"
import { fetchNews, type NewsItem } from "@/lib/news"
import { Newspaper, Rss } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-b from-ship-cove-50/50 via-background to-background dark:from-ship-cove-950/30 dark:via-background dark:to-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-ship-cove-600 via-ship-cove-700 to-ship-cove-800 dark:from-ship-cove-800 dark:via-ship-cove-900 dark:to-ship-cove-950 p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-ship-cove-500/20">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-news" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-news)" className="text-white" />
            </svg>
          </div>

          {/* Decorative blur */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-ship-cove-500/20 blur-2xl" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {t("title")}
                    </h1>
                    <p className="text-sm text-ship-cove-200">
                      {t("description")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats pill */}
              {news.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                  <Rss className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-medium text-white">
                    {news.length} {news.length === 1 ? "notícia" : "notícias"}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* News Grid */}
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
