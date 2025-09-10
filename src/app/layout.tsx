import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="relative overflow-hidden bg-ship-cove-900">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/10"></div>

            <div className="relative mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Repetidores</h1>
                    <p className="text-xs text-blue-100 hidden sm:block">Explorador de Rádio</p>
                  </div>
                </Link>
              </div>

              <nav className="hidden md:flex items-center space-x-8">
                <a href="#mapa" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">
                  Mapa
                </a>
                <a href="#lista" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">
                  Lista
                </a>
                <a href="#sobre" className="text-white/90 hover:text-white transition-colors duration-200 font-medium">
                  Sobre
                </a>
              </nav>

              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/jcalado/repetidores"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/90 hover:text-white transition-all duration-200 text-sm font-medium"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <ThemeToggle />
              </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </header>

          <div className="flex-1">{children}</div>

          <footer className="border-t bg-background/80">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
              <p>
                © {new Date().getFullYear()} Repetidores •
                {" "}
                <a
                  href="https://github.com/jcalado/repetidores"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Código no GitHub
                </a>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
