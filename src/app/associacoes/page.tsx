import { getTranslations } from "next-intl/server"
import { Building2, Radio } from "lucide-react"
import { fetchAssociations } from "@/lib/associations"
import { AssociationsList } from "@/components/associations/AssociationsList"
import { Card, CardContent } from "@/components/ui/card"
import { StandardPageHeader } from "@/components/ui/PageHeader"

export async function generateMetadata() {
  const t = await getTranslations("associations")
  return {
    title: t("title"),
    description: t("subtitle"),
    keywords: ["associações", "radioamador", "ham radio", "Portugal", "clubes", "repetidores"],
    alternates: {
      canonical: "/associacoes/",
    },
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "website",
      url: "/associacoes/",
      siteName: "Radioamador.info",
      locale: "pt_PT",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: t("title") }],
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("subtitle"),
      images: ["/og-default.png"],
    },
  }
}

export default async function AssociationsPage() {
  const t = await getTranslations("associations")
  const associations = await fetchAssociations()
  const totalRepeaters = associations.reduce(
    (sum, a) => sum + (a.repeaterCount ?? 0),
    0
  )

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <Card>
        <CardContent>
          <StandardPageHeader
            icon={<Building2 className="h-5 w-5" />}
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
              },
            ]}
          />
          <AssociationsList associations={associations} />
        </CardContent>
      </Card>
    </main>
  )
}
