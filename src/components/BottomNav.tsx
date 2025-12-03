'use client'

import {
    CalendarIcon,
    EllipsisHorizontalIcon,
    GlobeAmericasIcon,
    InformationCircleIcon,
    MapIcon,
    MapPinIcon,
    RadioIcon,
    TableCellsIcon,
} from '@heroicons/react/24/outline'
import {
    CalendarIcon as CalendarIconSolid,
    MapIcon as MapIconSolid,
    TableCellsIcon as TableCellsIconSolid,
} from '@heroicons/react/24/solid'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'

export default function BottomNav() {
    const t = useTranslations()
    const pathname = usePathname()
    const [activeHash, setActiveHash] = useState('')
    const [sheetOpen, setSheetOpen] = useState(false)

    useEffect(() => {
        setActiveHash(window.location.hash)

        const handleHashChange = () => {
            setActiveHash(window.location.hash)
        }

        window.addEventListener('hashchange', handleHashChange)
        return () => {
            window.removeEventListener('hashchange', handleHashChange)
        }
    }, [])

    const isCurrent = (href: string) => {
        if (href.includes('#')) {
            const [path, hash] = href.split('#')
            return pathname === (path || '/') && activeHash === `#${hash}`
        }
        return pathname === href
    }

    const isHomeActive = pathname === '/' && (activeHash === '' || activeHash === '#tabela')
    const isMapActive = pathname === '/' && activeHash === '#mapa'
    const isEventsActive = pathname === '/events'
    const isMoreActive = ['/bands', '/iss', '/qth', '/about'].includes(pathname)

    const moreItems = [
        { name: t('nav.bands'), href: '/bands', icon: RadioIcon },
        { name: t('nav.iss'), description: t('nav.issDescription'), href: '/iss', icon: GlobeAmericasIcon },
        { name: t('nav.qth'), description: t('nav.qthDescription'), href: '/qth', icon: MapPinIcon },
        { name: t('nav.about'), href: '/about', icon: InformationCircleIcon },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/50 bg-white/95 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/95 md:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {/* Table */}
                <Link
                    href="/#tabela"
                    className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                        isHomeActive
                            ? 'text-ship-cove-600 dark:text-ship-cove-400'
                            : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                    {isHomeActive ? (
                        <TableCellsIconSolid className="h-6 w-6" />
                    ) : (
                        <TableCellsIcon className="h-6 w-6" />
                    )}
                    <span className="text-xs font-medium">{t('nav.table')}</span>
                </Link>

                {/* Map */}
                <Link
                    href="/#mapa"
                    className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                        isMapActive
                            ? 'text-ship-cove-600 dark:text-ship-cove-400'
                            : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                    {isMapActive ? (
                        <MapIconSolid className="h-6 w-6" />
                    ) : (
                        <MapIcon className="h-6 w-6" />
                    )}
                    <span className="text-xs font-medium">{t('nav.map')}</span>
                </Link>

                {/* Events */}
                <Link
                    href="/events"
                    className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                        isEventsActive
                            ? 'text-ship-cove-600 dark:text-ship-cove-400'
                            : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                    {isEventsActive ? (
                        <CalendarIconSolid className="h-6 w-6" />
                    ) : (
                        <CalendarIcon className="h-6 w-6" />
                    )}
                    <span className="text-xs font-medium">{t('nav.events')}</span>
                </Link>

                {/* More */}
                <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
                    <DrawerTrigger asChild>
                        <button
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                                isMoreActive
                                    ? 'text-ship-cove-600 dark:text-ship-cove-400'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            <EllipsisHorizontalIcon className="h-6 w-6" />
                            <span className="text-xs font-medium">{t('nav.menu')}</span>
                        </button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <DrawerHeader className="pb-4">
                            <DrawerTitle>{t('nav.menu')}</DrawerTitle>
                        </DrawerHeader>
                        <div className="grid grid-cols-2 gap-3 px-4 pb-8">
                            {moreItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSheetOpen(false)}
                                    className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${
                                        isCurrent(item.href)
                                            ? 'bg-ship-cove-50 text-ship-cove-600 dark:bg-ship-cove-900/20 dark:text-ship-cove-400'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                                        isCurrent(item.href)
                                            ? 'bg-ship-cove-100 dark:bg-ship-cove-900/40'
                                            : 'bg-white dark:bg-slate-700'
                                    }`}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{item.name}</p>
                                        {item.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </nav>
    )
}
