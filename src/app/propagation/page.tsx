import PropagationClient from "./PropagationClient"

export async function generateMetadata() {
  return {
    title: "Propagação - Radioamador Portugal",
    description: "Condições de propagação em tempo real para Portugal",
    keywords: ["propagação", "propagation", "HF", "VHF", "solar", "radioamador", "ham radio", "Portugal"],
    alternates: {
      canonical: "/propagation/",
    },
    openGraph: {
      title: "Propagação - Radioamador Portugal",
      description: "Condições de propagação em tempo real para Portugal",
      type: "website",
      url: "/propagation/",
      siteName: "Radioamador.info",
      locale: "pt_PT",
    },
  }
}

export default function PropagationPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <PropagationClient />
    </main>
  )
}
