import RepeaterView from "./RepeaterView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista de Repetidores",
  description: "Pesquise e filtre repetidores de rádio amador em Portugal. Visualize em tabela ou mapa interativo.",
  keywords: ["repetidores", "rádio amador", "ham radio", "Portugal", "VHF", "UHF", "DMR", "D-STAR"],
  alternates: {
    canonical: "/repetidores",
  },
  openGraph: {
    title: "Lista de Repetidores",
    description: "Pesquise e filtre repetidores de rádio amador em Portugal. Visualize em tabela ou mapa interativo.",
    type: "website",
    url: "/repetidores",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Lista de Repetidores" }],
  },
  twitter: {
    card: "summary",
    title: "Lista de Repetidores",
    description: "Pesquise e filtre repetidores de rádio amador em Portugal. Visualize em tabela ou mapa interativo.",
    images: ["/og-default.png"],
  },
};

export default function RepetidoresTablePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <RepeaterView view="table" />
    </div>
  );
}
