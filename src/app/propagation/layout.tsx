import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Propagação",
  description: "Condições de propagação de rádio e índices solares em tempo real. SFI, índice K, índice A e previsões de bandas.",
  alternates: {
    canonical: "/propagation",
  },
  openGraph: {
    title: "Propagação",
    description: "Condições de propagação de rádio e índices solares em tempo real. SFI, índice K, índice A e previsões de bandas.",
    type: "website",
    url: "/propagation",
    siteName: "Repetidores",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary",
    title: "Propagação",
    description: "Condições de propagação de rádio e índices solares em tempo real.",
  },
};

export default function PropagationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
