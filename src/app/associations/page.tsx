/**
 * Permanent redirect stub for /associations/ → /associacoes/.
 *
 * The site is statically exported (output: 'export'), so there is no server
 * to issue an HTTP 301. The strongest SEO-friendly substitute for a static
 * export is the combination of:
 *   - canonical link to the new URL (set via the metadata API)
 *   - <meta http-equiv="refresh" content="0; url=…"> hoisted into <head>
 *   - robots: noindex on this stub
 *   - a client-side window.location.replace() so humans don't see the stub
 *
 * Google and Bing both treat a 0-delay meta refresh + matching canonical as
 * a signal equivalent to a 301 for the purpose of consolidating ranking.
 */
import type { Metadata } from "next"
import RedirectClient from "./RedirectClient"

const NEW_URL = "/associacoes/"

export const metadata: Metadata = {
  title: "Associações",
  description: "Esta página mudou para /associacoes/.",
  robots: { index: false, follow: true },
  alternates: { canonical: NEW_URL },
}

export default function AssociationsRedirectStub() {
  return (
    <>
      {/* Hoisted into <head> by the App Router. */}
      <meta httpEquiv="refresh" content={`0; url=${NEW_URL}`} />

      <RedirectClient newUrl={NEW_URL} />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-muted-foreground">
          Esta página mudou para <a href={NEW_URL} className="text-azulejo-600 underline">{NEW_URL}</a>.
        </p>
      </main>
    </>
  )
}
