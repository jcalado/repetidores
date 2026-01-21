import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Satélites de Radioamador",
  description: "Informações sobre satélites de radioamador ativos. Frequências, modos e passes visíveis em Portugal.",
  keywords: ["satélites", "OSCAR", "radioamador", "frequências", "passes", "downlink", "uplink"],
  alternates: {
    canonical: "/satelites",
  },
  openGraph: {
    title: "Satélites de Radioamador",
    description: "Informações sobre satélites de radioamador ativos. Frequências, modos e passes visíveis em Portugal.",
    type: "website",
    url: "/satelites",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.png", width: 512, height: 512, alt: "Satélites de Radioamador" }],
  },
  twitter: {
    card: "summary",
    title: "Satélites de Radioamador",
    description: "Informações sobre satélites de radioamador ativos.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "Satélites", url: "https://www.radioamador.info/satelites" },
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
        url="https://www.radioamador.info/satelites"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {children}
    </>
  );
}
