import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alfabeto Fonético NATO",
  description: "Referência e treino do alfabeto fonético NATO/ICAO. Pratique a soletração fonética usada em comunicações de rádio.",
  keywords: ["alfabeto NATO", "alfabeto fonético", "ICAO", "soletração", "radioamador", "comunicações"],
  alternates: {
    canonical: "/nato",
  },
  openGraph: {
    title: "Alfabeto Fonético NATO",
    description: "Referência e treino do alfabeto fonético NATO/ICAO. Pratique a soletração fonética usada em comunicações de rádio.",
    type: "website",
    url: "/nato",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.png", width: 1536, height: 1024, alt: "Alfabeto Fonético NATO" }],
  },
  twitter: {
    card: "summary",
    title: "Alfabeto Fonético NATO",
    description: "Referência e treino do alfabeto fonético NATO/ICAO.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "Alfabeto NATO", url: "https://www.radioamador.info/nato" },
];

const faqItems = [
  {
    question: "O que é o alfabeto fonético NATO?",
    answer: "O alfabeto fonético NATO (também conhecido como alfabeto ICAO) é um sistema de soletração que usa palavras padronizadas para representar cada letra do alfabeto. Por exemplo, A = Alpha, B = Bravo, C = Charlie.",
  },
  {
    question: "Porque é importante usar o alfabeto fonético?",
    answer: "O alfabeto fonético é essencial em comunicações de rádio para evitar mal-entendidos causados por letras que soam semelhantes (como B, D, E, P, T). Garante clareza mesmo em condições de transmissão difíceis.",
  },
  {
    question: "O alfabeto fonético é universal?",
    answer: "O alfabeto fonético NATO/ICAO é o padrão internacional usado na aviação, marinha, forças armadas e radioamadorismo em todo o mundo, embora existam variações regionais.",
  },
];

export default function NATOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Alfabeto Fonético NATO"
        description="Referência e treino do alfabeto fonético NATO/ICAO. Pratique a soletração fonética usada em comunicações de rádio."
        url="https://www.radioamador.info/nato"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
