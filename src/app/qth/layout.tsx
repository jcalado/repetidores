import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora QTH Locator",
  description: "Converta coordenadas GPS para QTH Locator (Maidenhead) e vice-versa. Ferramenta útil para radioamadores.",
  keywords: ["QTH", "Maidenhead", "locator", "coordenadas", "GPS", "radioamador", "grid square"],
  alternates: {
    canonical: "/qth/",
  },
  openGraph: {
    title: "Calculadora QTH Locator",
    description: "Converta coordenadas GPS para QTH Locator (Maidenhead) e vice-versa. Ferramenta útil para radioamadores.",
    type: "website",
    url: "/qth/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Calculadora QTH Locator" }],
  },
  twitter: {
    card: "summary",
    title: "Calculadora QTH Locator",
    description: "Converta coordenadas GPS para QTH Locator e vice-versa.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info/" },
  { name: "Calculadora QTH Locator", url: "https://www.radioamador.info/qth/" },
];

const faqItems = [
  {
    question: "O que é o sistema Maidenhead Locator?",
    answer: "O sistema Maidenhead (ou QTH Locator) divide a Terra em quadrículas usando letras e números. Um locator como 'IN50' ou 'IM58kq' identifica uma área geográfica. É mais fácil de comunicar por rádio do que coordenadas GPS e é usado mundialmente em radioamadorismo.",
  },
  {
    question: "Como funciona a estrutura do QTH Locator?",
    answer: "O locator tem até 8 caracteres em pares: os primeiros 2 (AA-RR) definem o 'field' (20°x10°), os seguintes 2 (00-99) o 'square' (2°x1°), depois (aa-xx) o 'subsquare' (5'x2.5'). Cada nível aumenta a precisão. Para a maioria dos contactos, 6 caracteres (ex: IM58kq) são suficientes.",
  },
  {
    question: "Porque é o QTH Locator importante em contests?",
    answer: "Em muitos contests VHF/UHF, a pontuação é calculada pela distância entre estações. O QTH Locator permite calcular rapidamente esta distância. Trocar locators de 6 caracteres dá precisão suficiente para scoring, mantendo o QSO rápido e eficiente.",
  },
];

export default function QTHLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Calculadora QTH Locator"
        description="Converta coordenadas GPS para QTH Locator (Maidenhead) e vice-versa. Ferramenta útil para radioamadores."
        url="https://www.radioamador.info/qth/"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
