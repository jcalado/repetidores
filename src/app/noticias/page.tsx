import NewsList from "@/components/NewsList"
import { Card, CardContent } from "@/components/ui/card"
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
  const news = await getNews()

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <Card>
        <CardContent>
          <NewsList news={news} />
        </CardContent>
      </Card>
    </main>
  )
}

export async function generateMetadata() {
  const t = await getTranslations("news")
  const title = t("title")
  const description = t("description")

  return {
    title,
    description,
    keywords: ["notícias", "radioamador", "ham radio", "Portugal", "novidades"],
    alternates: {
      canonical: "/noticias/",
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/noticias/",
      siteName: "Radioamador.info",
      locale: "pt_PT",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/og-default.png"],
    },
  }
}
