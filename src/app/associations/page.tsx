import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { fetchAssociations } from "@/lib/associations"
import { AssociationsList } from "@/components/associations/AssociationsList"
import { Building2 } from "lucide-react"

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
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-muted rounded" />
      <div className="h-6 w-96 bg-muted rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-40 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  )
}

async function AssociationsContent() {
  const t = await getTranslations("associations")
  const associations = await fetchAssociations()

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {t("count", { count: associations.length })}
        </p>
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
