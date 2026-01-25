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
      <div className="space-y-8">
        {/* Hero skeleton */}
        <div className="relative aspect-[21/9] rounded-2xl bg-ship-cove-100 dark:bg-ship-cove-800 animate-pulse" />
        {/* Grid skeleton */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[16/10] rounded-xl bg-ship-cove-100 dark:bg-ship-cove-800 animate-pulse" />
              <div className="h-4 w-24 bg-ship-cove-100 dark:bg-ship-cove-800 rounded animate-pulse" />
              <div className="h-6 w-full bg-ship-cove-100 dark:bg-ship-cove-800 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-ship-cove-100 dark:bg-ship-cove-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className="py-16 sm:py-24 text-center">
        <Newspaper className="h-12 w-12 mx-auto mb-4 text-ship-cove-300 dark:text-ship-cove-700" />
        <p className="text-lg text-ship-cove-500 dark:text-ship-cove-400">
          {t("noNews")}
        </p>
      </div>
    )
  }

  // Separate featured/first article from the rest
  const [heroArticle, ...restArticles] = news
  const secondaryArticles = restArticles.slice(0, 2)
  const remainingArticles = restArticles.slice(2)

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Main Hero Article */}
        <HeroArticle item={heroArticle} showFeaturedBadge={showFeaturedBadge} />

        {/* Secondary Articles */}
        {secondaryArticles.length > 0 && (
          <div className="lg:col-span-1 flex flex-col gap-6">
            {secondaryArticles.map((item) => (
              <SecondaryArticle key={item.id} item={item} showFeaturedBadge={showFeaturedBadge} />
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
      {remainingArticles.length > 0 && (
        <div className="border-t border-ship-cove-200 dark:border-ship-cove-800" />
      )}

      {/* Remaining Articles Grid */}
      {remainingArticles.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ship-cove-500 dark:text-ship-cove-400 mb-6">
            Mais Notícias
          </h2>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {remainingArticles.map((item) => (
              <ArticleCard key={item.id} item={item} showFeaturedBadge={showFeaturedBadge} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function HeroArticle({ item, showFeaturedBadge }: { item: NewsItem; showFeaturedBadge: boolean }) {
  const t = useTranslations("news")

  const imageUrl = item.featuredImage?.url
    ? item.featuredImage.url.startsWith("http")
      ? item.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${item.featuredImage.url}`
    : null

  const categoryLabel = item.category ? t(`categories.${item.category}`) : null

  const formattedDate = new Date(item.publishedDate).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Link href={`/noticias/${item.slug}/`} className="group lg:col-span-2">
      <article className="relative">
        {/* Image */}
        {imageUrl ? (
          <div className="relative aspect-[16/9] lg:aspect-[21/12] rounded-2xl overflow-hidden mb-5">
            <Image
              src={imageUrl}
              alt={item.featuredImage?.alt || item.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="aspect-[16/9] lg:aspect-[21/12] rounded-2xl bg-gradient-to-br from-ship-cove-100 to-ship-cove-200 dark:from-ship-cove-800 dark:to-ship-cove-900 mb-5" />
        )}

        {/* Content */}
        <div className="space-y-3">
          {/* Meta line */}
          <div className="flex items-center gap-3 text-sm">
            {categoryLabel && (
              <span className="font-semibold text-ship-cove-600 dark:text-ship-cove-400 uppercase tracking-wide text-xs">
                {categoryLabel}
              </span>
            )}
            {categoryLabel && <span className="text-ship-cove-300 dark:text-ship-cove-600">•</span>}
            <time className="text-ship-cove-500 dark:text-ship-cove-400">
              {formattedDate}
            </time>
            {showFeaturedBadge && item.featured && (
              <>
                <span className="text-ship-cove-300 dark:text-ship-cove-600">•</span>
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <Star className="h-3.5 w-3.5" />
                  {t("featured")}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ship-cove-900 dark:text-ship-cove-50 leading-tight tracking-tight group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors">
            {item.title}
          </h2>

          {/* Excerpt */}
          <p className="text-base sm:text-lg text-ship-cove-600 dark:text-ship-cove-400 leading-relaxed line-clamp-3">
            {item.excerpt}
          </p>

          {/* Author */}
          {item.author && (
            <p className="text-sm text-ship-cove-500 dark:text-ship-cove-500">
              Por <span className="font-medium text-ship-cove-700 dark:text-ship-cove-300">{item.author}</span>
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

function SecondaryArticle({ item, showFeaturedBadge }: { item: NewsItem; showFeaturedBadge: boolean }) {
  const t = useTranslations("news")

  const imageUrl = item.featuredImage?.url
    ? item.featuredImage.url.startsWith("http")
      ? item.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${item.featuredImage.url}`
    : null

  const categoryLabel = item.category ? t(`categories.${item.category}`) : null

  const formattedDate = new Date(item.publishedDate).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
  })

  return (
    <Link href={`/noticias/${item.slug}/`} className="group flex-1">
      <article className="flex gap-4 h-full">
        {/* Image */}
        {imageUrl ? (
          <div className="relative w-28 sm:w-32 aspect-square rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={imageUrl}
              alt={item.featuredImage?.alt || item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-28 sm:w-32 aspect-square rounded-xl bg-gradient-to-br from-ship-cove-100 to-ship-cove-200 dark:from-ship-cove-800 dark:to-ship-cove-900 flex-shrink-0" />
        )}

        {/* Content */}
        <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-ship-cove-500 dark:text-ship-cove-400 mb-2">
            {categoryLabel && (
              <span className="font-semibold uppercase tracking-wide text-ship-cove-600 dark:text-ship-cove-400">
                {categoryLabel}
              </span>
            )}
            {categoryLabel && <span className="text-ship-cove-300 dark:text-ship-cove-600">•</span>}
            <time>{formattedDate}</time>
            {showFeaturedBadge && item.featured && (
              <Star className="h-3 w-3 text-amber-500 ml-auto" />
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-ship-cove-900 dark:text-ship-cove-100 leading-snug line-clamp-3 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors">
            {item.title}
          </h3>
        </div>
      </article>
    </Link>
  )
}

function ArticleCard({ item, showFeaturedBadge }: { item: NewsItem; showFeaturedBadge: boolean }) {
  const t = useTranslations("news")

  const imageUrl = item.featuredImage?.url
    ? item.featuredImage.url.startsWith("http")
      ? item.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${item.featuredImage.url}`
    : null

  const categoryLabel = item.category ? t(`categories.${item.category}`) : null

  const formattedDate = new Date(item.publishedDate).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
  })

  return (
    <Link href={`/noticias/${item.slug}/`} className="group">
      <article>
        {/* Image */}
        {imageUrl ? (
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
            <Image
              src={imageUrl}
              alt={item.featuredImage?.alt || item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[16/10] rounded-xl bg-gradient-to-br from-ship-cove-100 to-ship-cove-200 dark:from-ship-cove-800 dark:to-ship-cove-900 mb-4" />
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-ship-cove-500 dark:text-ship-cove-400 mb-2">
          {categoryLabel && (
            <span className="font-semibold uppercase tracking-wide text-ship-cove-600 dark:text-ship-cove-400">
              {categoryLabel}
            </span>
          )}
          {categoryLabel && <span className="text-ship-cove-300 dark:text-ship-cove-600">•</span>}
          <time>{formattedDate}</time>
          {showFeaturedBadge && item.featured && (
            <Star className="h-3 w-3 text-amber-500 ml-auto" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-ship-cove-900 dark:text-ship-cove-100 leading-snug mb-2 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors line-clamp-2">
          {item.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-ship-cove-600 dark:text-ship-cove-400 leading-relaxed line-clamp-2">
          {item.excerpt}
        </p>

        {/* Author */}
        {item.author && (
          <p className="text-xs text-ship-cove-500 dark:text-ship-cove-500 mt-3">
            Por <span className="font-medium text-ship-cove-700 dark:text-ship-cove-300">{item.author}</span>
          </p>
        )}
      </article>
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
    <div className="divide-y divide-ship-cove-100 dark:divide-ship-cove-800">
      {news.map((item) => (
        <Link
          key={item.id}
          href={`/noticias/${item.slug}/`}
          className="group flex gap-4 py-4 first:pt-0 last:pb-0"
        >
          {/* Thumbnail */}
          {item.featuredImage?.url && (
            <div className="relative h-16 w-20 rounded-lg overflow-hidden shrink-0">
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
            <h4 className="font-semibold text-sm text-ship-cove-900 dark:text-ship-cove-100 line-clamp-2 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors leading-snug">
              {item.title}
            </h4>
            <p className="text-xs text-ship-cove-500 mt-1.5">
              {new Date(item.publishedDate).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "short",
              })}
              {item.author && ` • ${item.author}`}
            </p>
          </div>

          {/* Featured indicator */}
          {item.featured && (
            <Star className="h-4 w-4 text-amber-500 shrink-0 mt-1" />
          )}
        </Link>
      ))}
    </div>
  )
}
