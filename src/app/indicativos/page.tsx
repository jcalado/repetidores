import { Suspense } from "react"
import { StandardPageHeader } from "@/components/ui/PageHeader"
import { fetchCallsignStats } from "@/lib/callsigns"
import { IdCard, Users, RefreshCw } from "lucide-react"
import { IndicativosContent } from "./IndicativosContent"

export async function generateMetadata() {
  return {
    title: "Indicativos - Radioamador Portugal",
    description: "Directório de indicativos de radioamador em Portugal (ANACOM EIA)",
    keywords: ["indicativos", "callsigns", "radioamador", "ham radio", "Portugal", "ANACOM"],
    alternates: {
      canonical: "/indicativos/",
    },
    openGraph: {
      title: "Indicativos - Radioamador Portugal",
      description: "Directório de indicativos de radioamador em Portugal (ANACOM EIA)",
      type: "website",
      url: "/indicativos/",
      siteName: "Radioamador.info",
      locale: "pt_PT",
    },
  }
}

function IndicativosSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ship-cove-100 to-ship-cove-50 dark:from-ship-cove-900 dark:to-ship-cove-950 p-8 animate-pulse">
        <div className="h-8 w-64 bg-ship-cove-200 dark:bg-ship-cove-800 rounded mb-3" />
        <div className="h-5 w-96 bg-ship-cove-200 dark:bg-ship-cove-800 rounded" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-white dark:bg-slate-800 rounded-lg border animate-pulse"
            style={{ animationDelay: `${i * 30}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

async function IndicativosPageContent() {
  let stats
  try {
    stats = await fetchCallsignStats()
  } catch {
    stats = {
      total: 0,
      byEstado: {},
      byCategoria: {},
      byDistrito: {},
      newThisMonth: 0,
      changesThisMonth: 0,
      lastSyncAt: null,
    }
  }

  return (
    <>
      <StandardPageHeader
        icon={<IdCard className="h-7 w-7" />}
        title="Indicativos"
        description="Directório de indicativos de radioamador em Portugal"
        stats={stats.lastSyncAt ? [
          {
            icon: <RefreshCw className="h-4 w-4" />,
            value: new Date(stats.lastSyncAt).toLocaleDateString("pt-PT", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }) + ", " + new Date(stats.lastSyncAt).toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            label: "última sincronização",
          },
        ] : undefined}
        floatingIcons={[
          <IdCard key="id" className="h-12 w-12 text-white" />,
          <Users key="users" className="h-10 w-10 text-white" />,
        ]}
      />

      <IndicativosContent initialStats={stats} />
    </>
  )
}

export default async function IndicativosPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<IndicativosSkeleton />}>
        <IndicativosPageContent />
      </Suspense>
    </main>
  )
}
