"use client"

import * as React from "react"

export default function Navigation() {
  const [activeHash, setActiveHash] = React.useState("")

  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash)
    }

    // Set initial hash
    handleHashChange()

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <a
        href="#tabela"
        className={`transition-colors duration-200 font-medium ${
          activeHash === '#tabela'
            ? 'text-white'
            : 'text-white/90 hover:text-white'
        }`}
      >
        Tabela
      </a>
      <a
        href="#mapa"
        className={`transition-colors duration-200 font-medium ${
          activeHash === '#mapa'
            ? 'text-white'
            : 'text-white/90 hover:text-white'
        }`}
      >
        Mapa
      </a>
      <a
        href="#sobre"
        className="text-white/90 hover:text-white transition-colors duration-200 font-medium"
      >
        Sobre
      </a>
    </nav>
  )
}
