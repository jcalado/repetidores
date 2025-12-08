import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plano de Bandas",
  description: "Informação sobre as bandas de radioamador e suas frequências em Portugal. QNAF, IARU R1 e potências máximas.",
  alternates: {
    canonical: "/bands",
  },
  openGraph: {
    title: "Plano de Bandas",
    description: "Informação sobre as bandas de radioamador e suas frequências em Portugal. QNAF, IARU R1 e potências máximas.",
    type: "website",
    url: "/bands",
    siteName: "Repetidores",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary",
    title: "Plano de Bandas",
    description: "Informação sobre as bandas de radioamador e suas frequências em Portugal.",
  },
};

export default function BandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
