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
    <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-r from-white to-ship-cove-50/30 dark:from-ship-cove-950 dark:to-ship-cove-900/20">
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-ship-cove-600 dark:text-ship-cove-400 font-medium">
            {t("share")}
          </span>
          <button
            onClick={handleShare}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${copied
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800"
                : "bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-600 dark:text-ship-cove-400 hover:bg-ship-cove-200 dark:hover:bg-ship-cove-700"
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
      </div>
    </div>
  )
}
