"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Building2, ExternalLink, Globe, Radio, Signal } from "lucide-react"
import type { Association } from "@/lib/associations"

interface AssociationCardProps {
  association: Association
  index?: number
}

export function AssociationCard({ association, index = 0 }: AssociationCardProps) {
  const t = useTranslations("associations")
  const apiBaseUrl = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""

  const logoUrl = association.logo?.url
    ? association.logo.url.startsWith("http")
      ? association.logo.url
      : `${apiBaseUrl}${association.logo.url}`
    : null

  const repeaterCount = association.repeaterCount ?? 0

  // Signal strength visualization (0-5 bars based on repeater count)
  const signalBars = Math.min(5, Math.ceil(repeaterCount / 2))

  return (
    <Link
      href={`/association/${association.slug}`}
      className="group block"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <article className="relative h-full overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:shadow-ship-cove-500/10 hover:border-ship-cove-400 dark:hover:border-ship-cove-600 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        {/* Top accent line - like an LED strip */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start gap-4 mb-4">
            {/* Logo container - styled like equipment display */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-900/50 ring-1 ring-ship-cove-200 dark:ring-ship-cove-800 overflow-hidden transition-all group-hover:ring-ship-cove-400 dark:group-hover:ring-ship-cove-600">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={association.logo?.alt || association.abbreviation}
                  className="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <Building2 className="h-8 w-8 text-ship-cove-500 transition-colors group-hover:text-ship-cove-600" />
              )}
            </div>

            {/* Abbreviation badge - styled like frequency display */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ship-cove-900 dark:bg-ship-cove-100 text-ship-cove-100 dark:text-ship-cove-900 font-mono text-sm font-bold tracking-wider mb-2 shadow-inner">
                <Radio className="h-3 w-3" />
                {association.abbreviation}
              </div>
              <h3 className="font-semibold text-base leading-snug line-clamp-2 text-ship-cove-900 dark:text-ship-cove-100 transition-colors group-hover:text-ship-cove-700 dark:group-hover:text-ship-cove-300">
                {association.name}
              </h3>
            </div>
          </div>

          {/* Footer - equipment panel style */}
          <div className="flex items-center justify-between pt-4 border-t border-ship-cove-200/60 dark:border-ship-cove-800/60">
            {/* Signal strength meter */}
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4 text-ship-cove-500" />
              <div className="flex items-end gap-0.5 h-4" title={t("repeatersCount", { count: repeaterCount })}>
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className={`w-1 rounded-sm transition-all duration-300 ${
                      bar <= signalBars
                        ? "bg-emerald-500 dark:bg-emerald-400"
                        : "bg-ship-cove-200 dark:bg-ship-cove-800"
                    }`}
                    style={{ height: `${bar * 3 + 2}px` }}
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-ship-cove-600 dark:text-ship-cove-400 tabular-nums">
                {repeaterCount > 0
                  ? t("repeatersCount", { count: repeaterCount })
                  : t("noRepeaters")}
              </span>
            </div>

            {/* Website link */}
            {association.website && (
              <a
                href={association.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-900 dark:hover:text-ship-cove-100 hover:bg-ship-cove-100 dark:hover:bg-ship-cove-800 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("website")}</span>
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            )}
          </div>
        </div>

        {/* Corner accent - like a status LED */}
        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-500/50 animate-pulse" />
      </article>
    </Link>
  )
}
