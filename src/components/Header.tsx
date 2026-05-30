'use client'

import { CloseButton, Dialog, DialogPanel, Popover, PopoverButton, PopoverGroup, PopoverPanel } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import {
    Bars3Icon,
    BuildingOffice2Icon,
    CalendarIcon,
    ClockIcon,
    GlobeAmericasIcon,
    LanguageIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    RadioIcon,
    SignalIcon,
    TableCellsIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { Navigation } from 'lucide-react'
import { BookOpen, Calculator, IdCard, Newspaper, Volume2, Radio, RadioTowerIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import LocationPickerPopover from './LocationPickerPopover'
import NotificationSettings from './NotificationSettings'
import { useCommandPalette } from './CommandPalette'

function isMacLike() {
    if (typeof navigator === 'undefined') return false
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

function SearchTrigger({ variant }: { variant: 'desktop' | 'mobile' }) {
    const t = useTranslations()
    const { open } = useCommandPalette()
    const [isMac, setIsMac] = useState(false)

    useEffect(() => {
        setIsMac(isMacLike())
    }, [])

    const shortcut = isMac ? '⌘K' : 'Ctrl+K'
    const label = variant === 'desktop' ? `${t('nav.search')} (${shortcut})` : t('nav.search')

    return (
        <button
            type="button"
            onClick={open}
            aria-label={label}
            title={label}
            className="inline-flex items-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-azulejo-50 hover:text-azulejo-700 dark:hover:bg-azulejo-950/30 dark:hover:text-azulejo-300 transition-colors duration-150"
        >
            <MagnifyingGlassIcon aria-hidden="true" className="size-5" />
        </button>
    )
}

const POPOVER_PANEL_CLASSES =
    'absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 overflow-hidden rounded-2xl bg-popover border border-border shadow-[0_12px_32px_-8px_oklch(0.20_0.012_250/0.22)] transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[enter]:ease-out data-[leave]:duration-150 data-[leave]:ease-in'

const POPOVER_ITEM_CLASSES =
    'group relative flex items-start gap-x-4 rounded-lg p-3 text-sm/6 hover:bg-azulejo-50 dark:hover:bg-azulejo-950/30 transition-colors duration-150'

type NavItem = {
    name: string
    description: string
    href: string
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
}

function Wordmark({ onClick }: { onClick?: () => void }) {
    return (
        <Link
            href="/"
            onClick={onClick}
            className="group inline-flex items-center gap-2 font-mono text-base font-semibold tracking-tight text-foreground rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-azulejo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
            <span
                aria-hidden="true"
                className="inline-block size-5 rounded-md bg-gradient-to-br from-azulejo-400 to-azulejo-700 shadow-[0_2px_6px_oklch(0.50_0.137_252/0.45)] transition-transform duration-200 ease-out group-hover:scale-[1.06]"
            />
            <span>radioamador<span className="text-azulejo-500">.</span>info</span>
        </Link>
    )
}

function DesktopLink({
    href,
    label,
    active,
}: {
    href: string
    label: string
    active: boolean
}) {
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-azulejo-500/40 ${
                active
                    ? 'bg-azulejo-100 text-azulejo-700 dark:bg-azulejo-950/50 dark:text-azulejo-300'
                    : 'text-foreground hover:bg-azulejo-50 hover:text-azulejo-700 dark:hover:bg-azulejo-950/30 dark:hover:text-azulejo-300'
            }`}
        >
            {label}
        </Link>
    )
}

function PopoverNavItem({ item }: { item: NavItem }) {
    return (
        <div className={POPOVER_ITEM_CLASSES}>
            <item.icon
                aria-hidden="true"
                className="mt-0.5 size-5 flex-none text-muted-foreground group-hover:text-azulejo-500 transition-colors"
            />
            <div className="flex-auto">
                <CloseButton as={Link} href={item.href} className="block font-medium text-foreground">
                    {item.name}
                    <span className="absolute inset-0" />
                </CloseButton>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
            </div>
        </div>
    )
}

function MobileNavLink({
    href,
    label,
    icon: Icon,
    active,
    onClick,
}: {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
    active: boolean
    onClick: () => void
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
            className={`-mx-3 flex items-center gap-x-3 rounded-md px-3 py-3 text-base font-medium transition-colors ${
                active
                    ? 'bg-azulejo-50 text-azulejo-700 dark:bg-azulejo-950/40 dark:text-azulejo-300'
                    : 'text-foreground hover:bg-accent'
            }`}
        >
            <Icon
                aria-hidden="true"
                className={`size-5 flex-none ${
                    active ? 'text-azulejo-500' : 'text-muted-foreground'
                }`}
            />
            {label}
        </Link>
    )
}

export default function Header() {
    const t = useTranslations()
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [activeHash, setActiveHash] = useState('')

    useEffect(() => {
        setActiveHash(window.location.hash)
        const handleHashChange = () => setActiveHash(window.location.hash)
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    }, [])

    const isCurrent = (href: string) => {
        if (href.includes('#')) {
            const [path, hash] = href.split('#')
            return pathname === path && activeHash === `#${hash}`
        }
        return pathname === href
    }

    const closeMobileMenu = () => setMobileMenuOpen(false)

    const frequencies: NavItem[] = [
        { name: t('nav.table'), description: 'Tabela de repetidores', href: '/repetidores', icon: TableCellsIcon },
        { name: t('nav.nearest'), description: t('nav.nearestDescription'), href: '/repetidores/proximo', icon: Navigation },
        { name: t('nav.simplex'), description: t('nav.simplexDescription'), href: '/simplex', icon: Radio },
    ]

    const toolGroups: { label: string; items: NavItem[] }[] = [
        {
            label: t('nav.toolsLocation'),
            items: [
                { name: t('nav.qth'), description: t('nav.qthDescription'), href: '/qth', icon: MapPinIcon },
                { name: t('nav.satellites'), description: t('nav.satellitesDescription'), href: '/satelites', icon: GlobeAmericasIcon },
                { name: t('nav.propagation'), description: t('nav.propagationDescription'), href: '/propagation', icon: SignalIcon },
            ],
        },
        {
            label: t('nav.toolsCalc'),
            items: [
                { name: t('nav.calculadoras'), description: t('nav.calculadorasDescription'), href: '/calculadoras', icon: Calculator },
                { name: t('nav.antenna'), description: t('nav.antennaDescription'), href: '/antenna', icon: Radio },
            ],
        },
        {
            label: t('nav.toolsReference'),
            items: [
                { name: t('nav.indicativos'), description: 'Directório de indicativos ANACOM', href: '/indicativos', icon: IdCard },
                { name: t('nav.bands'), description: t('nav.bandsDescription'), href: '/bandas', icon: RadioIcon },
                { name: t('nav.qcodes'), description: t('nav.qcodesDescription'), href: '/codigoq', icon: BookOpen },
                { name: t('nav.nato'), description: t('nav.natoDescription'), href: '/nato', icon: LanguageIcon },
                { name: t('nav.morse'), description: t('nav.morseDescription'), href: '/morse', icon: Volume2 },
                { name: t('nav.utc'), description: t('nav.utcDescription'), href: '/utc', icon: ClockIcon },
            ],
        },
    ]

    return (
        <header className="sticky top-3 z-50 w-full px-3 lg:px-6">
            <nav
                aria-label="Global"
                className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 backdrop-blur-md px-3 py-2 lg:px-4 shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06),0_8px_24px_-12px_oklch(0.20_0.012_250/0.18)]"
            >
                <div className="flex">
                    <Wordmark />
                </div>

                <div className="flex lg:hidden items-center gap-0.5">
                    <SearchTrigger variant="mobile" />
                    <LocationPickerPopover compact />
                    <NotificationSettings />
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-azulejo-50 hover:text-azulejo-700 dark:hover:bg-azulejo-950/30 dark:hover:text-azulejo-300 transition-colors duration-150"
                    >
                        <span className="sr-only">{t('nav.openMenu')}</span>
                        <Bars3Icon aria-hidden="true" className="size-5" />
                    </button>
                </div>

                <PopoverGroup className="hidden lg:flex lg:items-center lg:gap-x-1">
                    <DesktopLink href="/" label={t('nav.home')} active={isCurrent('/')} />

                    <Popover className="relative">
                        <PopoverButton className="group inline-flex items-center gap-x-1 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-azulejo-50 hover:text-azulejo-700 dark:hover:bg-azulejo-950/30 dark:hover:text-azulejo-300 focus:outline-none transition-colors duration-150">
                            {t('nav.repeaters')}
                            <ChevronDownIcon aria-hidden="true" className="size-4 flex-none text-muted-foreground transition-transform group-data-[open]:rotate-180" />
                        </PopoverButton>
                        <PopoverPanel transition className={POPOVER_PANEL_CLASSES}>
                            <div className="p-2">
                                {frequencies.map((item) => (
                                    <PopoverNavItem key={item.name} item={item} />
                                ))}
                            </div>
                        </PopoverPanel>
                    </Popover>

                    <DesktopLink href="/events" label={t('nav.events')} active={isCurrent('/events')} />
                    <DesktopLink href="/noticias" label={t('nav.news')} active={isCurrent('/noticias')} />
                    <DesktopLink href="/associations" label={t('nav.associations')} active={isCurrent('/associations')} />

                    <Popover className="relative">
                        <PopoverButton className="group inline-flex items-center gap-x-1 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-azulejo-50 hover:text-azulejo-700 dark:hover:bg-azulejo-950/30 dark:hover:text-azulejo-300 focus:outline-none transition-colors duration-150">
                            {t('nav.tools')}
                            <ChevronDownIcon aria-hidden="true" className="size-4 flex-none text-muted-foreground transition-transform group-data-[open]:rotate-180" />
                        </PopoverButton>
                        <PopoverPanel transition className={POPOVER_PANEL_CLASSES}>
                            <div className="p-2 max-h-[calc(100vh-8rem)] overflow-y-auto divide-y divide-border">
                                {toolGroups.map((group) => (
                                    <div key={group.label} className="py-2 first:pt-0 last:pb-0">
                                        <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground">
                                            {group.label}
                                        </h3>
                                        {group.items.map((item) => (
                                            <PopoverNavItem key={item.name} item={item} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </PopoverPanel>
                    </Popover>
                </PopoverGroup>

                <div className="hidden lg:flex lg:items-center lg:gap-x-0.5">
                    <SearchTrigger variant="desktop" />
                    <LocationPickerPopover />
                    <NotificationSettings />
                    <ThemeToggle />
                </div>
            </nav>

            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50 bg-black/40" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-y-auto bg-background sm:max-w-sm border-l border-border">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <Wordmark onClick={closeMobileMenu} />
                        <button
                            type="button"
                            onClick={closeMobileMenu}
                            className="-m-2.5 rounded-md p-2.5 text-foreground hover:bg-accent transition-colors"
                        >
                            <span className="sr-only">{t('nav.closeMenu')}</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                        </button>
                    </div>

                    <div className="flex-1 px-4 py-2 divide-y divide-border">
                        <div className="py-4">
                            <MobileNavLink
                                href="/"
                                label={t('nav.home')}
                                icon={RadioTowerIcon}
                                active={isCurrent('/')}
                                onClick={closeMobileMenu}
                            />
                        </div>

                        <section className="py-4">
                            <h2 className="px-3 mb-1 text-xs font-semibold text-muted-foreground">
                                {t('nav.repeaters')}
                            </h2>
                            {frequencies.map((item) => (
                                <MobileNavLink
                                    key={item.name}
                                    href={item.href}
                                    label={item.name}
                                    icon={item.icon}
                                    active={isCurrent(item.href)}
                                    onClick={closeMobileMenu}
                                />
                            ))}
                        </section>

                        <section className="py-4">
                            <h2 className="px-3 mb-1 text-xs font-semibold text-muted-foreground">
                                {t('nav.community')}
                            </h2>
                            <MobileNavLink
                                href="/events"
                                label={t('nav.events')}
                                icon={CalendarIcon}
                                active={isCurrent('/events')}
                                onClick={closeMobileMenu}
                            />
                            <MobileNavLink
                                href="/noticias"
                                label={t('nav.news')}
                                icon={Newspaper}
                                active={isCurrent('/noticias')}
                                onClick={closeMobileMenu}
                            />
                            <MobileNavLink
                                href="/associations"
                                label={t('nav.associations')}
                                icon={BuildingOffice2Icon}
                                active={isCurrent('/associations')}
                                onClick={closeMobileMenu}
                            />
                        </section>

                        <section className="py-4 space-y-4">
                            <h2 className="px-3 text-xs font-semibold text-muted-foreground">
                                {t('nav.tools')}
                            </h2>
                            {toolGroups.map((group) => (
                                <div key={group.label}>
                                    <h3 className="px-3 mb-1 text-[11px] font-medium text-muted-foreground/70">
                                        {group.label}
                                    </h3>
                                    {group.items.map((item) => (
                                        <MobileNavLink
                                            key={item.name}
                                            href={item.href}
                                            label={item.name}
                                            icon={item.icon}
                                            active={isCurrent(item.href)}
                                            onClick={closeMobileMenu}
                                        />
                                    ))}
                                </div>
                            ))}
                        </section>

                        <section className="py-4 space-y-2">
                            <div className="flex items-center justify-between px-3">
                                <span className="text-sm text-muted-foreground">{t('nav.location')}</span>
                                <LocationPickerPopover compact />
                            </div>
                            <div className="flex items-center justify-between px-3">
                                <span className="text-sm text-muted-foreground">{t('nav.theme')}</span>
                                <ThemeToggle />
                            </div>
                        </section>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    )
}
