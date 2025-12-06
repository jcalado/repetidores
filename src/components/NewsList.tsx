"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { NewsItem } from "@/lib/news"
import { Calendar, ExternalLink, Star, User } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"

interface NewsListProps {
  news: NewsItem[]
  isLoading?: boolean
  showFeaturedBadge?: boolean
}

export default function NewsList({ news, isLoading = false, showFeaturedBadge = true }: NewsListProps) {
  const t = useTranslations("news")

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("noNews")}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {news.map((item) => (
        <NewsCard key={item.id} item={item} showFeaturedBadge={showFeaturedBadge} />
      ))}
    </div>
  )
}

interface NewsCardProps {
  item: NewsItem
  showFeaturedBadge?: boolean
}

function NewsCard({ item, showFeaturedBadge = true }: NewsCardProps) {
  const t = useTranslations("news")

  const formattedDate = new Date(item.publishedDate).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const categoryLabel = item.category ? t(`categories.${item.category}`) : null

  // Get image URL - handle both relative and absolute URLs
  const imageUrl = item.featuredImage?.url
    ? item.featuredImage.url.startsWith("http")
      ? item.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${item.featuredImage.url}`
    : null

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-200">
      {/* Featured Image */}
      {imageUrl && (
        <Link href={`/noticias/${item.slug}`} className="block relative h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={item.featuredImage?.alt || item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {showFeaturedBadge && item.featured && (
            <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600">
              <Star className="h-3 w-3 mr-1" />
              {t("featured")}
            </Badge>
          )}
        </Link>
      )}

      <CardHeader className="pb-2">
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-2">
          {categoryLabel && (
            <Badge variant="secondary" className="text-xs">
              {categoryLabel}
            </Badge>
          )}
          {!imageUrl && showFeaturedBadge && item.featured && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">
              <Star className="h-3 w-3 mr-1" />
              {t("featured")}
            </Badge>
          )}
        </div>

        {/* Title */}
        <CardTitle className="line-clamp-2">
          <Link
            href={`/noticias/${item.slug}`}
            className="hover:text-primary transition-colors"
          >
            {item.title}
          </Link>
        </CardTitle>

        {/* Meta info */}
        <CardDescription className="flex items-center gap-3 text-xs">
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
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {item.excerpt}
        </p>

        {/* Read More Link */}
        <div className="flex items-center justify-between">
          <Link
            href={`/noticias/${item.slug}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("readMore")} →
          </Link>

          {item.externalLink && (
            <a
              href={item.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for landing page
export function NewsListCompact({ news }: { news: NewsItem[] }) {
  const t = useTranslations("news")

  if (news.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">{t("noNews")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {news.map((item) => (
        <Link
          key={item.id}
          href={`/noticias/${item.slug}`}
          className="block group"
        >
          <div className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            {/* Thumbnail */}
            {item.featuredImage?.url && (
              <div className="relative h-16 w-24 rounded-md overflow-hidden shrink-0">
                <Image
                  src={
                    item.featuredImage.url.startsWith("http")
                      ? item.featuredImage.url
                      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${item.featuredImage.url}`
                  }
                  alt={item.featuredImage.alt || item.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(item.publishedDate).toLocaleDateString("pt-PT", {
                  day: "numeric",
                  month: "short",
                })}
                {item.author && ` • ${item.author}`}
              </p>
            </div>

            {/* Featured indicator */}
            {item.featured && (
              <Star className="h-4 w-4 text-amber-500 shrink-0" />
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
