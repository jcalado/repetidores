import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora QTH Locator",
  description: "Converta coordenadas GPS para QTH Locator (Maidenhead) e vice-versa. Ferramenta útil para radioamadores.",
  keywords: ["QTH", "Maidenhead", "locator", "coordenadas", "GPS", "radioamador", "grid square"],
  alternates: {
    canonical: "/qth",
  },
  openGraph: {
    title: "Calculadora QTH Locator",
    description: "Converta coordenadas GPS para QTH Locator (Maidenhead) e vice-versa. Ferramenta útil para radioamadores.",
    type: "website",
    url: "/qth",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.png", width: 512, height: 512, alt: "Calculadora QTH Locator" }],
  },
  twitter: {
    card: "summary",
    title: "Calculadora QTH Locator",
    description: "Converta coordenadas GPS para QTH Locator e vice-versa.",
    images: ["/og-default.png"],
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info" },
  { name: "Calculadora QTH Locator", url: "https://www.radioamador.info/qth" },
];

export default function QTHLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Calculadora QTH Locator"
        description="Converta coordenadas GPS para QTH Locator (Maidenhead) e vice-versa. Ferramenta útil para radioamadores."
        url="https://www.radioamador.info/qth"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {children}
    </>
  );
}
