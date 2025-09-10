"use client"

import * as React from "react"

export default function Navigation() {
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

  // Handle navigation from about page
  const getHref = (hash: string) => {
    return currentPath === '/about' ? `/${hash}` : hash
  }

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <a
        href={getHref("#tabela")}
        className={`transition-colors duration-200 font-medium ${activeHash === '#tabela' && currentPath !== '/about'
            ? 'text-white'
            : 'text-white/90 hover:text-white'
          }`}
      >
        Tabela
      </a>
      <a
        href={getHref("#mapa")}
        className={`transition-colors duration-200 font-medium ${activeHash === '#mapa' && currentPath !== '/about'
            ? 'text-white'
            : 'text-white/90 hover:text-white'
          }`}
      >
        Mapa
      </a>
      <a
        href="/about"
        className={`transition-colors duration-200 font-medium ${currentPath === '/about'
            ? 'text-white'
            : 'text-white/90 hover:text-white'
          }`}
      >
        Sobre
      </a>
    </nav>
  )
}
