"use client"

import { useTranslations } from 'next-intl'
import * as React from "react"

export default function Navigation() {
  const t = useTranslations()
  const [activeHash, setActiveHash] = React.useState("")
  const [currentPath, setCurrentPath] = React.useState("")

  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash)
    }

    const handlePathChange = () => {
      setCurrentPath(window.location.pathname)
    }

    // Set initial values
    handleHashChange()
    handlePathChange()

    window.addEventListener("hashchange", handleHashChange)
    window.addEventListener("popstate", handlePathChange)
    return () => {
      window.removeEventListener("hashchange", handleHashChange)
      window.removeEventListener("popstate", handlePathChange)
    }
  }, [])

  // Handle navigation to home page tabs from any other page
  const getHref = (hash: string) => {
    // If we're not on the home page, navigate to home with hash
    return currentPath !== '/' ? `/${hash}` : hash
  }

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <a
        href={getHref("#tabela")}
        className={`transition-colors duration-200 font-medium ${activeHash === '#tabela' && currentPath === '/'
          ? 'text-white'
          : 'text-white/90 hover:text-white'
          }`}
      >
        {t('nav.table')}
      </a>
      <a
        href={getHref("#mapa")}
        className={`transition-colors duration-200 font-medium ${activeHash === '#mapa' && currentPath === '/'
          ? 'text-white'
          : 'text-white/90 hover:text-white'
          }`}
      >
        {t('nav.map')}
      </a>
      <a
        href="/bands"
        className={`transition-colors duration-200 font-medium ${currentPath === '/bands'
          ? 'text-white'
          : 'text-white/90 hover:text-white'
          }`}
      >
        {t('nav.bands')}
      </a>
      <a
        href="/events"
        className={`transition-colors duration-200 font-medium ${currentPath === '/events'
          ? 'text-white'
          : 'text-white/90 hover:text-white'
          }`}
      >
        {t('nav.events')}
      </a>
      <a
        href="/iss"
        className={`transition-colors duration-200 font-medium ${currentPath === '/iss'
          ? 'text-white'
          : 'text-white/90 hover:text-white'
          }`}
      >
        {t('nav.iss')}
      </a>
      <a
        href="/about"
        className={`transition-colors duration-200 font-medium ${currentPath === '/about'
          ? 'text-white'
          : 'text-white/90 hover:text-white'
          }`}
      >
        {t('nav.about')}
      </a>
    </nav>
  )
}
