import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Satélites de Radioamador",
  description: "Informações sobre satélites de radioamador ativos. Frequências, modos e passes visíveis em Portugal.",
  keywords: ["satélites", "OSCAR", "radioamador", "frequências", "passes", "downlink", "uplink"],
  alternates: {
    canonical: "/satelites/",
  },
  openGraph: {
    title: "Satélites de Radioamador",
    description: "Informações sobre satélites de radioamador ativos. Frequências, modos e passes visíveis em Portugal.",
    type: "website",
    url: "/satelites/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Satélites de Radioamador" }],
  },
  twitter: {
    card: "summary",
    title: "Satélites de Radioamador",
    description: "Informações sobre satélites de radioamador ativos.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info/" },
  { name: "Satélites", url: "https://www.radioamador.info/satelites/" },
];

const faqItems = [
  {
    question: "O que são satélites OSCAR?",
    answer: "OSCAR (Orbiting Satellite Carrying Amateur Radio) é a designação para satélites de radioamador. Desde o OSCAR 1 em 1961, centenas de satélites foram lançados. Permitem comunicações globais, mesmo com equipamento modesto, através de transponders lineares ou repetidores FM.",
  },
  {
    question: "Que equipamento é necessário para comunicar via satélite?",
    answer: "Para satélites FM (como SO-50, ISS), um rádio VHF/UHF portátil com 5W e uma antena direcional simples (como uma Yagi de mão) são suficientes. Para satélites com transponders lineares, é recomendado equipamento com modos SSB/CW e antenas com tracking automático.",
  },
  {
    question: "O que é o efeito Doppler em comunicações por satélite?",
    answer: "Devido à velocidade dos satélites em órbita baixa (cerca de 28.000 km/h), a frequência recebida varia durante o passe. No início do passe, a frequência é mais alta; no fim, mais baixa. Esta variação pode chegar a ±10 kHz em VHF e requer compensação durante o contacto.",
  },
];

export default function SatelitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Satélites de Radioamador"
        description="Informações sobre satélites de radioamador ativos. Frequências, modos e passes visíveis em Portugal."
        url="https://www.radioamador.info/satelites/"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
