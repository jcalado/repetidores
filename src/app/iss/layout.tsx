import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ISS - Estação Espacial Internacional",
  description: "Contactos de radioamador com a ISS. Frequências, passes e informações para contactar a Estação Espacial Internacional.",
  keywords: ["ISS", "Estação Espacial", "ARISS", "radioamador", "passes", "frequências", "espaço"],
  alternates: {
    canonical: "/iss",
  },
  openGraph: {
    title: "ISS - Estação Espacial Internacional",
    description: "Contactos de radioamador com a ISS. Frequências, passes e informações para contactar a Estação Espacial Internacional.",
    type: "website",
    url: "/iss",
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
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "ISS", url: "https://www.radioamador.info/iss" },
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
        url="https://www.radioamador.info/iss"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {children}
    </>
  );
}
