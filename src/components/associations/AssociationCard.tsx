"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Building2, ExternalLink, Radio } from "lucide-react"
import type { Association } from "@/lib/associations"

interface AssociationCardProps {
  association: Association
  /** Unused under the new design; retained for prop compatibility with the list. */
  index?: number
}

export function AssociationCard({ association }: AssociationCardProps) {
  const t = useTranslations("associations")
  const apiBaseUrl = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""

  const logoUrl = association.logo?.url
    ? association.logo.url.startsWith("http")
      ? association.logo.url
      : `${apiBaseUrl}${association.logo.url}`
    : null

  const repeaterCount = association.repeaterCount ?? 0

  // Strip the leading https?:// from the website for a cleaner display.
  const websiteLabel = association.website
    ? association.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null

  return (
    <article
      className="
        group relative flex h-full flex-col rounded-xl border border-border bg-card
        shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06),0_4px_12px_oklch(0.20_0.012_250/0.04)]
        transition-all duration-200 ease-out
        hover:-translate-y-px hover:border-azulejo-300
        hover:shadow-[0_1px_2px_oklch(0.20_0.012_250/0.08),0_8px_24px_oklch(0.20_0.012_250/0.08)]
        dark:hover:border-azulejo-800/60
      "
    >
      {/* Overlay link — covers the whole card. The external website link
          below sits at z-20 so its click wins without nesting anchors. */}
      <Link
        href={`/association/${association.slug}/`}
        aria-label={association.name}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="sr-only">{association.name}</span>
      </Link>

      {/* Top section: logo + identity */}
      <div className="flex flex-1 items-start gap-3 p-4">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={association.logo?.alt || association.abbreviation}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-azulejo-700 dark:group-hover:text-azulejo-300">
            {association.abbreviation}
          </div>
          <h3 className="mt-0.5 text-[13px] leading-snug text-muted-foreground line-clamp-2">
            {association.name}
          </h3>
        </div>
      </div>

      {/* Footer: repeater count + optional website link, separated by a hairline */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Radio className="h-3.5 w-3.5" aria-hidden="true" />
          {repeaterCount > 0 ? (
            <span>
              <span className="font-mono tabular-nums text-foreground">{repeaterCount}</span>{" "}
              {t("repeatersCount", { count: repeaterCount }).replace(/^\d+\s*/, "")}
            </span>
          ) : (
            <span>{t("noRepeaters")}</span>
          )}
        </div>

        {websiteLabel && association.website && (
          <a
            href={association.website}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-20 inline-flex max-w-[55%] items-center gap-1 truncate rounded-md px-1.5 py-0.5 font-mono text-[11px] text-azulejo-600 hover:text-azulejo-700 hover:bg-azulejo-50 dark:text-azulejo-400 dark:hover:text-azulejo-300 dark:hover:bg-azulejo-950/40 transition-colors"
            title={association.website}
          >
            <span className="truncate">{websiteLabel}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  )
}
