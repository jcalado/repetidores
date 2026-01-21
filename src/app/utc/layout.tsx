import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relógio UTC",
  description: "Relógio UTC (Tempo Universal Coordenado) em tempo real. Essencial para radioamadores que participam em contests e contactos DX.",
  keywords: ["UTC", "hora UTC", "tempo universal", "GMT", "radioamador", "contests", "DX"],
  alternates: {
    canonical: "/utc",
  },
  openGraph: {
    title: "Relógio UTC",
    description: "Relógio UTC (Tempo Universal Coordenado) em tempo real. Essencial para radioamadores que participam em contests e contactos DX.",
    type: "website",
    url: "/utc",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.png", width: 512, height: 512, alt: "Relógio UTC" }],
  },
  twitter: {
    card: "summary",
    title: "Relógio UTC",
    description: "Relógio UTC em tempo real para radioamadores.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "Relógio UTC", url: "https://www.radioamador.info/utc" },
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
        url="https://www.radioamador.info/utc"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {children}
    </>
  );
}
