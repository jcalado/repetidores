"use client"

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
    <div className="flex items-center justify-between">
      <span className="text-sm text-ship-cove-500 dark:text-ship-cove-400">
        {t("share")}
      </span>
      <button
        onClick={handleShare}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
          ${copied
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
            : "bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-700 dark:text-ship-cove-300 hover:bg-ship-cove-200 dark:hover:bg-ship-cove-700"
          }
        `}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            {t("copied")}
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            {t("copyLink")}
          </>
        )}
      </button>
    </div>
  )
}
