import NewsList from "@/components/NewsList"
import { fetchNews, type NewsItem } from "@/lib/news"
import { Newspaper } from "lucide-react"
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Newspaper className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("description")}</p>
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
