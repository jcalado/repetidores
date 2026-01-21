import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plano de Bandas",
  description: "Informação sobre as bandas de radioamador e suas frequências em Portugal. QNAF, IARU R1 e potências máximas.",
  keywords: ["bandas", "frequências", "QNAF", "IARU", "HF", "VHF", "UHF", "radioamador", "Portugal"],
  alternates: {
    canonical: "/bands",
  },
  openGraph: {
    title: "Plano de Bandas",
    description: "Informação sobre as bandas de radioamador e suas frequências em Portugal. QNAF, IARU R1 e potências máximas.",
    type: "website",
    url: "/bands",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Plano de Bandas" }],
  },
  twitter: {
    card: "summary",
    title: "Plano de Bandas",
    description: "Informação sobre as bandas de radioamador e suas frequências em Portugal.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "Plano de Bandas", url: "https://www.radioamador.info/bands" },
];

const faqItems = [
  {
    question: "O que é o QNAF?",
    answer: "O QNAF (Quadro Nacional de Atribuição de Frequências) é o documento oficial português que define quais frequências podem ser usadas pelo serviço de amador em Portugal, conforme regulamentação da ANACOM.",
  },
  {
    question: "Qual é a diferença entre bandas HF, VHF e UHF?",
    answer: "HF (High Frequency) vai de 3 a 30 MHz e permite comunicações de longa distância. VHF (Very High Frequency) vai de 30 a 300 MHz, ideal para comunicações locais e repetidores. UHF (Ultra High Frequency) vai de 300 MHz a 3 GHz, usado para repetidores e comunicações digitais.",
  },
  {
    question: "Qual é a potência máxima permitida em Portugal?",
    answer: "A potência máxima varia consoante a categoria de licença e a banda. Operadores de categoria 1 podem usar até 1500W em algumas bandas HF, enquanto categoria 2 está limitada a 200W. Consulte a tabela de potências para detalhes específicos.",
  },
];

export default function BandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Plano de Bandas"
        description="Informação sobre as bandas de radioamador e suas frequências em Portugal. QNAF, IARU R1 e potências máximas."
        url="https://www.radioamador.info/bands"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
