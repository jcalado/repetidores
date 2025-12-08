import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora QTH Locator",
  description: "Converta coordenadas GPS para QTH Locator (Maidenhead) e vice-versa. Ferramenta útil para radioamadores.",
  alternates: {
    canonical: "/qth",
  },
  openGraph: {
    title: "Calculadora QTH Locator",
    description: "Converta coordenadas GPS para QTH Locator (Maidenhead) e vice-versa. Ferramenta útil para radioamadores.",
    type: "website",
    url: "/qth",
    siteName: "Repetidores",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary",
    title: "Calculadora QTH Locator",
    description: "Converta coordenadas GPS para QTH Locator e vice-versa.",
  },
};

export default function QTHLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
