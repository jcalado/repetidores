import RepeaterView from "./RepeaterView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista de Repetidores",
  description: "Pesquise e filtre repetidores de rádio amador em Portugal. Visualize em tabela ou mapa interativo.",
  alternates: {
    canonical: "/repetidores",
  },
  openGraph: {
    title: "Lista de Repetidores",
    description: "Pesquise e filtre repetidores de rádio amador em Portugal. Visualize em tabela ou mapa interativo.",
    type: "website",
    url: "/repetidores",
    siteName: "Repetidores",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary",
    title: "Lista de Repetidores",
    description: "Pesquise e filtre repetidores de rádio amador em Portugal. Visualize em tabela ou mapa interativo.",
  },
};

export default function RepetidoresTablePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <RepeaterView view="table" />
    </div>
  );
}
