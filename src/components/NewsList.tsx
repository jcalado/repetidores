"use client"

import type { NewsItem } from "@/lib/news"
import { cn } from "@/lib/utils"
import { Calendar, ChevronRight, ExternalLink, Newspaper, Star, User } from "lucide-react"
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
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-300 to-transparent opacity-60" />
            <div className="h-48 bg-ship-cove-100 dark:bg-ship-cove-800 animate-pulse" />
            <div className="p-4">
              <div className="h-4 w-20 bg-ship-cove-100 dark:bg-ship-cove-800 rounded animate-pulse mb-3" />
              <div className="h-6 w-3/4 bg-ship-cove-100 dark:bg-ship-cove-800 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-ship-cove-100 dark:bg-ship-cove-800 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-ship-cove-100 dark:bg-ship-cove-800 rounded animate-pulse" />
                <div className="h-3 w-full bg-ship-cove-100 dark:bg-ship-cove-800 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-ship-cove-100 dark:bg-ship-cove-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-400 to-transparent opacity-60" />
        <div className="py-12 sm:py-16 text-center">
          <div className="flex h-16 w-16 mx-auto mb-4 items-center justify-center rounded-2xl bg-ship-cove-100 dark:bg-ship-cove-800">
            <Newspaper className="h-8 w-8 text-ship-cove-400" />
          </div>
          <p className="text-sm sm:text-base text-ship-cove-600 dark:text-ship-cove-400 font-medium">
            {t("noNews")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {news.map((item, index) => (
        <NewsCard key={item.id} item={item} showFeaturedBadge={showFeaturedBadge} index={index} />
      ))}
    </div>
  )
}

interface NewsCardProps {
  item: NewsItem
  showFeaturedBadge?: boolean
  index: number
}

function NewsCard({ item, showFeaturedBadge = true, index }: NewsCardProps) {
  const t = useTranslations("news")

  const formattedDate = new Date(item.publishedDate).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const categoryLabel = item.category ? t(`categories.${item.category}`) : null

  const imageUrl = item.featuredImage?.url
    ? item.featuredImage.url.startsWith("http")
      ? item.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${item.featuredImage.url}`
    : null

  return (
    <Link
      href={`/noticias/${item.slug}`}
      className={cn(
        "group block relative overflow-hidden rounded-xl border transition-all hover:shadow-lg",
        item.featured
          ? "border-amber-300 dark:border-amber-700/50 bg-gradient-to-br from-amber-50/50 via-white to-ship-cove-50/50 dark:from-amber-950/20 dark:via-ship-cove-950 dark:to-ship-cove-900/30"
          : "border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Top accent */}
      <div className={cn(
        "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent to-transparent opacity-60",
        item.featured ? "via-amber-500" : "via-ship-cove-500"
      )} />

      {/* Featured Image */}
      {imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={item.featuredImage?.alt || item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Featured badge on image */}
          {showFeaturedBadge && item.featured && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium">
              <Star className="h-3 w-3" />
              {t("featured")}
            </div>
          )}

          {/* Category badge on image */}
          {categoryLabel && (
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-ship-cove-900/70 backdrop-blur-sm text-white text-xs font-medium">
              {categoryLabel}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Category badge (when no image) */}
        {!imageUrl && (
          <div className="flex items-center gap-2 mb-3">
            {categoryLabel && (
              <span className="px-2 py-0.5 rounded-md bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-600 dark:text-ship-cove-400 text-xs font-medium">
                {categoryLabel}
              </span>
            )}
            {showFeaturedBadge && item.featured && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
                <Star className="h-3 w-3" />
                {t("featured")}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-ship-cove-900 dark:text-ship-cove-100 line-clamp-2 mb-2 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors">
          {item.title}
        </h3>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-ship-cove-500 mb-3">
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

        {/* Excerpt */}
        <p className="text-sm text-ship-cove-600 dark:text-ship-cove-400 line-clamp-3 mb-4">
          {item.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-ship-cove-100 dark:border-ship-cove-800/50">
          <span className="text-xs font-medium text-ship-cove-600 dark:text-ship-cove-400 group-hover:text-ship-cove-700 dark:group-hover:text-ship-cove-300 flex items-center gap-1 transition-colors">
            {t("readMore")}
            <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </span>

          {item.externalLink && (
            <a
              href={item.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-ship-cove-400 hover:text-ship-cove-600 dark:hover:text-ship-cove-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

    </Link>
  )
}

// Compact version for landing page
export function NewsListCompact({ news }: { news: NewsItem[] }) {
  const t = useTranslations("news")

  if (news.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-ship-cove-500">{t("noNews")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {news.map((item) => (
        <Link
          key={item.id}
          href={`/noticias/${item.slug}`}
          className="group block relative overflow-hidden rounded-lg border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-r from-white to-ship-cove-50/30 dark:from-ship-cove-950 dark:to-ship-cove-900/20 hover:border-ship-cove-300 dark:hover:border-ship-cove-700 transition-colors"
        >
          <div className="flex gap-3 p-3">
            {/* Thumbnail */}
            {item.featuredImage?.url && (
              <div className="relative h-16 w-24 rounded-lg overflow-hidden shrink-0">
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
              <h4 className="font-medium text-sm text-ship-cove-900 dark:text-ship-cove-100 line-clamp-2 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-ship-cove-500 mt-1">
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
