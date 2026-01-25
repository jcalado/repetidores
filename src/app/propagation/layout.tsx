import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Propagação",
  description: "Condições de propagação de rádio e índices solares em tempo real. SFI, índice K, índice A e previsões de bandas.",
  keywords: ["propagação", "SFI", "índice K", "índice A", "solar", "HF", "bandas", "radioamador"],
  alternates: {
    canonical: "/propagation/",
  },
  openGraph: {
    title: "Propagação",
    description: "Condições de propagação de rádio e índices solares em tempo real. SFI, índice K, índice A e previsões de bandas.",
    type: "website",
    url: "/propagation/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Propagação" }],
  },
  twitter: {
    card: "summary",
    title: "Propagação",
    description: "Condições de propagação de rádio e índices solares em tempo real.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info/" },
  { name: "Propagação", url: "https://www.radioamador.info/propagation/" },
];

const faqItems = [
  {
    question: "O que é o SFI (Solar Flux Index)?",
    answer: "O SFI (Solar Flux Index) é uma medida da atividade solar que indica a densidade do fluxo de rádio solar a 2800 MHz. Valores mais altos (acima de 100) geralmente indicam melhores condições de propagação nas bandas de HF, especialmente nas frequências mais altas como 10m e 15m.",
  },
  {
    question: "O que significa o índice K para radioamadores?",
    answer: "O índice K mede a atividade geomagnética numa escala de 0 a 9. Valores baixos (0-2) indicam condições calmas e boas para propagação HF. Valores altos (5+) indicam tempestades geomagnéticas que podem degradar ou bloquear completamente a propagação HF, mas podem abrir propagação auroral.",
  },
  {
    question: "Como afeta a propagação os contactos em HF?",
    answer: "A propagação HF depende da ionosfera refletir as ondas de rádio de volta à Terra. Durante o dia, as bandas mais altas (10m-20m) funcionam melhor. À noite, as bandas mais baixas (40m-80m) propagam melhor. O ciclo solar de 11 anos afeta significativamente as condições, com máximos solares favorecendo frequências mais altas.",
  },
];

export default function PropagationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Propagação"
        description="Condições de propagação de rádio e índices solares em tempo real. SFI, índice K, índice A e previsões de bandas."
        url="https://www.radioamador.info/propagation/"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
