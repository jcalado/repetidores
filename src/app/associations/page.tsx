import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { fetchAssociations } from "@/lib/associations"
import { AssociationsList } from "@/components/associations/AssociationsList"
import { Building2, Radio, Antenna } from "lucide-react"

export async function generateMetadata() {
  const t = await getTranslations("associations")
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: "/associations",
    },
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "website",
      url: "/associations",
      siteName: "Repetidores",
      locale: "pt_PT",
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
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ship-cove-600 via-ship-cove-700 to-ship-cove-800 dark:from-ship-cove-800 dark:via-ship-cove-900 dark:to-ship-cove-950 p-8 mb-8 shadow-xl shadow-ship-cove-500/20">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" className="text-white" />
          </svg>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-ship-cove-500/20 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-ship-cove-400/20 blur-xl" />

        {/* Floating icons */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 opacity-20">
          <Radio className="h-12 w-12 text-white" />
          <Antenna className="h-10 w-10 text-white" />
        </div>

        <div className="relative">
          {/* Icon and title */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {t("title")}
              </h1>
            </div>
          </div>

          <p className="text-ship-cove-100 text-lg max-w-2xl mb-6">
            {t("subtitle")}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-white">
              <Building2 className="h-4 w-4" />
              <span className="font-mono font-bold tabular-nums">{associations.length}</span>
              <span className="text-ship-cove-200 text-sm">associações</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 backdrop-blur-sm text-emerald-100">
              <Radio className="h-4 w-4" />
              <span className="font-mono font-bold tabular-nums">{totalRepeaters}</span>
              <span className="text-emerald-200/80 text-sm">repetidores</span>
            </div>
          </div>
        </div>
      </header>

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
