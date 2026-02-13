import RepeaterView from "./RepeaterView";
import type { Metadata } from "next";
import { FAQJsonLd } from "@/components/seo";

export const metadata: Metadata = {
  title: "Lista de Repetidores",
  description: "Pesquise e filtre repetidores de rádio amador em Portugal. Visualize em tabela ou mapa interativo.",
  keywords: ["repetidores", "rádio amador", "ham radio", "Portugal", "VHF", "UHF", "DMR", "D-STAR"],
  alternates: {
    canonical: "/repetidores/",
  },
  openGraph: {
    title: "Lista de Repetidores",
    description: "Pesquise e filtre repetidores de rádio amador em Portugal. Visualize em tabela ou mapa interativo.",
    type: "website",
    url: "/repetidores/",
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

const faqItems = [
  {
    question: "O que é um repetidor de rádio amador?",
    answer: "Um repetidor é uma estação de rádio que recebe sinais numa frequência e os retransmite noutra, geralmente a partir de locais elevados, ampliando significativamente o alcance das comunicações entre radioamadores.",
  },
  {
    question: "Como usar um repetidor?",
    answer: "Para usar um repetidor, configure o seu rádio com a frequência de saída (para ouvir) e a frequência de entrada (para transmitir), juntamente com o tom CTCSS correto. A lista nesta página inclui todas as frequências e tons necessários.",
  },
  {
    question: "Que tipos de repetidores existem em Portugal?",
    answer: "Em Portugal existem repetidores FM analógicos nas bandas VHF (2m) e UHF (70cm), bem como repetidores digitais DMR, D-STAR e C4FM. Use os filtros nesta página para encontrar repetidores por tipo de modulação.",
  },
  {
    question: "Preciso de licença para transmitir num repetidor?",
    answer: "Sim, é obrigatório possuir uma licença de radioamador válida emitida pela ANACOM para transmitir em qualquer repetidor. A escuta (receção) é livre e não requer licença.",
  },
];

export default function RepetidoresTablePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <FAQJsonLd items={faqItems} />
      <RepeaterView view="table" />
    </div>
  );
}
