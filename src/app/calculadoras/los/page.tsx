import { StandardPageHeader } from "@/components/ui/PageHeader"
import { Eye, Mountain } from "lucide-react"
import LOSCalculator from "@/components/calculadoras/LOSCalculator"

export async function generateMetadata() {
  return {
    title: "Calculadora de Linha de Vista - Radioamador Portugal",
    description: "Calcule a linha de vista (LOS) e análise de zona de Fresnel entre dois pontos",
    keywords: ["linha de vista", "LOS", "line of sight", "Fresnel", "radioamador", "ham radio", "Portugal"],
    alternates: {
      canonical: "/calculadoras/los/",
    },
    openGraph: {
      title: "Calculadora de Linha de Vista - Radioamador Portugal",
      description: "Calcule a linha de vista (LOS) e análise de zona de Fresnel entre dois pontos",
      type: "website",
      url: "/calculadoras/los/",
      siteName: "Radioamador.info",
      locale: "pt_PT",
    },
  }
}

export default function LOSCalculatorPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <StandardPageHeader
        icon={<Eye className="h-7 w-7" />}
        title="Calculadora de Linha de Vista"
        description="Calcule a linha de vista (LOS) e análise de zona de Fresnel entre dois pontos"
        floatingIcons={[
          <Eye key="eye" className="h-12 w-12 text-white" />,
          <Mountain key="mountain" className="h-10 w-10 text-white" />,
        ]}
      />

      <LOSCalculator />
    </main>
  )
}
