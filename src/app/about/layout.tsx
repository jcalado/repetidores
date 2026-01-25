import type { Metadata } from "next";
import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Informação sobre o projeto Radioamador.info - diretório de repetidores de radioamadorismo em Portugal.",
  alternates: {
    canonical: "/about/",
  },
  openGraph: {
    title: "Sobre o Radioamador.info",
    description: "Informação sobre o projeto Radioamador.info - diretório de repetidores de radioamadorismo em Portugal.",
    type: "website",
    url: "/about/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary",
    title: "Sobre o Radioamador.info",
    description: "Informação sobre o projeto Radioamador.info.",
  },
};

const breadcrumbs = [
  { name: "Início", url: "https://www.radioamador.info/" },
  { name: "Sobre", url: "https://www.radioamador.info/about/" },
];

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebPageJsonLd
        name="Sobre o Radioamador.info"
        description="Informação sobre o projeto Radioamador.info - diretório de repetidores de radioamadorismo em Portugal."
        url="https://www.radioamador.info/about/"
        breadcrumb={breadcrumbs}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {children}
    </>
  );
}
