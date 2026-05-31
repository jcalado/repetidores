'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import type React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
    BuildingOffice2Icon,
    CalendarIcon,
    ClockIcon,
    GlobeAmericasIcon,
    HomeIcon,
    LanguageIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    RadioIcon,
    SignalIcon,
    TableCellsIcon,
} from '@heroicons/react/24/outline'
import { BookOpen, Calculator, IdCard, Navigation, Newspaper, Radio, RadioTower, Volume2 } from 'lucide-react'
import { fetchRepeaters } from '@/lib/repeaters'
import type { Repeater } from '@/app/columns'

type IconComponent = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>

type Command = {
    id: string
    label: string
    href: string
    icon: IconComponent
    group: string
    keywords?: string
}

type PaletteItem =
    | { kind: 'command'; id: string; cmd: Command }
    | { kind: 'repeater'; id: string; rep: Repeater }

const MAX_REPEATER_HITS = 30

type CommandPaletteContextValue = {
    open: () => void
    close: () => void
    toggle: () => void
    isOpen: boolean
    repeaters: Repeater[] | null
    repeatersLoading: boolean
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

export function useCommandPalette() {
    const ctx = useContext(CommandPaletteContext)
    if (!ctx) {
        throw new Error('useCommandPalette must be used inside CommandPaletteProvider')
    }
    return ctx
}

function normalize(value: string) {
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function useCommands(): Command[] {
    const t = useTranslations()
    return useMemo(() => {
        const home = t('nav.home')
        const repeaters = t('nav.repeaters')
        const community = t('nav.community')
        const tools = t('nav.tools')
        const toolsLocation = t('nav.toolsLocation')
        const toolsCalc = t('nav.toolsCalc')
        const toolsReference = t('nav.toolsReference')

        return [
            { id: 'home',          label: home,                       href: '/',                       icon: HomeIcon as IconComponent, group: home },
            { id: 'repeaters',     label: t('nav.table'),             href: '/repetidores',            icon: TableCellsIcon as IconComponent, group: repeaters },
            { id: 'nearest',       label: t('nav.nearest'),           href: '/repetidores/proximo',    icon: Navigation as unknown as IconComponent, group: repeaters, keywords: 'mais proximo perto location' },
            { id: 'simplex',       label: t('nav.simplex'),           href: '/simplex',                icon: Radio as unknown as IconComponent, group: repeaters },
            { id: 'events',        label: t('nav.events'),            href: '/events',                 icon: CalendarIcon as IconComponent, group: community, keywords: 'eventos contests nets' },
            { id: 'news',          label: t('nav.news'),              href: '/noticias',               icon: Newspaper as unknown as IconComponent, group: community, keywords: 'noticias' },
            { id: 'associations',  label: t('nav.associations'),      href: '/associacoes',            icon: BuildingOffice2Icon as IconComponent, group: community, keywords: 'associacoes clubes associations' },
            { id: 'qth',           label: t('nav.qth'),               href: '/qth',                    icon: MapPinIcon as IconComponent, group: `${tools} / ${toolsLocation}`, keywords: 'qth locator maidenhead' },
            { id: 'satellites',    label: t('nav.satellites'),        href: '/satelites',              icon: GlobeAmericasIcon as IconComponent, group: `${tools} / ${toolsLocation}`, keywords: 'satelites iss passes' },
            { id: 'propagation',   label: t('nav.propagation'),       href: '/propagation',            icon: SignalIcon as IconComponent, group: `${tools} / ${toolsLocation}`, keywords: 'propagacao bandas hf' },
            { id: 'calculadoras',  label: t('nav.calculadoras'),      href: '/calculadoras',           icon: Calculator as unknown as IconComponent, group: `${tools} / ${toolsCalc}`, keywords: 'rf db swr cabos perdas' },
            { id: 'antenna',       label: t('nav.antenna'),           href: '/antenna',                icon: Radio as unknown as IconComponent, group: `${tools} / ${toolsCalc}`, keywords: 'antena comprimento' },
            { id: 'indicativos',   label: t('nav.indicativos'),       href: '/indicativos',            icon: IdCard as unknown as IconComponent, group: `${tools} / ${toolsReference}`, keywords: 'callsigns anacom ct cs' },
            { id: 'bands',         label: t('nav.bands'),             href: '/bandas',                 icon: RadioIcon as IconComponent, group: `${tools} / ${toolsReference}`, keywords: 'bandas plano frequencias' },
            { id: 'qcodes',        label: t('nav.qcodes'),            href: '/codigoq',                icon: BookOpen as unknown as IconComponent, group: `${tools} / ${toolsReference}`, keywords: 'qra qrz qrm qsl codigos q codigo' },
            { id: 'nato',          label: t('nav.nato'),              href: '/nato',                   icon: LanguageIcon as IconComponent, group: `${tools} / ${toolsReference}`, keywords: 'alfabeto fonetico alpha bravo' },
            { id: 'morse',         label: t('nav.morse'),             href: '/morse',                  icon: Volume2 as unknown as IconComponent, group: `${tools} / ${toolsReference}`, keywords: 'cw morse codigo' },
            { id: 'utc',           label: t('nav.utc'),               href: '/utc',                    icon: ClockIcon as IconComponent, group: `${tools} / ${toolsReference}`, keywords: 'utc relogio hora universal' },
        ]
    }, [t])
}

function filterCommands(commands: Command[], q: string): Command[] {
    if (!q) return commands
    return commands.filter((cmd) => {
        const haystack = normalize(`${cmd.label} ${cmd.keywords ?? ''} ${cmd.group}`)
        return haystack.includes(q)
    })
}

function filterRepeaters(repeaters: Repeater[], q: string): Repeater[] {
    if (!q) return []
    const hits: Repeater[] = []
    for (const rep of repeaters) {
        const haystack = normalize(
            `${rep.callsign} ${rep.qthLocator ?? ''} ${rep.owner ?? ''}`
        )
        if (haystack.includes(q)) {
            hits.push(rep)
            if (hits.length >= MAX_REPEATER_HITS) break
        }
    }
    return hits
}

function groupCommands(commands: Command[]): { group: string; items: Command[] }[] {
    const map = new Map<string, Command[]>()
    for (const cmd of commands) {
        const list = map.get(cmd.group) ?? []
        list.push(cmd)
        map.set(cmd.group, list)
    }
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }))
}

