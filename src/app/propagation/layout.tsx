import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo";
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
      {children}
    </>
  );
}
