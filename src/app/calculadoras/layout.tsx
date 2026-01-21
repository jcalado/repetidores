import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadoras",
  description: "Ferramentas e calculadoras úteis para radioamadores. dB, SWR, perdas em cabo coaxial, frequência e muito mais.",
  keywords: ["calculadora", "dB", "SWR", "coaxial", "frequência", "potência", "radioamador"],
  alternates: {
    canonical: "/calculadoras",
  },
  openGraph: {
    title: "Calculadoras",
    description: "Ferramentas e calculadoras úteis para radioamadores. dB, SWR, perdas em cabo coaxial, frequência e muito mais.",
    type: "website",
    url: "/calculadoras",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Calculadoras" }],
  },
  twitter: {
    card: "summary",
    title: "Calculadoras",
    description: "Ferramentas e calculadoras úteis para radioamadores.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "Calculadoras", url: "https://www.radioamador.info/calculadoras" },
];

export default function CalculadorasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Calculadoras para Radioamadores"
        description="Ferramentas e calculadoras úteis para radioamadores. dB, SWR, perdas em cabo coaxial, frequência e muito mais."
        url="https://www.radioamador.info/calculadoras"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {children}
    </>
  );
}
