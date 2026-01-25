import { fetchAllNewsSlugs, fetchNewsBySlug } from "@/lib/news"
import { ArrowLeft, Calendar, ExternalLink, Star, User } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import NewsDetailClient from "./NewsDetailClient"
import { BreadcrumbJsonLd } from "@/components/seo"

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

  // Create image object with dimensions when available
  const ogImage = imageUrl
    ? {
        url: imageUrl,
        width: news.featuredImage?.width || 1200,
        height: news.featuredImage?.height || 630,
        alt: news.featuredImage?.alt || news.title,
      }
    : {
        url: "/og-default.png",
        width: 512,
        height: 512,
        alt: "Radioamador.info",
      };

  return {
    title: news.title,
    description: news.excerpt,
    alternates: {
      canonical: `/noticias/${slug}/`,
    },
    openGraph: {
      title: news.title,
      description: news.excerpt,
      type: "article",
      url: `/noticias/${slug}/`,
      siteName: "Radioamador.info",
      locale: "pt_PT",
      publishedTime: news.publishedDate,
      images: [ogImage],
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: news.title,
      description: news.excerpt,
      images: [ogImage.url],
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
      name: "Radioamador.info",
      url: "https://www.radioamador.info",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.radioamador.info/noticias/${news.slug}/`,
    },
  }
}

function generateBreadcrumbs(news: NonNullable<Awaited<ReturnType<typeof fetchNewsBySlug>>>) {
  return [
    { name: "Início", url: "https://www.radioamador.info/" },
    { name: "Notícias", url: "https://www.radioamador.info/noticias/" },
    { name: news.title, url: `https://www.radioamador.info/noticias/${news.slug}/` },
  ]
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
  const breadcrumbs = generateBreadcrumbs(news)

  return (
    <div className="min-h-screen bg-white dark:bg-ship-cove-950">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/noticias"
          className="inline-flex items-center gap-2 text-ship-cove-500 hover:text-ship-cove-700 dark:text-ship-cove-400 dark:hover:text-ship-cove-200 mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToNews")}
        </Link>

        <article className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            {/* Meta line */}
            <div className="flex items-center gap-3 text-sm mb-4">
              {categoryLabel && (
                <span className="font-semibold text-ship-cove-600 dark:text-ship-cove-400 uppercase tracking-wide text-xs">
                  {categoryLabel}
                </span>
              )}
              {categoryLabel && <span className="text-ship-cove-300 dark:text-ship-cove-600">•</span>}
              <time className="text-ship-cove-500 dark:text-ship-cove-400">
                {formattedDate}
              </time>
              {news.featured && (
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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ship-cove-900 dark:text-ship-cove-50 leading-tight tracking-tight mb-6">
              {news.title}
            </h1>

            {/* Author */}
            {news.author && (
              <p className="text-base text-ship-cove-600 dark:text-ship-cove-400">
                Por <span className="font-semibold text-ship-cove-800 dark:text-ship-cove-200">{news.author}</span>
              </p>
            )}
          </header>

          {/* Featured Image */}
          {imageUrl && (
            <figure className="mb-10">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={news.featuredImage?.alt || news.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {news.featuredImage?.alt && (
                <figcaption className="mt-3 text-sm text-ship-cove-500 dark:text-ship-cove-400 text-center italic">
                  {news.featuredImage.alt}
                </figcaption>
              )}
            </figure>
          )}

          {/* Lead / Excerpt */}
          <p className="text-xl sm:text-2xl text-ship-cove-700 dark:text-ship-cove-300 leading-relaxed mb-8 font-serif italic">
            {news.excerpt}
          </p>

          {/* Divider */}
          <div className="h-px bg-ship-cove-200 dark:bg-ship-cove-800 mb-8" />

          {/* Content */}
          <div className="prose prose-lg prose-ship-cove dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-ship-cove-700 prose-p:dark:text-ship-cove-300 prose-p:leading-relaxed
            prose-a:text-ship-cove-600 prose-a:dark:text-ship-cove-400 prose-a:underline prose-a:underline-offset-2
            prose-strong:text-ship-cove-900 prose-strong:dark:text-ship-cove-100
            prose-blockquote:border-l-ship-cove-300 prose-blockquote:dark:border-l-ship-cove-700 prose-blockquote:italic prose-blockquote:text-ship-cove-600 prose-blockquote:dark:text-ship-cove-400
            prose-ul:text-ship-cove-700 prose-ul:dark:text-ship-cove-300
            prose-ol:text-ship-cove-700 prose-ol:dark:text-ship-cove-300
            prose-li:marker:text-ship-cove-400
          ">
            <RichTextContent content={news.content} />
          </div>

          {/* External Link */}
          {news.externalLink && (
            <div className="mt-10 pt-6 border-t border-ship-cove-200 dark:border-ship-cove-800">
              <a
                href={news.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-800 dark:hover:text-ship-cove-200 transition-colors font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                {t("externalLink")}
              </a>
            </div>
          )}

          {/* Share */}
          <div className="mt-10 pt-6 border-t border-ship-cove-200 dark:border-ship-cove-800">
            <NewsDetailClient title={news.title} slug={news.slug} />
          </div>
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
