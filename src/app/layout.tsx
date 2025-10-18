import Footer from "@/components/Footer";
import MobileMenu from "@/components/MobileMenu";
import Navigation from "@/components/Navigation";
import PWAInstall from "@/components/PWAInstall";
import ThemeToggle from "@/components/ThemeToggle";
import "leaflet/dist/leaflet.css";
import { RadioTowerIcon } from "lucide-react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Repetidores",
  description: "Explorar repetidores de rádio com mapa e filtros",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Repetidores",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Repetidores",
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
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <header className="sticky top-0 z-50 bg-ship-cove-900 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <Link href="/" className="flex items-center gap-3 text-ship-cove-100 dark:text-white">
                    <RadioTowerIcon className="h-8 w-8 text-white" />
                    <span className="text-xl font-bold">Repetidores</span>
                  </Link>
                  <Navigation />
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <MobileMenu />
                  </div>
                </div>
              </div>
            </header>
            <main>{children}</main>
            <Footer />
            <PWAInstall />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
