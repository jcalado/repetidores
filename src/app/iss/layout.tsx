import { WebPageJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ISS - Estação Espacial Internacional",
  description: "Contactos de radioamador com a ISS. Frequências, passes e informações para contactar a Estação Espacial Internacional.",
  keywords: ["ISS", "Estação Espacial", "ARISS", "radioamador", "passes", "frequências", "espaço"],
  alternates: {
    canonical: "/iss/",
  },
  openGraph: {
    title: "ISS - Estação Espacial Internacional",
    description: "Contactos de radioamador com a ISS. Frequências, passes e informações para contactar a Estação Espacial Internacional.",
    type: "website",
    url: "/iss/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "ISS - Estação Espacial Internacional" }],
  },
  twitter: {
    card: "summary",
    title: "ISS - Estação Espacial Internacional",
    description: "Contactos de radioamador com a ISS.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info/" },
  { name: "ISS", url: "https://www.radioamador.info/iss/" },
];

const faqItems = [
  {
    question: "É possível contactar a ISS com rádio amador?",
    answer: "Sim, a ISS tem uma estação de radioamador (NA1SS) operada pelos astronautas. Contactos são possíveis durante passes com boa elevação. A frequência de downlink é 145.800 MHz FM. Para transmitir, precisa de licença de radioamador e a frequência de uplink é 145.990 MHz.",
  },
  {
    question: "Que equipamento é necessário para ouvir a ISS?",
    answer: "Para apenas ouvir, um rádio VHF que receba 145.800 MHz FM é suficiente. Uma antena omnidirecional funciona, mas uma Yagi direcional melhora significativamente a receção. Muitos radioamadores conseguem ouvir a ISS mesmo com equipamento portátil básico.",
  },
  {
    question: "O que é o programa ARISS?",
    answer: "ARISS (Amateur Radio on the International Space Station) é um programa que coordena contactos de rádio amador entre astronautas na ISS e escolas/grupos. Permite que estudantes façam perguntas diretamente aos astronautas, inspirando interesse em ciência e tecnologia.",
  },
];

export default function ISSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="ISS - Estação Espacial Internacional"
        description="Contactos de radioamador com a ISS. Frequências, passes e informações para contactar a Estação Espacial Internacional."
        url="https://www.radioamador.info/iss/"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FAQJsonLd items={faqItems} />
      {children}
    </>
  );
}
