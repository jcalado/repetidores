import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Antenas",
  description: "Calculadora de antenas para radioamadores. Calcule dimensões de antenas dipolo, vertical e outras configurações.",
  keywords: ["antena", "dipolo", "vertical", "calculadora", "radioamador", "dimensões", "frequência"],
  alternates: {
    canonical: "/antenna/",
  },
  openGraph: {
    title: "Calculadora de Antenas",
    description: "Calculadora de antenas para radioamadores. Calcule dimensões de antenas dipolo, vertical e outras configurações.",
    type: "website",
    url: "/antenna/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Calculadora de Antenas" }],
  },
  twitter: {
    card: "summary",
    title: "Calculadora de Antenas",
    description: "Calculadora de antenas para radioamadores.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info/" },
  { name: "Calculadora de Antenas", url: "https://www.radioamador.info/antenna/" },
];

const faqItems = [
  {
    question: "Como calcular o comprimento de uma antena dipolo?",
    answer: "O comprimento total de um dipolo de meia onda calcula-se pela fórmula: L (metros) = 143 / frequência (MHz). Por exemplo, para 7.1 MHz (40m), o comprimento total seria aproximadamente 20.14 metros. Cada braço do dipolo terá metade deste valor.",
  },
  {
    question: "O que é uma antena vertical de quarto de onda?",
    answer: "Uma antena vertical de quarto de onda tem um elemento vertical com 1/4 do comprimento de onda e requer um plano de terra (radiais). O comprimento calcula-se por: L (metros) = 71.5 / frequência (MHz). É popular em HF pela sua omnidirecionalidade e ângulo de radiação baixo.",
  },
  {
    question: "Qual é o fator de velocidade e porque é importante?",
    answer: "O fator de velocidade indica a velocidade de propagação do sinal num condutor comparada com a velocidade da luz no vácuo. Para fio de cobre nu é cerca de 0.95. Este fator afeta o comprimento real das antenas, que será ligeiramente menor que o cálculo teórico.",
  },
];

export default function AntennaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Calculadora de Antenas"
        description="Calculadora de antenas para radioamadores. Calcule dimensões de antenas dipolo, vertical e outras configurações."
        url="https://www.radioamador.info/antenna/"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
