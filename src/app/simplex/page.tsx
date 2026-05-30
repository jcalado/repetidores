import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { fetchSimplexFrequencies } from "@/lib/simplex-frequencies"
import SimplexBrowser from "@/components/SimplexBrowser"
import { StandardPageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Radio } from "lucide-react"

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
    <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06),0_4px_12px_oklch(0.20_0.012_250/0.04)]">
      <div className="flex items-center gap-3 pb-4">
        <div className="size-9 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="h-3 w-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-1 border-t border-border pt-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-md bg-muted"
            style={{ animationDelay: `${i * 40}ms` }}
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
    <Card>
      <CardContent>
        <StandardPageHeader
          icon={<Radio className="h-5 w-5" />}
          title={t("title")}
          description={t("description")}
          stats={[
            {
              icon: <Radio className="h-4 w-4" />,
              value: frequencies.length,
              label:
                frequencies.length === 1
                  ? t("frequencySingular")
                  : t("frequencyPlural"),
            },
          ]}
        />

        {frequencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Radio className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t("noFrequencies")}</p>
          </div>
        ) : (
          <SimplexBrowser data={frequencies} />
        )}
      </CardContent>
    </Card>
  )
}

export default async function SimplexPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<SimplexPageSkeleton />}>
        <SimplexContent />
      </Suspense>
    </main>
  )
}