function primaryFrequency(rep: Repeater): string | null {
    const primary = rep.frequencies?.find((f) => f.isPrimary) ?? rep.frequencies?.[0]
    if (!primary || typeof primary.outputFrequency !== 'number') return null
    const f = primary.outputFrequency
    return f.toFixed(f >= 100 ? 3 : 4)
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [repeaters, setRepeaters] = useState<Repeater[] | null>(null)
    const [repeatersLoading, setRepeatersLoading] = useState(false)
    const loadStartedRef = useRef(false)

    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => setIsOpen(false), [])
    const toggle = useCallback(() => setIsOpen((v) => !v), [])

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                setIsOpen((v) => !v)
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [])

    useEffect(() => {
        if (!isOpen || loadStartedRef.current) return
        loadStartedRef.current = true
        setRepeatersLoading(true)
        fetchRepeaters()
            .then((list) => setRepeaters(list))
            .catch((err) => {
                console.warn('[CommandPalette] Failed to load repeaters', err)
                setRepeaters([])
            })
            .finally(() => setRepeatersLoading(false))
    }, [isOpen])

    const value = useMemo(
        () => ({ open, close, toggle, isOpen, repeaters, repeatersLoading }),
        [open, close, toggle, isOpen, repeaters, repeatersLoading]
    )

    return (
        <CommandPaletteContext.Provider value={value}>
            {children}
            <CommandPalette isOpen={isOpen} onClose={close} repeaters={repeaters} repeatersLoading={repeatersLoading} />
        </CommandPaletteContext.Provider>
    )
}

