import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Repetidor Mais Próximo",
  description: "Encontre o repetidor de rádio amador mais próximo da sua localização em Portugal. Localização automática por GPS.",
  keywords: ["repetidor mais próximo", "rádio amador", "ham radio", "Portugal", "VHF", "UHF", "GPS", "localização"],
  alternates: {
    canonical: "/repetidores/proximo/",
  },
  openGraph: {
    title: "Repetidor Mais Próximo",
    description: "Encontre o repetidor de rádio amador mais próximo da sua localização em Portugal.",
    type: "website",
    url: "/repetidores/proximo/",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Repetidor Mais Próximo" }],
  },
  twitter: {
    card: "summary",
    title: "Repetidor Mais Próximo",
    description: "Encontre o repetidor de rádio amador mais próximo da sua localização em Portugal.",
    images: ["/og-default.png"],
  },
};

export default function ProximoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
