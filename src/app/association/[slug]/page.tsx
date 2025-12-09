import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import {
  fetchAssociationBySlug,
  fetchAllAssociationSlugs,
} from "@/lib/associations"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

    if (!association) {
      return { title: "Associação não encontrada" }
    }

    const repeaterCount = association.repeaters.length
    const modulations = [
      ...new Set(association.repeaters.map((r) => r.modulation)),
    ].filter(Boolean)

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

    return {
      title,
      description,
      alternates: {
        canonical: `/association/${slug}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/association/${slug}`,
        siteName: "Repetidores",
        locale: "pt_PT",
        ...(logoUrl && {
          images: [
            {
              url: logoUrl,
              alt: association.logo?.alt || `Logo ${association.abbreviation}`,
            },
          ],
        }),
      },
      twitter: {
        card: logoUrl ? "summary_large_image" : "summary",
        title,
        description,
        ...(logoUrl && { images: [logoUrl] }),
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
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 bg-muted rounded-xl" />
        <div className="space-y-2">
          <div className="h-6 w-20 bg-muted rounded" />
          <div className="h-8 w-64 bg-muted rounded" />
        </div>
      </div>
      <div className="h-40 bg-muted rounded-lg" />
      <div className="h-60 bg-muted rounded-lg" />
    </div>
  )
}

function generateOrganizationJsonLd(association: Awaited<ReturnType<typeof fetchAssociationBySlug>>) {
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
    url: association.website || `https://www.radioamador.info/association/${association.slug}`,
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
      owns: association.repeaters.map((repeater) => ({
        "@type": "Thing",
        name: repeater.callsign,
        description: `Repetidor ${repeater.modulation} - ${repeater.outputFrequency.toFixed(3)} MHz`,
        ...(repeater.latitude && repeater.longitude && {
          geo: {
            "@type": "GeoCoordinates",
            latitude: repeater.latitude,
            longitude: repeater.longitude,
          },
        }),
      })),
    }),
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

  const hasContactInfo =
    association.address || association.website || association.email

  const jsonLd = generateOrganizationJsonLd(association)

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Back Link */}
      <Link
        href="/repetidores"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToRepeaters")}
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <Badge variant="secondary" className="mb-2">
              {association.abbreviation}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold">
              {association.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Contact Info */}
      {hasContactInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {association.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm whitespace-pre-wrap">
                  {association.address}
                </p>
              </div>
            )}
            {association.website && (
              <a
                href={association.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-primary hover:underline"
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm">{association.website}</span>
                <ExternalLink className="h-4 w-4 opacity-50" />
              </a>
            )}
            {association.email && (
              <a
                href={`mailto:${association.email}`}
                className="flex items-center gap-3 text-primary hover:underline"
              >
                <Mail className="h-5 w-5" />
                <span className="text-sm">{association.email}</span>
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Associated Repeaters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            {t("repeaters")} ({association.repeaters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {association.repeaters.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noRepeaters")}</p>
          ) : (
            <div className="space-y-2">
              {association.repeaters.map((repeater) => (
                <Link
                  key={repeater.callsign}
                  href={`/repeater/${encodeURIComponent(repeater.callsign)}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {repeater.status === "offline" && (
                      <span
                        title={t("statusOffline")}
                        className="inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      >
                        ✕
                      </span>
                    )}
                    {repeater.status === "maintenance" && (
                      <span
                        title={t("statusMaintenance")}
                        className="inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      >
                        !
                      </span>
                    )}
                    <div>
                      <p className="font-medium">{repeater.callsign}</p>
                      <p className="text-xs text-muted-foreground">
                        {repeater.outputFrequency.toFixed(3)} MHz -{" "}
                        {repeater.modulation}
                      </p>
                    </div>
                  </div>
                  {repeater.qth_locator && (
                    <Badge variant="outline" className="text-xs">
                      {repeater.qth_locator}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default async function AssociationDetailPage({ params }: PageProps) {
  const { slug } = await params
  const t = await getTranslations("association")

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<AssociationPageSkeleton />}>
        <AssociationContent slug={slug} t={t} />
      </Suspense>
    </main>
  )
}
