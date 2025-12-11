"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, ExternalLink, Globe, Radio } from "lucide-react"
import type { Association } from "@/lib/associations"

interface AssociationCardProps {
  association: Association
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

  return (
    <Link href={`/association/${association.slug}`}>
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Logo or Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={association.logo?.alt || association.abbreviation}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-7 w-7 text-primary" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="shrink-0">
                  {association.abbreviation}
                </Badge>
              </div>
              <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {association.name}
              </h3>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Radio className="h-4 w-4" />
              <span>
                {repeaterCount > 0
                  ? t("repeatersCount", { count: repeaterCount })
                  : t("noRepeaters")}
              </span>
            </div>

            {association.website && (
              <a
                href={association.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("website")}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
