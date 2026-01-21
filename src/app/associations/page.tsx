import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { fetchAssociations } from "@/lib/associations"
import { AssociationsList } from "@/components/associations/AssociationsList"
import { StandardPageHeader } from "@/components/ui/PageHeader"
import { Building2, Radio, Antenna } from "lucide-react"

export async function generateMetadata() {
  const t = await getTranslations("associations")
  return {
    title: t("title"),
    description: t("subtitle"),
    keywords: ["associações", "radioamador", "ham radio", "Portugal", "clubes", "repetidores"],
    alternates: {
      canonical: "/associations",
    },
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "website",
      url: "/associations",
      siteName: "Radioamador.info",
      locale: "pt_PT",
      images: [{ url: "/og-default.png", width: 1536, height: 1024, alt: t("title") }],
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("subtitle"),
      images: ["/og-default.png"],
    },
  }
}

function AssociationsPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ship-cove-100 to-ship-cove-50 dark:from-ship-cove-900 dark:to-ship-cove-950 p-8 animate-pulse">
        <div className="h-8 w-64 bg-ship-cove-200 dark:bg-ship-cove-800 rounded mb-3" />
        <div className="h-5 w-96 bg-ship-cove-200 dark:bg-ship-cove-800 rounded" />
      </div>

      {/* Search skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-10 w-80 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-lg" />
        <div className="flex gap-3">
          <div className="h-8 w-20 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-full" />
          <div className="h-8 w-32 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-full" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-44 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-xl"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

async function AssociationsContent() {
  const t = await getTranslations("associations")
  const associations = await fetchAssociations()

  // Calculate stats
  const totalRepeaters = associations.reduce(
    (sum, a) => sum + (a.repeaterCount ?? 0),
    0
  )

  return (
    <>
      <StandardPageHeader
        icon={<Building2 className="h-7 w-7" />}
        title={t("title")}
        description={t("subtitle")}
        stats={[
          {
            icon: <Building2 className="h-4 w-4" />,
            value: associations.length,
            label: "associações",
          },
          {
            icon: <Radio className="h-4 w-4" />,
            value: totalRepeaters,
            label: "repetidores",
            variant: "success",
          },
        ]}
        floatingIcons={[
          <Radio key="radio" className="h-12 w-12 text-white" />,
          <Antenna key="antenna" className="h-10 w-10 text-white" />,
        ]}
      />

      {/* Associations Grid */}
      <AssociationsList associations={associations} />
    </>
  )
}

export default async function AssociationsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<AssociationsPageSkeleton />}>
        <AssociationsContent />
      </Suspense>
    </main>
  )
}
