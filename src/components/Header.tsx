'use client'

import { CloseButton, Dialog, DialogPanel, Popover, PopoverButton, PopoverGroup, PopoverPanel } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import {
    Bars3Icon,
    CalendarIcon,
    ClockIcon,
    GlobeAmericasIcon,
    InformationCircleIcon,
    LanguageIcon,
    MapIcon,
    MapPinIcon,
    RadioIcon,
    SignalIcon,
    TableCellsIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { Navigation } from 'lucide-react'
import { BookOpen, Calculator, Newspaper, Volume2, Radio, RadioTowerIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import LocationPickerPopover from './LocationPickerPopover'
import NotificationSettings from './NotificationSettings'

export default function Header() {
    const t = useTranslations()
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [activeHash, setActiveHash] = useState("")

    useEffect(() => {
        // Set initial hash
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
            // Check if we are on the correct path and the hash matches
            // Note: href might be "/repeaters#tabela", so path is "/repeaters" and hash is "tabela"
            // activeHash includes the #, so we need to compare with `#${hash}`
            return pathname === path && activeHash === `#${hash}`
        }
        return pathname === href
    }


    const repeaters = [
        { name: t('nav.table'), description: 'Lista de repetidores', href: '/repetidores', icon: TableCellsIcon },
        { name: t('nav.map'), description: 'Mapa de repetidores', href: '/repetidores/mapa', icon: MapIcon },
        { name: t('nav.nearest'), description: t('nav.nearestDescription'), href: '/repetidores/proximo', icon: Navigation },
    ]

    const tools = [
        { name: t('nav.satellites'), description: t('nav.satellitesDescription'), href: '/satelites', icon: GlobeAmericasIcon },
        { name: t('nav.qth'), description: t('nav.qthDescription'), href: '/qth', icon: MapPinIcon },
        { name: t('nav.propagation'), description: t('nav.propagationDescription'), href: '/propagation', icon: SignalIcon },
        { name: t('nav.calculadoras'), description: t('nav.calculadorasDescription'), href: '/calculadoras', icon: Calculator },
        { name: t('nav.nato'), description: t('nav.natoDescription'), href: '/nato', icon: LanguageIcon },
        { name: t('nav.utc'), description: t('nav.utcDescription'), href: '/utc', icon: ClockIcon },
        { name: t('nav.antenna'), description: t('nav.antennaDescription'), href: '/antenna', icon: Radio },
        { name: t('nav.qcodes'), description: t('nav.qcodesDescription'), href: '/qcodes', icon: BookOpen },
        { name: t('nav.morse'), description: t('nav.morseDescription'), href: '/morse', icon: Volume2 },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/80">
            <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
                <div className="flex lg:flex-1">
                    <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ship-cove-500 to-ship-cove-700 text-white shadow-lg shadow-ship-cove-500/20">
                            <RadioTowerIcon className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Radioamador.info</span>
                    </Link>
                </div>
                <div className="flex lg:hidden items-center">
                    <div className="mr-2">
                        <LocationPickerPopover compact />
                    </div>
                    <div className="mr-1">
                        <NotificationSettings />
                    </div>
                    <div className="mr-2">
                        <ThemeToggle />
                    </div>
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <PopoverGroup className="hidden lg:flex lg:gap-x-8">
                    <Link
                        href="/"
                        className={`text-sm/6 font-semibold transition-colors ${isCurrent('/')
                            ? 'text-ship-cove-600 dark:text-ship-cove-400'
                            : 'text-slate-700 hover:text-ship-cove-600 dark:text-slate-200 dark:hover:text-ship-cove-400'
                            }`}
                    >
                        {t('nav.home')}
                    </Link>

                    <Popover className="relative">
                        <PopoverButton className="group flex items-center gap-x-1 text-sm/6 font-semibold text-slate-700 hover:text-ship-cove-600 focus:outline-none dark:text-slate-200 dark:hover:text-ship-cove-400 transition-colors">
                            {t('nav.repeaters')}
                            <ChevronDownIcon aria-hidden="true" className="size-5 flex-none text-gray-400 transition-transform group-data-[open]:rotate-180 group-hover:text-ship-cove-600 dark:text-slate-500 dark:group-hover:text-ship-cove-400" />
                        </PopoverButton>

                        <PopoverPanel
                            transition
                            className="absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[enter]:ease-out data-[leave]:duration-150 data-[leave]:ease-in dark:bg-slate-900 dark:ring-white/10"
                        >
                            <div className="p-4">
                                {repeaters.map((item) => (
                                    <div
                                        key={item.name}
                                        className="group relative flex items-center gap-x-6 rounded-xl p-4 text-sm/6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white dark:bg-slate-800 dark:group-hover:bg-slate-700 transition-colors shadow-sm">
                                            <item.icon
                                                aria-hidden="true"
                                                className="size-6 text-gray-600 group-hover:text-ship-cove-600 dark:text-gray-400 dark:group-hover:text-ship-cove-400 transition-colors"
                                            />
                                        </div>
                                        <div className="flex-auto">
                                            <CloseButton as={Link} href={item.href} className="block font-semibold text-gray-900 dark:text-white">
                                                {item.name}
                                                <span className="absolute inset-0" />
                                            </CloseButton>
                                            <p className="mt-1 text-gray-600 dark:text-gray-400">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </PopoverPanel>
                    </Popover>

                    <Link
                        href="/bands"
                        className={`text-sm/6 font-semibold transition-colors ${isCurrent('/bands')
                            ? 'text-ship-cove-600 dark:text-ship-cove-400'
                            : 'text-slate-700 hover:text-ship-cove-600 dark:text-slate-200 dark:hover:text-ship-cove-400'
                            }`}
                    >
                        {t('nav.bands')}
                    </Link>

                    <Link
                        href="/events"
                        className={`text-sm/6 font-semibold transition-colors ${isCurrent('/events')
                            ? 'text-ship-cove-600 dark:text-ship-cove-400'
                            : 'text-slate-700 hover:text-ship-cove-600 dark:text-slate-200 dark:hover:text-ship-cove-400'
                            }`}
                    >
                        {t('nav.events')}
                    </Link>

                    <Link
                        href="/noticias"
                        className={`text-sm/6 font-semibold transition-colors ${isCurrent('/noticias')
                            ? 'text-ship-cove-600 dark:text-ship-cove-400'
                            : 'text-slate-700 hover:text-ship-cove-600 dark:text-slate-200 dark:hover:text-ship-cove-400'
                            }`}
                    >
                        {t('nav.news')}
                    </Link>

                    <Popover className="relative">
                        <PopoverButton className="group flex items-center gap-x-1 text-sm/6 font-semibold text-slate-700 hover:text-ship-cove-600 focus:outline-none dark:text-slate-200 dark:hover:text-ship-cove-400 transition-colors">
                            {t('nav.tools')}
                            <ChevronDownIcon aria-hidden="true" className="size-5 flex-none text-gray-400 transition-transform group-data-[open]:rotate-180 group-hover:text-ship-cove-600 dark:text-slate-500 dark:group-hover:text-ship-cove-400" />
                        </PopoverButton>

                        <PopoverPanel
                            transition
                            className="absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[enter]:ease-out data-[leave]:duration-150 data-[leave]:ease-in dark:bg-slate-900 dark:ring-white/10"
                        >
                            <div className="p-4">
                                {tools.map((item) => (
                                    <div
                                        key={item.name}
                                        className="group relative flex items-center gap-x-6 rounded-xl p-4 text-sm/6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white dark:bg-slate-800 dark:group-hover:bg-slate-700 transition-colors shadow-sm">
                                            <item.icon
                                                aria-hidden="true"
                                                className="size-6 text-gray-600 group-hover:text-ship-cove-600 dark:text-gray-400 dark:group-hover:text-ship-cove-400 transition-colors"
                                            />
                                        </div>
                                        <div className="flex-auto">
                                            <CloseButton as={Link} href={item.href} className="block font-semibold text-gray-900 dark:text-white">
                                                {item.name}
                                                <span className="absolute inset-0" />
                                            </CloseButton>
                                            <p className="mt-1 text-gray-600 dark:text-gray-400">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </PopoverPanel>
                    </Popover>

                    <Link
                        href="/about"
                        className={`text-sm/6 font-semibold transition-colors ${isCurrent('/about')
                            ? 'text-ship-cove-600 dark:text-ship-cove-400'
                            : 'text-slate-700 hover:text-ship-cove-600 dark:text-slate-200 dark:hover:text-ship-cove-400'
                            }`}
                    >
                        {t('nav.about')}
                    </Link>
                </PopoverGroup>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
                    <LocationPickerPopover />
                    <NotificationSettings />
                    <ThemeToggle />
                </div>
            </nav>
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm dark:bg-slate-900/80" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 flex w-full flex-col justify-between overflow-y-auto bg-white sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-slate-900 dark:sm:ring-white/10 shadow-2xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ship-cove-500 to-ship-cove-700 text-white">
                                    <RadioTowerIcon className="h-5 w-5" />
                                </div>
                                <span className="text-xl font-bold text-slate-900 dark:text-white">Repetidores</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon aria-hidden="true" className="size-6" />
                            </button>
                        </div>
                        <div className="mt-8 flow-root">
                            <div className="-my-6 divide-y divide-gray-500/10 dark:divide-white/10">
                                <div className="space-y-2 py-6">
                                    <Link
                                        href="/"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`-mx-3 flex items-center gap-x-4 rounded-lg p-3 text-base/7 font-semibold transition-colors ${isCurrent('/')
                                            ? 'bg-ship-cove-50 text-ship-cove-600 dark:bg-ship-cove-900/20 dark:text-ship-cove-400'
                                            : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className={`flex size-10 flex-none items-center justify-center rounded-lg transition-colors ${isCurrent('/')
                                            ? 'bg-white dark:bg-slate-800'
                                            : 'bg-gray-50 dark:bg-slate-800'
                                            }`}>
                                            <RadioTowerIcon
                                                className={`size-5 ${isCurrent('/')
                                                    ? 'text-ship-cove-600 dark:text-ship-cove-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                    }`}
                                            />
                                        </div>
                                        {t('nav.home')}
                                    </Link>
                                </div>
                                <div className="space-y-2 py-6">
                                    <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('nav.repeaters')}
                                    </div>
                                    {repeaters.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`-mx-3 flex items-center gap-x-4 rounded-lg p-3 text-base/7 font-semibold transition-colors ${isCurrent(item.href)
                                                ? 'bg-ship-cove-50 text-ship-cove-600 dark:bg-ship-cove-900/20 dark:text-ship-cove-400'
                                                : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className={`flex size-10 flex-none items-center justify-center rounded-lg transition-colors ${isCurrent(item.href)
                                                ? 'bg-white dark:bg-slate-800'
                                                : 'bg-gray-50 dark:bg-slate-800'
                                                }`}>
                                                <item.icon
                                                    aria-hidden="true"
                                                    className={`size-5 ${isCurrent(item.href)
                                                        ? 'text-ship-cove-600 dark:text-ship-cove-400'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                        }`}
                                                />
                                            </div>
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                                <div className="space-y-2 py-6">
                                    <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Menu
                                    </div>
                                    <Link
                                        href="/bands"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`-mx-3 flex items-center gap-x-4 rounded-lg p-3 text-base/7 font-semibold transition-colors ${isCurrent('/bands')
                                            ? 'bg-ship-cove-50 text-ship-cove-600 dark:bg-ship-cove-900/20 dark:text-ship-cove-400'
                                            : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className={`flex size-10 flex-none items-center justify-center rounded-lg transition-colors ${isCurrent('/bands')
                                            ? 'bg-white dark:bg-slate-800'
                                            : 'bg-gray-50 dark:bg-slate-800'
                                            }`}>
                                            <RadioIcon
                                                className={`size-5 ${isCurrent('/bands')
                                                    ? 'text-ship-cove-600 dark:text-ship-cove-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                    }`}
                                            />
                                        </div>
                                        {t('nav.bands')}
                                    </Link>
                                    <Link
                                        href="/events"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`-mx-3 flex items-center gap-x-4 rounded-lg p-3 text-base/7 font-semibold transition-colors ${isCurrent('/events')
                                            ? 'bg-ship-cove-50 text-ship-cove-600 dark:bg-ship-cove-900/20 dark:text-ship-cove-400'
                                            : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className={`flex size-10 flex-none items-center justify-center rounded-lg transition-colors ${isCurrent('/events')
                                            ? 'bg-white dark:bg-slate-800'
                                            : 'bg-gray-50 dark:bg-slate-800'
                                            }`}>
                                            <CalendarIcon
                                                className={`size-5 ${isCurrent('/events')
                                                    ? 'text-ship-cove-600 dark:text-ship-cove-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                    }`}
                                            />
                                        </div>
                                        {t('nav.events')}
                                    </Link>
                                    <Link
                                        href="/noticias"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`-mx-3 flex items-center gap-x-4 rounded-lg p-3 text-base/7 font-semibold transition-colors ${isCurrent('/noticias')
                                            ? 'bg-ship-cove-50 text-ship-cove-600 dark:bg-ship-cove-900/20 dark:text-ship-cove-400'
                                            : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className={`flex size-10 flex-none items-center justify-center rounded-lg transition-colors ${isCurrent('/noticias')
                                            ? 'bg-white dark:bg-slate-800'
                                            : 'bg-gray-50 dark:bg-slate-800'
                                            }`}>
                                            <Newspaper
                                                className={`size-5 ${isCurrent('/noticias')
                                                    ? 'text-ship-cove-600 dark:text-ship-cove-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                    }`}
                                            />
                                        </div>
                                        {t('nav.news')}
                                    </Link>
                                </div>
                                <div className="space-y-2 py-6">
                                    <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('nav.tools')}
                                    </div>
                                    {tools.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`-mx-3 flex items-center gap-x-4 rounded-lg p-3 text-base/7 font-semibold transition-colors ${isCurrent(item.href)
                                                ? 'bg-ship-cove-50 text-ship-cove-600 dark:bg-ship-cove-900/20 dark:text-ship-cove-400'
                                                : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className={`flex size-10 flex-none items-center justify-center rounded-lg transition-colors ${isCurrent(item.href)
                                                ? 'bg-white dark:bg-slate-800'
                                                : 'bg-gray-50 dark:bg-slate-800'
                                                }`}>
                                                <item.icon
                                                    className={`size-5 ${isCurrent(item.href)
                                                        ? 'text-ship-cove-600 dark:text-ship-cove-400'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                        }`}
                                                />
                                            </div>
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                                <div className="space-y-2 py-6">
                                    <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('nav.about')}
                                    </div>
                                    <Link
                                        href="/about"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`-mx-3 flex items-center gap-x-4 rounded-lg p-3 text-base/7 font-semibold transition-colors ${isCurrent('/about')
                                            ? 'bg-ship-cove-50 text-ship-cove-600 dark:bg-ship-cove-900/20 dark:text-ship-cove-400'
                                            : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className={`flex size-10 flex-none items-center justify-center rounded-lg transition-colors ${isCurrent('/about')
                                            ? 'bg-white dark:bg-slate-800'
                                            : 'bg-gray-50 dark:bg-slate-800'
                                            }`}>
                                            <InformationCircleIcon
                                                className={`size-5 ${isCurrent('/about')
                                                    ? 'text-ship-cove-600 dark:text-ship-cove-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                    }`}
                                            />
                                        </div>
                                        {t('nav.about')}
                                    </Link>
                                </div>
                                <div className="py-6">
                                    <div className="flex items-center justify-between -mx-3 px-3">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {t('nav.location')}
                                        </span>
                                        <LocationPickerPopover compact />
                                    </div>
                                </div>
                                <div className="py-6">
                                    <div className="flex items-center justify-between -mx-3 px-3">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {t('nav.theme')}
                                        </span>
                                        <ThemeToggle />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    )
}
