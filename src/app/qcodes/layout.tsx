import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Códigos Q - Referência Completa",
  description: "Lista completa de códigos Q usados em comunicações de rádio. Referência essencial para radioamadores com significados e exemplos.",
  keywords: ["códigos Q", "Q-codes", "QSO", "QTH", "QRZ", "radioamador", "comunicações"],
  alternates: {
    canonical: "/qcodes",
  },
  openGraph: {
    title: "Códigos Q - Referência Completa",
    description: "Lista completa de códigos Q usados em comunicações de rádio. Referência essencial para radioamadores com significados e exemplos.",
    type: "website",
    url: "/qcodes",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.png", width: 512, height: 512, alt: "Códigos Q" }],
  },
  twitter: {
    card: "summary",
    title: "Códigos Q - Referência Completa",
    description: "Lista completa de códigos Q usados em comunicações de rádio.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "Códigos Q", url: "https://www.radioamador.info/qcodes" },
];

const faqItems = [
  {
    question: "O que são os códigos Q?",
    answer: "Os códigos Q são abreviações de três letras começando com 'Q' usadas em comunicações de rádio. Foram desenvolvidos para facilitar comunicações entre operadores de diferentes línguas e agilizar transmissões.",
  },
  {
    question: "Quais são os códigos Q mais usados?",
    answer: "Os códigos Q mais comuns em radioamadorismo incluem: QTH (localização), QSO (contacto), QRZ (quem me chama?), QSL (confirmação de receção), QRM (interferência) e QRN (ruído atmosférico).",
  },
  {
    question: "Os códigos Q são universais?",
    answer: "Sim, os códigos Q são padronizados internacionalmente pela ITU (International Telecommunication Union) e são usados globalmente em comunicações marítimas, aeronáuticas e de radioamador.",
  },
];

export default function QCodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Códigos Q - Referência Completa"
        description="Lista completa de códigos Q usados em comunicações de rádio. Referência essencial para radioamadores com significados e exemplos."
        url="https://www.radioamador.info/qcodes"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
