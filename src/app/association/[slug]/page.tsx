import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import {
  fetchAssociationBySlug,
  fetchAllAssociationSlugs,
} from "@/lib/associations"
import { PageHeader, PageHeaderIcon } from "@/components/ui/PageHeader"
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
  Signal,
  Antenna,
  ChevronRight,
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

    if (!association) {
      return { title: "Associação não encontrada" }
    }

    const repeaterCount = association.repeaters.length
    const modulations = [
      ...new Set(association.repeaters.flatMap((r) => r.modes || [])),
    ].filter(Boolean).map(m => m === 'DSTAR' ? 'D-STAR' : m)

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

    // Create image object with dimensions (logo dimensions not available, use defaults)
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
        };

    return {
      title,
      description,
      alternates: {
        canonical: `/association/${slug}/`,
      },
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
    <div className="space-y-6">
      {/* Back link skeleton */}
      <div className="h-5 w-40 bg-ship-cove-100 dark:bg-ship-cove-900 rounded animate-pulse" />

      {/* Hero skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ship-cove-100 to-ship-cove-50 dark:from-ship-cove-900 dark:to-ship-cove-950 p-8 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 bg-ship-cove-200 dark:bg-ship-cove-800 rounded-xl" />
          <div className="space-y-3">
            <div className="h-6 w-24 bg-ship-cove-200 dark:bg-ship-cove-800 rounded" />
            <div className="h-8 w-64 bg-ship-cove-200 dark:bg-ship-cove-800 rounded" />
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-48 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-xl animate-pulse" />
        <div className="lg:col-span-2 h-64 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-xl animate-pulse" />
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
        const primary = getPrimaryFrequency(repeater);
        const modesStr = repeater.modes?.map(m => m === 'DSTAR' ? 'D-STAR' : m).join('/') || 'FM';
        return {
          "@type": "Thing",
          name: repeater.callsign,
          description: `Repetidor ${modesStr}${primary ? ` - ${primary.outputFrequency.toFixed(3)} MHz` : ''}`,
          ...(repeater.latitude &&
            repeater.longitude && {
              geo: {
                "@type": "GeoCoordinates",
                latitude: repeater.latitude,
                longitude: repeater.longitude,
              },
            }),
        };
      }),
    }),
  }
}

function generateBreadcrumbs(
  association: NonNullable<Awaited<ReturnType<typeof fetchAssociationBySlug>>>
) {
  return [
    { name: "Início", url: "https://www.radioamador.info/" },
    { name: "Associações", url: "https://www.radioamador.info/associations/" },
    { name: association.abbreviation, url: `https://www.radioamador.info/association/${association.slug}/` },
  ]
}

// Helper to get status color classes
function getStatusClasses(status?: string) {
  switch (status) {
    case "offline":
      return {
        bg: "bg-red-500",
        ring: "ring-red-500/30",
        text: "text-red-600 dark:text-red-400",
        label: "Offline",
      }
    case "maintenance":
      return {
        bg: "bg-amber-500",
        ring: "ring-amber-500/30",
        text: "text-amber-600 dark:text-amber-400",
        label: "Manutenção",
      }
    default:
      return {
        bg: "bg-emerald-500",
        ring: "ring-emerald-500/30",
        text: "text-emerald-600 dark:text-emerald-400",
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

  if (!association) {
    notFound()
  }

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

  // Group repeaters by mode for stats
  const modulationCounts = association.repeaters.reduce(
    (acc, r) => {
      const modes = r.modes?.length ? r.modes : ['FM'];
      for (const mode of modes) {
        const displayMode = mode === 'DSTAR' ? 'D-STAR' : mode;
        acc[displayMode] = (acc[displayMode] || 0) + 1;
      }
      return acc
    },
    {} as Record<string, number>
  )

  // Signal strength for visualization
  const signalBars = Math.min(5, Math.ceil(association.repeaters.length / 2))

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BreadcrumbJsonLd items={breadcrumbs} />

      {/* Back Link */}
      <Link
        href="/associations"
        className="inline-flex items-center gap-2 text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-900 dark:hover:text-ship-cove-100 mb-6 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Voltar às associações</span>
      </Link>

      {/* Hero Header */}
      <PageHeader
        floatingIcons={[
          <Radio key="radio" className="h-12 w-12 text-white" />,
          <Antenna key="antenna" className="h-10 w-10 text-white" />,
        ]}
      >
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Logo */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={association.logo?.alt || association.abbreviation}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <Building2 className="h-10 w-10 text-white" />
            )}
          </div>

          <div className="flex-1">
            {/* Abbreviation badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 backdrop-blur-sm text-white font-mono text-sm font-bold tracking-wider mb-3 ring-1 ring-white/20">
              <Radio className="h-3.5 w-3.5" />
              {association.abbreviation}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
              {association.name}
            </h1>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Signal meter */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <Signal className="h-4 w-4 text-white/70" />
                <div
                  className="flex items-end gap-0.5 h-4"
                  title={`${association.repeaters.length} repetidores`}
                >
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      className={`w-1 rounded-sm transition-all ${
                        bar <= signalBars
                          ? "bg-emerald-400"
                          : "bg-white/20"
                      }`}
                      style={{ height: `${bar * 3 + 2}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono font-bold text-white tabular-nums">
                  {association.repeaters.length}
                </span>
                <span className="text-ship-cove-200 text-sm">repetidores</span>
              </div>

              {/* Modulation badges */}
              {Object.entries(modulationCounts).map(([mod, count]) => (
                <div
                  key={mod}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ship-cove-500/30 text-ship-cove-100 text-sm"
                >
                  <span className="font-mono font-bold tabular-nums">
                    {count}
                  </span>
                  <span className="text-ship-cove-200">{mod}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageHeader>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info Panel */}
        {hasContactInfo && (
          <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm">
            {/* Top accent */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-500 to-transparent opacity-60" />

            <div className="p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ship-cove-900 dark:text-ship-cove-100 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
                  <MapPin className="h-4 w-4 text-ship-cove-600 dark:text-ship-cove-400" />
                </div>
                {t("contactInfo")}
              </h2>

              <div className="space-y-4">
                {association.address && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-ship-cove-50 dark:bg-ship-cove-900/50">
                    <MapPin className="h-4 w-4 text-ship-cove-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-ship-cove-700 dark:text-ship-cove-300 whitespace-pre-wrap">
                      {association.address}
                    </p>
                  </div>
                )}

                {association.website && (
                  <a
                    href={association.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-ship-cove-50 dark:bg-ship-cove-900/50 hover:bg-ship-cove-100 dark:hover:bg-ship-cove-800/50 transition-colors group"
                  >
                    <Globe className="h-4 w-4 text-ship-cove-500" />
                    <span className="text-sm text-ship-cove-700 dark:text-ship-cove-300 group-hover:text-ship-cove-900 dark:group-hover:text-ship-cove-100 truncate flex-1">
                      {association.website.replace(/^https?:\/\//, "")}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-ship-cove-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {association.email && (
                  <a
                    href={`mailto:${association.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-ship-cove-50 dark:bg-ship-cove-900/50 hover:bg-ship-cove-100 dark:hover:bg-ship-cove-800/50 transition-colors group"
                  >
                    <Mail className="h-4 w-4 text-ship-cove-500" />
                    <span className="text-sm text-ship-cove-700 dark:text-ship-cove-300 group-hover:text-ship-cove-900 dark:group-hover:text-ship-cove-100 truncate">
                      {association.email}
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* Corner LED */}
            <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-500/50 animate-pulse" />
          </div>
        )}

        {/* Repeaters Panel */}
        <div
          className={`relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm ${hasContactInfo ? "lg:col-span-2" : "lg:col-span-3"}`}
        >
          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-500 to-transparent opacity-60" />

          <div className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ship-cove-900 dark:text-ship-cove-100 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
                <Radio className="h-4 w-4 text-ship-cove-600 dark:text-ship-cove-400" />
              </div>
              {t("repeaters")}
              <span className="ml-auto text-sm font-mono font-normal text-ship-cove-500 tabular-nums">
                {association.repeaters.length}
              </span>
            </h2>

            {association.repeaters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-ship-cove-100 dark:bg-ship-cove-900/50 flex items-center justify-center mb-3">
                  <Radio className="h-6 w-6 text-ship-cove-400" />
                </div>
                <p className="text-ship-cove-600 dark:text-ship-cove-400">
                  {t("noRepeaters")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {association.repeaters.map((repeater, index) => {
                  const status = getStatusClasses(repeater.status)
                  const primary = getPrimaryFrequency(repeater);
                  const modesStr = repeater.modes?.map(m => m === 'DSTAR' ? 'D-STAR' : m).join('/') || 'FM';
                  return (
                    <Link
                      key={repeater.callsign}
                      href={`/repeater/${encodeURIComponent(repeater.callsign)}/`}
                      className="flex items-center gap-4 p-4 rounded-lg border border-ship-cove-100 dark:border-ship-cove-800/50 hover:border-ship-cove-300 dark:hover:border-ship-cove-700 bg-white dark:bg-ship-cove-900/30 hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/50 transition-all group animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* Status indicator */}
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${status.bg} ring-2 ${status.ring}`}
                        title={status.label}
                      />

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-ship-cove-900 dark:text-ship-cove-100">
                            {repeater.callsign}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-600 dark:text-ship-cove-400">
                            {modesStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-ship-cove-600 dark:text-ship-cove-400">
                          {primary && (
                            <span className="font-mono tabular-nums">
                              {primary.outputFrequency.toFixed(3)} MHz
                            </span>
                          )}
                          {primary?.tone && (
                            <>
                              <span className="text-ship-cove-300 dark:text-ship-cove-700">
                                •
                              </span>
                              <span className="font-mono tabular-nums">
                                {primary.tone} Hz
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* QTH Locator */}
                      {repeater.qthLocator && (
                        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-ship-cove-900 dark:bg-ship-cove-100 text-ship-cove-100 dark:text-ship-cove-900">
                          {repeater.qthLocator}
                        </span>
                      )}

                      {/* Arrow */}
                      <ChevronRight className="h-4 w-4 text-ship-cove-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Corner LED */}
          <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-500/50 animate-pulse" />
        </div>
      </div>
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
