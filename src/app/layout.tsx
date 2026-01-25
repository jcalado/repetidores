import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Header from "@/components/Header";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWAInstall from "@/components/PWAInstall";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo";
import { UserLocationProvider } from "@/contexts/UserLocationContext";
import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const API_URL = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || "https://api.radioamador.info";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.radioamador.info"),
  title: {
    default: "Ferramentas para Radioamadores em Portugal",
    template: "%s | Radioamador.info",
  },
  description: "Diretório de repetidores, eventos, notícias e ferramentas para radioamadores em Portugal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Radioamador.info",
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
  alternates: {
    types: {
      "application/rss+xml": [
        { url: `${API_URL}/api/feeds/repeaters.rss`, title: "Repetidores - RSS" },
        { url: `${API_URL}/api/feeds/events.rss`, title: "Eventos - RSS" },
      ],
    },
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
      <head>
        {/* Preconnect to external CDNs for maps and images */}
        <link rel="preconnect" href="https://unpkg.com" />
        <link rel="preconnect" href="https://server.arcgisonline.com" />
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        {/* Global JSON-LD Structured Data */}
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
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
