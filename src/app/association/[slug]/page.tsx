import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import {
  fetchAssociationBySlug,
  fetchAllAssociationSlugs,
} from "@/lib/associations"
import { Card, CardContent } from "@/components/ui/card"
import { BreadcrumbJsonLd } from "@/components/seo"
import { getPrimaryFrequency } from "@/types/repeater-helpers"
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Radio,
} from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await fetchAllAssociationSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch (error) {
    console.error("[AssociationPage] Error generating static params:", error)
    return []
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  try {
    const association = await fetchAssociationBySlug(slug)
    if (!association) return { title: "Associação não encontrada" }

    const repeaterCount = association.repeaters.length
    const modulations = [
      ...new Set(association.repeaters.flatMap((r) => r.modes || [])),
    ]
      .filter(Boolean)
      .map((m) => (m === "DSTAR" ? "D-STAR" : m))

    const title = `${association.abbreviation} - ${association.name}`
    const description =
      repeaterCount > 0
        ? `${association.name} (${association.abbreviation}) - ${repeaterCount} repetidor${repeaterCount > 1 ? "es" : ""} de rádio amador${modulations.length > 0 ? ` (${modulations.join(", ")})` : ""} em Portugal.`
        : `Informações sobre ${association.name} (${association.abbreviation}) - associação de radioamadores em Portugal.`

    const logoUrl = association.logo?.url
      ? association.logo.url.startsWith("http")
        ? association.logo.url
        : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${association.logo.url}`
      : null

    const ogImage = logoUrl
      ? {
          url: logoUrl,
          width: 400,
          height: 400,
          alt: association.logo?.alt || `Logo ${association.abbreviation}`,
        }
      : {
          url: "/og-default.png",
          width: 512,
          height: 512,
          alt: "Radioamador.info",
        }

    return {
      title,
      description,
      alternates: { canonical: `/association/${slug}/` },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/association/${slug}/`,
        siteName: "Radioamador.info",
        locale: "pt_PT",
        images: [ogImage],
      },
      twitter: {
        card: logoUrl ? "summary_large_image" : "summary",
        title,
        description,
        images: [ogImage.url],
      },
      keywords: [
        association.name,
        association.abbreviation,
        "repetidores",
        "radioamador",
        "ham radio",
        "Portugal",
        ...modulations,
      ].filter(Boolean),
    }
  } catch {
    return { title: "Associação" }
  }
}

function AssociationPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-40 rounded bg-muted animate-pulse" />
      <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06),0_4px_12px_oklch(0.20_0.012_250/0.04)]">
        <div className="flex items-start gap-3">
          <div className="size-14 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

function generateOrganizationJsonLd(
  association: Awaited<ReturnType<typeof fetchAssociationBySlug>>
) {
  if (!association) return null
  const logoUrl = association.logo?.url
    ? association.logo.url.startsWith("http")
      ? association.logo.url
      : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${association.logo.url}`
    : null

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: association.name,
    alternateName: association.abbreviation,
    url:
      association.website ||
      `https://www.radioamador.info/association/${association.slug}/`,
    ...(logoUrl && { logo: logoUrl }),
    ...(association.email && { email: association.email }),
    ...(association.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: association.address,
        addressCountry: "PT",
      },
    }),
    ...(association.repeaters.length > 0 && {
      owns: association.repeaters.map((repeater) => {
        const primary = getPrimaryFrequency(repeater)
        const modesStr =
          repeater.modes?.map((m) => (m === "DSTAR" ? "D-STAR" : m)).join("/") ||
          "FM"
        return {
          "@type": "Thing",
          name: repeater.callsign,
          description: `Repetidor ${modesStr}${primary ? ` - ${primary.outputFrequency.toFixed(3)} MHz` : ""}`,
          ...(repeater.latitude &&
            repeater.longitude && {
              geo: {
                "@type": "GeoCoordinates",
                latitude: repeater.latitude,
                longitude: repeater.longitude,
              },
            }),
        }
      }),
    }),
  }
}

