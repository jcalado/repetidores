import SatelliteTrackerClient from "./SatelliteTrackerClient"

export async function generateMetadata() {
  return {
    title: "Satélites - Radioamador Portugal",
    description: "Rastreio de satélites de radioamador em tempo real com previsão de passagens",
    keywords: ["satélites", "satellites", "ISS", "radioamador", "ham radio", "Portugal", "rastreio"],
    alternates: {
      canonical: "/satelites/",
    },
    openGraph: {
      title: "Satélites - Radioamador Portugal",
      description: "Rastreio de satélites de radioamador em tempo real com previsão de passagens",
      type: "website",
      url: "/satelites/",
      siteName: "Radioamador.info",
      locale: "pt_PT",
    },
  }
}

export default function SatelitesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <SatelliteTrackerClient />
    </main>
  )
}
