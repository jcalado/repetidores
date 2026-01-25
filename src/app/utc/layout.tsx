import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relógio UTC",
  description: "Relógio UTC (Tempo Universal Coordenado) em tempo real. Essencial para radioamadores que participam em contests e contactos DX.",
  keywords: ["UTC", "hora UTC", "tempo universal", "GMT", "radioamador", "contests", "DX"],
  alternates: {
    canonical: "/utc/",
  },
  openGraph: {
    title: "Relógio UTC",
    description: "Relógio UTC (Tempo Universal Coordenado) em tempo real. Essencial para radioamadores que participam em contests e contactos DX.",
    type: "website",
    url: "/utc/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Relógio UTC" }],
  },
  twitter: {
    card: "summary",
    title: "Relógio UTC",
    description: "Relógio UTC em tempo real para radioamadores.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info/" },
  { name: "Relógio UTC", url: "https://www.radioamador.info/utc/" },
];

const faqItems = [
  {
    question: "O que é UTC e porque é usado em radioamadorismo?",
    answer: "UTC (Tempo Universal Coordenado) é o padrão de tempo mundial usado como referência. Em radioamadorismo, o UTC é essencial porque permite que operadores em diferentes fusos horários comuniquem horários de forma inequívoca, especialmente em contests, logs de contactos e schedules.",
  },
  {
    question: "Qual é a diferença entre UTC e hora de Portugal?",
    answer: "Portugal Continental usa WET (Western European Time) que é igual a UTC no inverno. No verão, com o horário de verão (WEST), Portugal está a UTC+1. Os Açores estão a UTC-1 no inverno e UTC no verão. A Madeira segue o mesmo fuso de Portugal Continental.",
  },
  {
    question: "Porque os logs de radioamador usam UTC?",
    answer: "Os logs usam UTC para garantir consistência mundial. Quando dois operadores fazem um contacto, ambos registam a mesma hora UTC, independentemente da sua localização. Isto é crucial para confirmar QSOs em concursos, diplomas e verificação de contactos via sistemas como LoTW.",
  },
];

export default function UTCLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Relógio UTC"
        description="Relógio UTC (Tempo Universal Coordenado) em tempo real. Essencial para radioamadores que participam em contests e contactos DX."
        url="https://www.radioamador.info/utc/"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
