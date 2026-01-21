import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Antenas",
  description: "Calculadora de antenas para radioamadores. Calcule dimensões de antenas dipolo, vertical e outras configurações.",
  keywords: ["antena", "dipolo", "vertical", "calculadora", "radioamador", "dimensões", "frequência"],
  alternates: {
    canonical: "/antenna",
  },
  openGraph: {
    title: "Calculadora de Antenas",
    description: "Calculadora de antenas para radioamadores. Calcule dimensões de antenas dipolo, vertical e outras configurações.",
    type: "website",
    url: "/antenna",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.png", width: 512, height: 512, alt: "Calculadora de Antenas" }],
  },
  twitter: {
    card: "summary",
    title: "Calculadora de Antenas",
    description: "Calculadora de antenas para radioamadores.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "Calculadora de Antenas", url: "https://www.radioamador.info/antenna" },
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
        url="https://www.radioamador.info/antenna"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {children}
    </>
  );
}
