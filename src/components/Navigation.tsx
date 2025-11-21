"use client"

import { useTranslations } from 'next-intl'
import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

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

  const isRepeatersActive = (activeHash === '#tabela' || activeHash === '#mapa') && currentPath === '/'

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <DropdownMenu>
        <DropdownMenuTrigger className={`flex items-center gap-1 transition-colors duration-200 font-medium ${
          isRepeatersActive
            ? 'text-white'
            : 'text-white/90 hover:text-white'
        }`}>
          {t('nav.repeaters')}
          <ChevronDown size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DropdownMenuItem asChild>
            <a
              href={getHref("#tabela")}
              className={`cursor-pointer ${
                activeHash === '#tabela' && currentPath === '/'
                  ? 'bg-ship-cove-100 dark:bg-ship-cove-900 text-ship-cove-900 dark:text-ship-cove-100'
                  : ''
              }`}
            >
              {t('nav.table')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getHref("#mapa")}
              className={`cursor-pointer ${
                activeHash === '#mapa' && currentPath === '/'
                  ? 'bg-ship-cove-100 dark:bg-ship-cove-900 text-ship-cove-900 dark:text-ship-cove-100'
                  : ''
              }`}
            >
              {t('nav.map')}
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
