"use client"

import { Button } from "@/components/ui/button"
import { Check, Share2 } from "lucide-react"
import { useTranslations } from "next-intl"
import * as React from "react"

interface NewsDetailClientProps {
  title: string
  slug: string
}

export default function NewsDetailClient({ title, slug }: NewsDetailClientProps) {
  const t = useTranslations("news")
  const [copied, setCopied] = React.useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/noticias/${slug}`

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
        return
      } catch {
        // User cancelled or share failed, fall back to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard failed
    }
  }

  return (
    <div className="flex items-center gap-4 pt-6 border-t">
      <span className="text-sm text-muted-foreground">{t("share")}:</span>
      <Button variant="outline" size="sm" onClick={handleShare}>
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2 text-emerald-600" />
            {t("copied")}
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 mr-2" />
            {t("copyLink")}
          </>
        )}
      </Button>
    </div>
  )
}
