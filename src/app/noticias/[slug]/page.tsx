import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { fetchAllNewsSlugs, fetchNewsBySlug } from "@/lib/news"
import { ArrowLeft, Calendar, ExternalLink, Star, User } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
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

  return {
    title: news.title,
    description: news.excerpt,
    openGraph: {
      title: news.title,
      description: news.excerpt,
      images: news.featuredImage?.url ? [news.featuredImage.url] : [],
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

  // Get image URL - handle both relative and absolute URLs
  const imageUrl = news.featuredImage?.url
    ? news.featuredImage.url.startsWith("http")
      ? news.featuredImage.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${news.featuredImage.url}`
    : null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/noticias"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToNews")}
        </Link>

        <article>
          {/* Header */}
          <header className="mb-8">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              {categoryLabel && (
                <Badge variant="secondary">{categoryLabel}</Badge>
              )}
              {news.featured && (
                <Badge className="bg-amber-500 hover:bg-amber-600">
                  <Star className="h-3 w-3 mr-1" />
                  {t("featured")}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{news.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
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
          </header>

          {/* Featured Image */}
          {imageUrl && (
            <div className="relative aspect-video w-full mb-8 rounded-xl overflow-hidden">
              <Image
                src={imageUrl}
                alt={news.featuredImage?.alt || news.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              {/* Excerpt as lead */}
              <p className="text-lg text-muted-foreground mb-6 pb-6 border-b">
                {news.excerpt}
              </p>

              {/* Rich Text Content */}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <RichTextContent content={news.content} />
              </div>
            </CardContent>
          </Card>

          {/* External Link */}
          {news.externalLink && (
            <Card className="mb-8 bg-muted/50">
              <CardContent className="pt-6">
                <a
                  href={news.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("externalLink")}
                </a>
              </CardContent>
            </Card>
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

  // Fallback: render as plain text if it's a string
  if (typeof content === "string") {
    return (
      <div className="whitespace-pre-wrap">
        {content.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    )
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