function CommandPalette({
    isOpen,
    onClose,
    repeaters,
    repeatersLoading,
}: {
    isOpen: boolean
    onClose: () => void
    repeaters: Repeater[] | null
    repeatersLoading: boolean
}) {
    const t = useTranslations()
    const router = useRouter()
    const commands = useCommands()
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const q = useMemo(() => normalize(query.trim()), [query])

    const commandHits = useMemo(() => filterCommands(commands, q), [commands, q])
    const repeaterHits = useMemo(
        () => (q && repeaters ? filterRepeaters(repeaters, q) : []),
        [q, repeaters]
    )

    // Unified flat list for keyboard navigation. Repeaters first, then commands.
    const items: PaletteItem[] = useMemo(() => {
        const list: PaletteItem[] = []
        for (const rep of repeaterHits) {
            list.push({ kind: 'repeater', id: `rep:${rep.callsign}`, rep })
        }
        for (const cmd of commandHits) {
            list.push({ kind: 'command', id: `cmd:${cmd.id}`, cmd })
        }
        return list
    }, [repeaterHits, commandHits])

    const groupedCommands = useMemo(() => (q ? null : groupCommands(commands)), [commands, q])

    useEffect(() => {
        setSelectedIndex(0)
    }, [q, isOpen])

    useEffect(() => {
        if (isOpen) {
            const id = window.setTimeout(() => inputRef.current?.focus(), 0)
            return () => window.clearTimeout(id)
        } else {
            setQuery('')
        }
    }, [isOpen])

    const selectItem = useCallback(
        (item: PaletteItem) => {
            const href =
                item.kind === 'command'
                    ? item.cmd.href
                    : `/repeater/${encodeURIComponent(item.rep.callsign.toUpperCase())}`
            router.push(href)
            onClose()
        },
        [router, onClose]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const len = items.length
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((i) => (len === 0 ? 0 : (i + 1) % len))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((i) => (len === 0 ? 0 : (i - 1 + len) % len))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const item = items[selectedIndex]
            if (item) selectItem(item)
        } else if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
        }
    }

    useEffect(() => {
        if (!listRef.current) return
        const selectedNode = listRef.current.querySelector<HTMLElement>('[data-selected="true"]')
        if (selectedNode) {
            selectedNode.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIndex])

    if (!isOpen) return null

    const indexMap = new Map(items.map((it, i) => [it.id, i]))
    const isEmpty = items.length === 0 && !(q && repeatersLoading)

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.commandHint')}
            onKeyDown={handleKeyDown}
        >
            <div
                className="absolute inset-0 bg-black/40"
                aria-hidden="true"
                onClick={onClose}
            />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-popover shadow-[0_24px_64px_-16px_rgb(0_0_0/0.35)]">
                <div className="flex items-center gap-3 border-b border-border px-4">
                    <MagnifyingGlassIcon aria-hidden="true" className="size-5 flex-none text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('nav.commandPlaceholder')}
                        className="flex-auto bg-transparent py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        aria-label={t('nav.search')}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                        ESC
                    </kbd>
                </div>

                <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
                    {/* Loading repeaters hint (only shown while searching and not yet loaded) */}
                    {q && repeatersLoading && repeaters === null && (
                        <div className="px-4 py-2 text-xs text-muted-foreground">
                            {t('nav.commandLoading')}
                        </div>
                    )}

                    {/* Repeater hits section */}
                    {repeaterHits.length > 0 && (
                        <div className="pb-2">
                            <h3 className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground">
                                {t('nav.commandRepeaters')}
                            </h3>
                            {repeaterHits.map((rep) => {
                                const idx = indexMap.get(`rep:${rep.callsign}`) ?? -1
                                return (
                                    <RepeaterRow
                                        key={rep.callsign}
                                        rep={rep}
                                        selected={idx === selectedIndex}
                                        onSelect={() => selectItem({ kind: 'repeater', id: `rep:${rep.callsign}`, rep })}
                                        onHover={() => setSelectedIndex(idx)}
                                    />
                                )
                            })}
                        </div>
                    )}

                    {/* Commands: grouped when empty query, flat when filtering */}
                    {q ? (
                        commandHits.length > 0 && (
                            <div className="pb-2">
                                {repeaterHits.length > 0 && (
                                    <h3 className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground">
                                        {t('nav.tools')}
                                    </h3>
                                )}
                                {commandHits.map((cmd) => {
                                    const idx = indexMap.get(`cmd:${cmd.id}`) ?? -1
                                    return (
                                        <CommandRow
                                            key={cmd.id}
                                            command={cmd}
                                            selected={idx === selectedIndex}
                                            showGroup
                                            onSelect={() => selectItem({ kind: 'command', id: `cmd:${cmd.id}`, cmd })}
                                            onHover={() => setSelectedIndex(idx)}
                                        />
                                    )
                                })}
                            </div>
                        )
                    ) : (
                        groupedCommands?.map((g) => (
                            <div key={g.group} className="pb-2">
                                <h3 className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground">
                                    {g.group}
                                </h3>
                                {g.items.map((cmd) => {
                                    const idx = indexMap.get(`cmd:${cmd.id}`) ?? -1
                                    return (
                                        <CommandRow
                                            key={cmd.id}
                                            command={cmd}
                                            selected={idx === selectedIndex}
                                            showGroup={false}
                                            onSelect={() => selectItem({ kind: 'command', id: `cmd:${cmd.id}`, cmd })}
                                            onHover={() => setSelectedIndex(idx)}
                                        />
                                    )
                                })}
                            </div>
                        ))
                    )}

                    {/* Empty state */}
                    {isEmpty && (
                        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                            {t('nav.commandEmpty')}
                            {query.trim() && (
                                <span className="ml-1 font-mono text-foreground">{`"${query.trim()}"`}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function CommandRow({
    command,
    selected,
    showGroup,
    onSelect,
    onHover,
}: {
    command: Command
    selected: boolean
    showGroup: boolean
    onSelect: () => void
    onHover: () => void
}) {
    const Icon = command.icon
    return (
        <button
            type="button"
            data-selected={selected}
            onMouseEnter={onHover}
            onClick={onSelect}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                selected ? 'bg-accent' : 'bg-transparent'
            }`}
        >
            <Icon
                aria-hidden="true"
                className={`size-5 flex-none ${selected ? 'text-azulejo-500' : 'text-muted-foreground'}`}
            />
            <span className="flex-auto text-sm text-foreground">{command.label}</span>
            {showGroup && (
                <span className="hidden sm:inline text-xs text-muted-foreground">{command.group}</span>
            )}
        </button>
    )
}

function RepeaterRow({
    rep,
    selected,
    onSelect,
    onHover,
}: {
    rep: Repeater
    selected: boolean
    onSelect: () => void
    onHover: () => void
}) {
    const freq = primaryFrequency(rep)
    const subtitle = [rep.qthLocator, rep.owner].filter(Boolean).join(' · ')
    return (
        <button
            type="button"
            data-selected={selected}
            onMouseEnter={onHover}
            onClick={onSelect}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                selected ? 'bg-accent' : 'bg-transparent'
            }`}
        >
            <RadioTower
                aria-hidden="true"
                className={`size-5 flex-none ${selected ? 'text-azulejo-500' : 'text-muted-foreground'}`}
            />
            <span className="font-mono text-sm font-medium text-foreground">{rep.callsign.toUpperCase()}</span>
            {subtitle && (
                <span className="flex-auto truncate text-xs text-muted-foreground">{subtitle}</span>
            )}
            {!subtitle && <span className="flex-auto" />}
            {freq && <span className="hidden sm:inline font-mono text-xs text-muted-foreground">{freq}</span>}
        </button>
    )
}
