"use client"

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer"
import { Menu, Table, Map, Radio, Calendar, Satellite, Info, X, ChevronDown, ChevronRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import * as React from "react"

export default function MobileMenu() {
    const t = useTranslations()
    const [activeHash, setActiveHash] = React.useState("")
    const [currentPath, setCurrentPath] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)
    const [repeatersExpanded, setRepeatersExpanded] = React.useState(false)

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

        // Auto-expand Repetidores section if on home page
        if (window.location.pathname === '/' && (window.location.hash === '#tabela' || window.location.hash === '#mapa')) {
            setRepeatersExpanded(true)
        }

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

    const handleLinkClick = () => {
        setIsOpen(false)
    }

    const repeatersItems = [
        { href: getHref("#tabela"), label: t('nav.table'), icon: Table, isHash: true, hash: '#tabela' },
        { href: getHref("#mapa"), label: t('nav.map'), icon: Map, isHash: true, hash: '#mapa' },
    ]

    const menuItems = [
        { href: "/bands", label: t('nav.bands'), icon: Radio, isHash: false },
        { href: "/events", label: t('nav.events'), icon: Calendar, isHash: false },
        { href: "/iss", label: t('nav.iss'), icon: Satellite, isHash: false },
        { href: "/about", label: t('nav.about'), icon: Info, isHash: false },
    ]

    const isActive = (item: typeof menuItems[0]) => {
        if (item.isHash) {
            return activeHash === item.hash && currentPath === '/'
        }
        return currentPath === item.href
    }

    const isRepeatersActive = (activeHash === '#tabela' || activeHash === '#mapa') && currentPath === '/'

    return (
        <div className="md:hidden">
            <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
                <DrawerTrigger asChild>
                    <button
                        className="text-white/90 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                </DrawerTrigger>
                <DrawerContent className="h-full">
                    <DrawerHeader className="border-b border-slate-200 dark:border-slate-700 flex flex-row items-center justify-between pr-4">
                        <DrawerTitle className="text-xl">{t('nav.menu')}</DrawerTitle>
                        <DrawerClose asChild>
                            <button
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </DrawerClose>
                    </DrawerHeader>
                    <div className="flex flex-col space-y-1 p-4 overflow-y-auto">
                        {/* Repetidores collapsible section */}
                        <div>
                            <button
                                onClick={() => setRepeatersExpanded(!repeatersExpanded)}
                                className={`
                                    flex items-center justify-between w-full px-4 py-3 rounded-lg
                                    transition-all duration-200 font-medium
                                    ${isRepeatersActive
                                        ? 'bg-ship-cove-600 dark:bg-ship-cove-700 text-white shadow-md'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }
                                `}
                            >
                                <span className="flex items-center gap-3">
                                    <Radio size={20} className={isRepeatersActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                    <span>{t('nav.repeaters')}</span>
                                </span>
                                {repeatersExpanded ? (
                                    <ChevronDown size={20} className={isRepeatersActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                ) : (
                                    <ChevronRight size={20} className={isRepeatersActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                )}
                            </button>

                            {repeatersExpanded && (
                                <div className="ml-6 mt-1 space-y-1">
                                    {repeatersItems.map((item) => {
                                        const Icon = item.icon
                                        const active = isActive(item)

                                        return (
                                            <DrawerClose key={item.href} asChild>
                                                <a
                                                    href={item.href}
                                                    onClick={handleLinkClick}
                                                    className={`
                                                        flex items-center gap-3 px-4 py-2 rounded-lg
                                                        transition-all duration-200 font-medium
                                                        ${active
                                                            ? 'bg-ship-cove-600 dark:bg-ship-cove-700 text-white shadow-md'
                                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                        }
                                                    `}
                                                >
                                                    <Icon size={18} className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                                    <span>{item.label}</span>
                                                </a>
                                            </DrawerClose>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Other menu items */}
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item)

                            return (
                                <DrawerClose key={item.href} asChild>
                                    <a
                                        href={item.href}
                                        onClick={handleLinkClick}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg
                                            transition-all duration-200 font-medium
                                            ${active
                                                ? 'bg-ship-cove-600 dark:bg-ship-cove-700 text-white shadow-md'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        <Icon size={20} className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                        <span>{item.label}</span>
                                    </a>
                                </DrawerClose>
                            )
                        })}
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
