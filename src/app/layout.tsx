import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Header from "@/components/Header";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWAInstall from "@/components/PWAInstall";
import { UserLocationProvider } from "@/contexts/UserLocationContext";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.radioamador.info"),
  title: {
    default: "Repetidores de Rádio Amador em Portugal",
    template: "%s | Repetidores",
  },
  description: "Diretório de repetidores de radioamadorismo em Portugal. Mapa interativo, filtros por frequência e modulação.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Repetidores",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Radioamador.info - Ferramentas para Radioamadores",
    description: "Repetidores, eventos, notícias e ferramentas para radioamadores em Portugal",
    url: "https://www.radioamador.info",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 512,
        height: 512,
        alt: "Radioamador.info - Ferramentas para Radioamadores",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Radioamador.info - Ferramentas para Radioamadores",
    description: "Repetidores, eventos, notícias e ferramentas para radioamadores em Portugal",
    images: ["/og-default.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Radioamador.info",
    "msapplication-TileColor": "#1e293b",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e293b",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Import messages directly since we know it's 'pt' at build time
  const messages = (await import('../messages/pt.json')).default;

  return (
    <html lang="pt">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          <UserLocationProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
              <Header />
              <main>{children}</main>
              <Footer />
              <OfflineIndicator />
              <PWAInstall />
            </div>
          </UserLocationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
