import { StandardPageHeader } from "@/components/ui/PageHeader"
import { IdCard, Users } from "lucide-react"
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

export default function IndicativosPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <StandardPageHeader
        icon={<IdCard className="h-7 w-7" />}
        title="Indicativos"
        description="Directório de indicativos de radioamador em Portugal"
        floatingIcons={[
          <IdCard key="id" className="h-12 w-12 text-white" />,
          <Users key="users" className="h-10 w-10 text-white" />,
        ]}
      />

      <IndicativosContent />
    </main>
  )
}
