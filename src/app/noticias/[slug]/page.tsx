import { fetchAllNewsSlugs, fetchNewsBySlug } from "@/lib/news"
import { ArrowLeft, Calendar, ExternalLink, Newspaper, Star, User } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import NewsDetailClient from "./NewsDetailClient"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await fetchAllNewsSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const news = await fetchNewsBySlug(slug)

  if (!news) {
    return {
      title: "Notícia não encontrada",
    }
  }

  const imageUrl = news.featuredImage?.url
    ? news.featuredImage.url.startsWith("http")
      ? news.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${news.featuredImage.url}`
    : null

  return {
    title: news.title,
    description: news.excerpt,
    alternates: {
      canonical: `/noticias/${slug}`,
    },
    openGraph: {
      title: news.title,
      description: news.excerpt,
      type: "article",
      url: `/noticias/${slug}`,
      siteName: "Repetidores",
      locale: "pt_PT",
      publishedTime: news.publishedDate,
      ...(imageUrl && { images: [imageUrl] }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: news.title,
      description: news.excerpt,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

function generateNewsJsonLd(news: Awaited<ReturnType<typeof fetchNewsBySlug>>) {
  if (!news) return null

  const imageUrl = news.featuredImage?.url
    ? news.featuredImage.url.startsWith("http")
      ? news.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${news.featuredImage.url}`
    : null

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: news.excerpt,
    datePublished: news.publishedDate,
    ...(news.updatedAt && { dateModified: news.updatedAt }),
    ...(news.author && {
      author: {
        "@type": "Person",
        name: news.author,
      },
    }),
    ...(imageUrl && {
      image: imageUrl,
    }),
    publisher: {
      "@type": "Organization",
      name: "Repetidores",
      url: "https://www.radioamador.info",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.radioamador.info/noticias/${news.slug}`,
    },
  }
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [news, t] = await Promise.all([
    fetchNewsBySlug(slug),
    getTranslations("news"),
  ])

  if (!news) {
    notFound()
  }

  const formattedDate = new Date(news.publishedDate).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const categoryLabel = news.category ? t(`categories.${news.category}`) : null

  const imageUrl = news.featuredImage?.url
    ? news.featuredImage.url.startsWith("http")
      ? news.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${news.featuredImage.url}`
    : null

  const jsonLd = generateNewsJsonLd(news)

  return (
    <div className="min-h-screen bg-gradient-to-b from-ship-cove-50/50 via-background to-background dark:from-ship-cove-950/30 dark:via-background dark:to-background">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/noticias"
          className="inline-flex items-center gap-2 text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-800 dark:hover:text-ship-cove-200 mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToNews")}
        </Link>

        <article>
          {/* Hero Header */}
          <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-ship-cove-600 via-ship-cove-700 to-ship-cove-800 dark:from-ship-cove-800 dark:via-ship-cove-900 dark:to-ship-cove-950 p-4 sm:p-6 mb-6 shadow-lg shadow-ship-cove-500/20">
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-news-detail" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-news-detail)" className="text-white" />
              </svg>
            </div>

            {/* Decorative blur */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-ship-cove-500/20 blur-2xl" />

            <div className="relative">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                {categoryLabel && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium">
                    {categoryLabel}
                  </span>
                )}
                {news.featured && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/80 backdrop-blur-sm text-white text-xs font-medium">
                    <Star className="h-3 w-3" />
                    {t("featured")}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                {news.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-ship-cove-200 text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formattedDate}
                </span>
                {news.author && (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {news.author}
                  </span>
                )}
              </div>

              {/* Status LED */}
              <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
            </div>
          </header>

          {/* Featured Image */}
          {imageUrl && (
            <div className="relative aspect-video w-full mb-6 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={imageUrl}
                alt={news.featuredImage?.alt || news.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content Card */}
          <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm mb-6">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-500 to-transparent opacity-60" />

            <div className="p-4 sm:p-6">
              {/* Excerpt as lead */}
              <p className="text-lg text-ship-cove-600 dark:text-ship-cove-400 mb-6 pb-6 border-b border-ship-cove-200 dark:border-ship-cove-800/50 leading-relaxed">
                {news.excerpt}
              </p>

              {/* Rich Text Content */}
              <div className="prose prose-ship-cove dark:prose-invert max-w-none prose-headings:text-ship-cove-900 dark:prose-headings:text-ship-cove-100 prose-p:text-ship-cove-700 dark:prose-p:text-ship-cove-300 prose-a:text-ship-cove-600 dark:prose-a:text-ship-cove-400 prose-strong:text-ship-cove-900 dark:prose-strong:text-ship-cove-100">
                <RichTextContent content={news.content} />
              </div>
            </div>

            {/* Corner LED */}
            <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-500/50 animate-pulse" />
          </div>

          {/* External Link */}
          {news.externalLink && (
            <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-r from-ship-cove-50 to-white dark:from-ship-cove-900/50 dark:to-ship-cove-950 mb-6">
              <div className="p-4">
                <a
                  href={news.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-800 dark:hover:text-ship-cove-200 transition-colors font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("externalLink")}
                </a>
              </div>
            </div>
          )}

          {/* Share */}
          <NewsDetailClient title={news.title} slug={news.slug} />
        </article>
      </div>
    </div>
  )
}

// Simple rich text renderer for Lexical content
function RichTextContent({ content }: { content: unknown }) {
  if (!content) return null

  // Handle Lexical JSON format
  if (typeof content === "object" && content !== null) {
    const lexicalContent = content as { root?: { children?: LexicalNode[] } }

    if (lexicalContent.root?.children) {
      return (
        <>
          {lexicalContent.root.children.map((node, index) => (
            <LexicalNodeRenderer key={index} node={node} />
          ))}
        </>
      )
    }
  }

  // Render markdown content if it's a string
  if (typeof content === "string") {
    return <ReactMarkdown>{content}</ReactMarkdown>
  }

  return null
}

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  format?: number
  tag?: string
  listType?: string
  url?: string
}