function generateBreadcrumbs(
  association: NonNullable<Awaited<ReturnType<typeof fetchAssociationBySlug>>>
) {
  return [
    { name: "Início", url: "https://www.radioamador.info/" },
    { name: "Associações", url: "https://www.radioamador.info/associacoes/" },
    {
      name: association.abbreviation,
      url: `https://www.radioamador.info/association/${association.slug}/`,
    },
  ]
}

// Status → semantic token. Success / Warning / Destructive are sanctioned
// in DESIGN.md §2 for state signalling.
function statusDot(status?: string) {
  switch (status) {
    case "offline":
      return { color: "bg-destructive", label: "Offline" }
    case "maintenance":
      return {
        color: "bg-[oklch(0.72_0.13_75)]",
        label: "Manutenção",
      }
    default:
      return {
        color: "bg-[oklch(0.55_0.13_145)]",
        label: "Online",
      }
  }
}

async function AssociationContent({
  slug,
  t,
}: {
  slug: string
  t: Awaited<ReturnType<typeof getTranslations<"association">>>
}) {
  const association = await fetchAssociationBySlug(slug)
  if (!association) notFound()

  const apiBaseUrl = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""
  const logoUrl = association.logo?.url
    ? association.logo.url.startsWith("http")
      ? association.logo.url
      : `${apiBaseUrl}${association.logo.url}`
    : null

  const hasContactInfo =
    association.address || association.website || association.email

  const jsonLd = generateOrganizationJsonLd(association)
  const breadcrumbs = generateBreadcrumbs(association)

  // Per-mode counts for the header stats row.
  const modulationCounts = association.repeaters.reduce(
    (acc, r) => {
      const modes = r.modes?.length ? r.modes : ["FM"]
      for (const mode of modes) {
        const displayMode = mode === "DSTAR" ? "D-STAR" : mode
        acc[displayMode] = (acc[displayMode] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BreadcrumbJsonLd items={breadcrumbs} />

      <Link
        href="/associacoes"
        className="group mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-azulejo-700 dark:hover:text-azulejo-300"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Voltar às associações
      </Link>

      <Card>
        <CardContent>
          {/* Header: logo + identity + stats */}
          <header className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={association.logo?.alt || association.abbreviation}
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-mono text-sm font-semibold tracking-tight text-foreground">
                {association.abbreviation}
              </div>
              <h1 className="mt-0.5 text-lg font-semibold leading-snug tracking-tight text-foreground">
                {association.name}
              </h1>

              {/* Stat chips: total + per-mode counts. Single voice (azulejo). */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-azulejo-100 px-2.5 py-0.5 text-xs text-azulejo-700 dark:bg-azulejo-950/50 dark:text-azulejo-300">
                  <Radio className="h-3 w-3" aria-hidden="true" />
                  <span className="font-mono tabular-nums">{association.repeaters.length}</span>{" "}
                  repetidores
                </span>
                {Object.entries(modulationCounts).map(([mod, count]) => (
                  <span
                    key={mod}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    <span className="font-mono tabular-nums text-foreground">{count}</span>
                    <span>{mod}</span>
                  </span>
                ))}
              </div>
            </div>
          </header>

          <div className="border-t border-border" />

          {/* Content grid: Contact (1/3) + Repeaters (2/3). Hairline divider on lg+. */}
          <div className={`grid gap-6 pt-5 lg:gap-8 ${hasContactInfo ? "lg:grid-cols-3" : ""}`}>
            {hasContactInfo && (
              <section className="lg:col-span-1 lg:border-r lg:border-border lg:pr-8">
                <h2 className="mb-3 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
                  {t("contactInfo")}
                </h2>
                <ul className="space-y-1.5">
                  {association.address && (
                    <li className="flex items-start gap-2.5 rounded-md px-2 py-1.5 text-sm">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="whitespace-pre-wrap text-foreground">
                        {association.address}
                      </span>
                    </li>
                  )}
                  {association.website && (
                    <li>
                      <a
                        href={association.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-azulejo-600 transition-colors hover:bg-azulejo-50 hover:text-azulejo-700 dark:text-azulejo-400 dark:hover:bg-azulejo-950/30 dark:hover:text-azulejo-300"
                      >
                        <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate font-mono text-[12.5px]">
                          {association.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </span>
                        <ExternalLink className="ml-auto h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
                      </a>
                    </li>
                  )}
                  {association.email && (
                    <li>
                      <a
                        href={`mailto:${association.email}`}
                        className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-azulejo-600 transition-colors hover:bg-azulejo-50 hover:text-azulejo-700 dark:text-azulejo-400 dark:hover:bg-azulejo-950/30 dark:hover:text-azulejo-300"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate font-mono text-[12.5px]">{association.email}</span>
                      </a>
                    </li>
                  )}
                </ul>
              </section>
            )}

            <section className={hasContactInfo ? "lg:col-span-2" : ""}>
              <h2 className="mb-3 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
                {t("repeaters")}{" "}
                <span className="ml-1 font-mono tabular-nums text-foreground/60">
                  {association.repeaters.length}
                </span>
              </h2>

              {association.repeaters.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {t("noRepeaters")}
                </p>
              ) : (
                <ol className="divide-y divide-border border-t border-border">
                  {association.repeaters.map((repeater) => {
                    const status = statusDot(repeater.status)
                    const primary = getPrimaryFrequency(repeater)
                    const modesStr =
                      repeater.modes
                        ?.map((m) => (m === "DSTAR" ? "D-STAR" : m))
                        .join(" · ") || "FM"

                    // Standard ham convention: signed offset between input and output
                    // (e.g. -0.6 / +7.6). Simplex repeaters (no offset) render nothing.
                    const offset: string | null = (() => {
                      if (!primary || typeof primary.inputFrequency !== "number") return null
                      const diff = primary.inputFrequency - primary.outputFrequency
                      if (Math.abs(diff) < 0.0001) return null
                      const sign = diff > 0 ? "+" : "-"
                      const abs = Math.abs(diff).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
                      return `${sign}${abs}`
                    })()

                    return (
                      <li key={repeater.callsign}>
                        <Link
                          href={`/repeater/${encodeURIComponent(repeater.callsign)}/`}
                          className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-azulejo-50/40 dark:hover:bg-azulejo-950/20"
                        >
                          <span
                            className={`size-2 shrink-0 rounded-full ${status.color}`}
                            title={status.label}
                            aria-label={status.label}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-sm font-semibold tabular-nums text-foreground transition-colors group-hover:text-azulejo-700 dark:group-hover:text-azulejo-300">
                                {repeater.callsign}
                              </span>
                              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                {modesStr}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-[12.5px] text-muted-foreground">
                              {repeater.address && (
                                <span className="max-w-[55%] truncate">{repeater.address}</span>
                              )}
                              {repeater.address && primary && (
                                <span aria-hidden="true">·</span>
                              )}
                              {primary && (
                                <span className="whitespace-nowrap font-mono tabular-nums">
                                  {primary.outputFrequency.toFixed(3)}
                                  <span className="text-muted-foreground/70"> MHz</span>
                                  {offset && (
                                    <span className="ml-1 text-muted-foreground/60">{offset}</span>
                                  )}
                                </span>
                              )}
                              {primary?.tone ? (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="whitespace-nowrap font-mono tabular-nums">
                                    {primary.tone} Hz
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                          {repeater.qthLocator && (
                            <span className="hidden shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground sm:inline">
                              {repeater.qthLocator}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default async function AssociationDetailPage({ params }: PageProps) {
  const { slug } = await params
  const t = await getTranslations("association")

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<AssociationPageSkeleton />}>
        <AssociationContent slug={slug} t={t} />
      </Suspense>
    </main>
  )
}
