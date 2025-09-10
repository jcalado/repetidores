"use client"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import { Menu } from "lucide-react"
import * as React from "react"

export default function Navigation() {
  const [activeHash, setActiveHash] = React.useState("")
  const [currentPath, setCurrentPath] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)

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

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Desktop Navigation */}
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

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
          <DrawerTrigger asChild>
            <button className="text-white/90 hover:text-white transition-colors duration-200">
              <Menu size={24} />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col space-y-4 p-4">
              <DrawerClose asChild>
                <a
                  href={getHref("#tabela")}
                  onClick={handleLinkClick}
                  className={`transition-colors duration-200 font-medium py-2 px-4 rounded text-gray-700 hover:bg-gray-100'}`}
                >
                  Tabela
                </a>
              </DrawerClose>
              <DrawerClose asChild>
                <a
                  href={getHref("#mapa")}
                  onClick={handleLinkClick}
                  className={`transition-colors duration-200 font-medium py-2 px-4 rounded text-gray-700 hover:bg-gray-100'}`}
                >
                  Mapa
                </a>
              </DrawerClose>
              <DrawerClose asChild>
                <a
                  href="/about"
                  onClick={handleLinkClick}
                  className={`transition-colors duration-200 font-medium py-2 px-4 rounded text-gray-700 hover:bg-gray-100'}`}
                >
                  Sobre
                </a>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  )
}