function LexicalNodeRenderer({ node }: { node: LexicalNode }) {
  const { type, children, text, format, tag, listType, url } = node

  // Text node
  if (type === "text" && text) {
    // Check if text contains markdown patterns (user pasted markdown)
    const hasMarkdown = /(\*\*|__|##|^- |\n- |^\d+\. |\n\d+\. |`[^`]+`|\[.*\]\(.*\))/m.test(text)

    if (hasMarkdown) {
      // Render markdown content
      return <ReactMarkdown>{text}</ReactMarkdown>
    }

    let element: React.ReactNode = text

    // Apply formatting
    if (format) {
      if (format & 1) element = <strong>{element}</strong> // Bold
      if (format & 2) element = <em>{element}</em> // Italic
      if (format & 8) element = <u>{element}</u> // Underline
      if (format & 16) element = <code>{element}</code> // Code
    }

    return <>{element}</>
  }

  // Line break
  if (type === "linebreak") {
    return <br />
  }

  // Paragraph
  if (type === "paragraph") {
    return (
      <p>
        {children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </p>
    )
  }

  // Headings
  if (type === "heading") {
    const HeadingTag = (tag || "h2") as keyof React.JSX.IntrinsicElements
    return (
      <HeadingTag>
        {children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </HeadingTag>
    )
  }

  // Lists
  if (type === "list") {
    const ListTag = listType === "number" ? "ol" : "ul"
    return (
      <ListTag>
        {children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </ListTag>
    )
  }

  // List items
  if (type === "listitem") {
    return (
      <li>
        {children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </li>
    )
  }

  // Links
  if (type === "link" && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </a>
    )
  }

  // Quote
  if (type === "quote") {
    return (
      <blockquote>
        {children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </blockquote>
    )
  }

  // Default: render children
  if (children) {
    return (
      <>
        {children.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </>
    )
  }

  return null
}
