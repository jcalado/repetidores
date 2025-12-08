import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Informação sobre o projeto Repetidores - diretório de repetidores de radioamadorismo em Portugal.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Sobre o Radioamador.info",
    description: "Informação sobre o projeto Radioamador.info - diretório de repetidores de radioamadorismo em Portugal.",
    type: "website",
    url: "/about",
    siteName: "Radioamador.info",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary",
    title: "Sobre o Radioamador.info",
    description: "Informação sobre o projeto Radioamador.info.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
