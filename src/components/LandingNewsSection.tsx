"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { NewsItem } from "@/lib/news"
import { ArrowRight, Calendar, Newspaper, Star, User } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"

export default function LandingNewsSection() {
  const t = useTranslations()
  const [news, setNews] = React.useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchNews() {
      try {
        const apiBaseUrl = (
          process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || "http://localhost:3000"
        ).replace(/\/$/, "")

        const response = await fetch(`${apiBaseUrl}/api/news/featured`)
        if (response.ok) {
          const data = await response.json()
          setNews(data.docs || [])
        }
      } catch (error) {
        console.error("Failed to fetch news:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [])

  // Don't render if no news and not loading
  if (!isLoading && news.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
            <Newspaper className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("landing.newsTitle")}
          </h2>
        </div>
        <Link
          href="/noticias"
          className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
        >
          {t("landing.viewAllNews")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* News Grid */}
      {!isLoading && news.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {news.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  const t = useTranslations("news")

  const formattedDate = new Date(item.publishedDate).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
  })

  const categoryLabel = item.category ? t(`categories.${item.category}`) : null

  // Get image URL
  const imageUrl = item.featuredImage?.url
    ? item.featuredImage.url.startsWith("http")
      ? item.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${item.featuredImage.url}`
    : null

  return (
    <Link href={`/noticias/${item.slug}/`} className="group block">
      <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
        {/* Image */}
        {imageUrl && (
          <div className="relative h-32 overflow-hidden">
            <Image
              src={imageUrl}
              alt={item.featuredImage?.alt || item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {item.featured && (
              <div className="absolute top-2 right-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              </div>
            )}
          </div>
        )}

        <CardHeader className="pb-2">
          {/* Category */}
          {categoryLabel && (
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {categoryLabel}
            </span>
          )}

          {/* Title */}
          <CardTitle className="text-base line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            {item.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
            {item.author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {item.author}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
