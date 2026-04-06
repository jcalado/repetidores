import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { fetchSimplexFrequencies } from "@/lib/simplex-frequencies"
import SimplexBrowser from "@/components/SimplexBrowser"
import { StandardPageHeader } from "@/components/ui/PageHeader"
import { Radio, Antenna } from "lucide-react"

export async function generateMetadata() {
  const t = await getTranslations("simplex")
  return {
    title: t("title"),
    description: t("description"),
    keywords: ["simplex", "frequências", "radioamador", "ham radio", "Portugal", "VHF", "UHF"],
    alternates: {
      canonical: "/simplex/",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      url: "/simplex/",
      siteName: "Radioamador.info",
      locale: "pt_PT",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: t("title") }],
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("description"),
      images: ["/og-default.png"],
    },
  }
}

function SimplexPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ship-cove-100 to-ship-cove-50 dark:from-ship-cove-900 dark:to-ship-cove-950 p-8 animate-pulse">
        <div className="h-8 w-64 bg-ship-cove-200 dark:bg-ship-cove-800 rounded mb-3" />
        <div className="h-5 w-96 bg-ship-cove-200 dark:bg-ship-cove-800 rounded" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-12 border-b bg-muted/30 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

async function SimplexContent() {
  const t = await getTranslations("simplex")
  let frequencies: Awaited<ReturnType<typeof fetchSimplexFrequencies>> = []

  try {
    frequencies = await fetchSimplexFrequencies()
  } catch {
    // API may not be available yet; render empty state
  }

  return (
    <>
      <StandardPageHeader
        icon={<Radio className="h-7 w-7" />}
        title={t("title")}
        description={t("description")}
        stats={[
          {
            icon: <Radio className="h-4 w-4" />,
            value: frequencies.length,
            label: t("frequencies"),
          },
        ]}
        floatingIcons={[
          <Radio key="radio" className="h-12 w-12 text-white" />,
          <Antenna key="antenna" className="h-10 w-10 text-white" />,
        ]}
      />

      {frequencies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Radio className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t("noFrequencies")}</p>
        </div>
      ) : (
        <SimplexBrowser data={frequencies} />
      )}
    </>
  )
}

export default async function SimplexPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<SimplexPageSkeleton />}>
        <SimplexContent />
      </Suspense>
    </main>
  )
}
