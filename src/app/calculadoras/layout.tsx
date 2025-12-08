import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadoras",
  description: "Ferramentas e calculadoras úteis para radioamadores. dB, SWR, perdas em cabo coaxial, frequência e muito mais.",
  alternates: {
    canonical: "/calculadoras",
  },
  openGraph: {
    title: "Calculadoras",
    description: "Ferramentas e calculadoras úteis para radioamadores. dB, SWR, perdas em cabo coaxial, frequência e muito mais.",
    type: "website",
    url: "/calculadoras",
    siteName: "Repetidores",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary",
    title: "Calculadoras",
    description: "Ferramentas e calculadoras úteis para radioamadores.",
  },
};

export default function CalculadorasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
