import RepeaterView from "../RepeaterView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapa de Repetidores",
  description: "Mapa interativo de repetidores de rádio amador em Portugal. Visualize a localização dos repetidores VHF, UHF, DMR e D-STAR.",
  keywords: ["mapa repetidores", "rádio amador", "ham radio", "Portugal", "VHF", "UHF", "DMR", "D-STAR", "mapa"],
  alternates: {
    canonical: "/repetidores/mapa/",
  },
  openGraph: {
    title: "Mapa de Repetidores",
    description: "Mapa interativo de repetidores de rádio amador em Portugal. Visualize a localização dos repetidores VHF, UHF, DMR e D-STAR.",
    type: "website",
    url: "/repetidores/mapa/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Mapa de Repetidores" }],
  },
  twitter: {
    card: "summary",
    title: "Mapa de Repetidores",
    description: "Mapa interativo de repetidores de rádio amador em Portugal.",
    images: ["/og-default.png"],
  },
};

export default function RepetidoresMapaPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <RepeaterView view="map" />
    </div>
  );
}
