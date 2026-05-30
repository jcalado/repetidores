import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { BookOpen, Calculator, IdCard, Radio, Volume2, type LucideIcon } from 'lucide-react'

import { fetchNews, type NewsItem } from '@/lib/news'
import { fetchEvents } from '@/lib/events'
import { fetchRepeaters } from '@/lib/repeaters'
import type { EventItem } from '@/components/events/types'
import type { Repeater } from '@/app/columns'

export const metadata: Metadata = {
    alternates: { canonical: '/' },
}

const PT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatDatePT(d: Date) {
    return `${d.getDate()} ${PT_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatUTCHHMM(iso: string) {
    const d = new Date(iso)
    return [d.getUTCHours(), d.getUTCMinutes()].map((n) => String(n).padStart(2, '0')).join(':')
}

async function fetchLatestNews(): Promise<NewsItem[]> {
    try {
        const res = await fetchNews({ sort: 'dateDesc', limit: 5 })
        return res.docs
    } catch (error) {
        console.error('[Landing] News fetch failed', error)
        return []
    }
}

async function fetchUpcomingEvents(): Promise<EventItem[]> {
    try {
        const res = await fetchEvents({ sort: 'startAsc', limit: 200 })
        const now = Date.now()
        return res.docs
            .filter((e) => new Date(e.start).getTime() > now - 60 * 60 * 1000)
            .slice(0, 6)
    } catch (error) {
        console.error('[Landing] Events fetch failed', error)
        return []
    }
}

async function fetchRecentRepeaters(): Promise<Repeater[]> {
    try {
        const all = await fetchRepeaters()
        return all
            .filter((r) => r.lastVerified)
            .sort((a, b) => (b.lastVerified ?? '').localeCompare(a.lastVerified ?? ''))
            .slice(0, 6)
    } catch (error) {
        console.error('[Landing] Repeaters fetch failed', error)
        return []
    }
}

export default async function LandingPage() {
    const [news, events, repeaters, t] = await Promise.all([
        fetchLatestNews(),
        fetchUpcomingEvents(),
        fetchRecentRepeaters(),
        getTranslations(),
    ])

    const now = Date.now()
    const liveCount = events.filter((e) => {
        const start = new Date(e.start).getTime()
        const end = e.end ? new Date(e.end).getTime() : start + 60 * 60 * 1000
        return start <= now && end > now
    }).length

    return (
        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-12">
            <Hero liveCount={liveCount} upcomingCount={events.length} t={t} />

            <ToolsRow t={t} />

            <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
                <EventsCard events={events} liveCount={liveCount} t={t} />
                <NewsCard news={news} t={t} />
            </div>

            <RepeatersCard repeaters={repeaters} t={t} />
        </main>
    )
}

type T = Awaited<ReturnType<typeof getTranslations>>

function Hero({ liveCount, upcomingCount, t }: { liveCount: number; upcomingCount: number; t: T }) {
    return (
        <section className="text-center pt-4 pb-2">
            {liveCount > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-azulejo-50 dark:bg-azulejo-950/40 px-3 py-1 text-xs font-medium text-azulejo-700 dark:text-azulejo-300 mb-5">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-azulejo-500 opacity-60 motion-reduce:hidden" />
                        <span className="relative inline-flex size-2 rounded-full bg-azulejo-500" />
                    </span>
                    {`${liveCount} evento${liveCount > 1 ? 's' : ''} ao vivo`}
                    {upcomingCount > 0 && <span className="text-muted-foreground"> · {upcomingCount} próximos</span>}
                </div>
            )}
            <h1 className="mx-auto max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] text-foreground">
                O diretório português de{' '}
                <span className="bg-gradient-to-br from-azulejo-400 via-azulejo-500 to-azulejo-700 bg-clip-text [color:transparent] [-webkit-text-fill-color:transparent]">
                    repetidores
                </span>
                , eventos e ferramentas.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                {t('landing.subtitle')}
            </p>
        </section>
    )
}

type Tool = {
    href: string
    icon: LucideIcon
    labelKey: 'toolMorse' | 'toolIndicativos' | 'toolBandas' | 'toolCalculadoras' | 'toolCodigoQ'
    subKey: 'toolMorseSub' | 'toolIndicativosSub' | 'toolBandasSub' | 'toolCalculadorasSub' | 'toolCodigoQSub'
    iconClass: string
}

// Pastel icon backplates at L≈0.92, C≈0.045 (light) and L≈0.26, C≈0.045 / 0.6α (dark).
// Icon foreground at L≈0.45–0.48, C≈0.13 (light) and L≈0.78–0.80, C≈0.13 (dark).
// Hue rotation for category identity only; each tile remains an instance of the same surface.
const TOOLS: Tool[] = [
    {
        href: '/morse', icon: Volume2,
        labelKey: 'toolMorse', subKey: 'toolMorseSub',
        iconClass: 'bg-[oklch(0.92_0.045_252)] text-[oklch(0.45_0.13_252)] dark:bg-[oklch(0.26_0.045_252/0.6)] dark:text-[oklch(0.78_0.13_252)]',
    },
    {
        href: '/indicativos', icon: IdCard,
        labelKey: 'toolIndicativos', subKey: 'toolIndicativosSub',
        iconClass: 'bg-[oklch(0.92_0.045_200)] text-[oklch(0.45_0.13_200)] dark:bg-[oklch(0.26_0.045_200/0.6)] dark:text-[oklch(0.78_0.13_200)]',
    },
    {
        href: '/bandas', icon: Radio,
        labelKey: 'toolBandas', subKey: 'toolBandasSub',
        iconClass: 'bg-[oklch(0.92_0.040_145)] text-[oklch(0.45_0.13_145)] dark:bg-[oklch(0.26_0.040_145/0.6)] dark:text-[oklch(0.78_0.13_145)]',
    },
    {
        href: '/calculadoras', icon: Calculator,
        labelKey: 'toolCalculadoras', subKey: 'toolCalculadorasSub',
        iconClass: 'bg-[oklch(0.92_0.050_75)] text-[oklch(0.48_0.13_75)] dark:bg-[oklch(0.26_0.050_75/0.6)] dark:text-[oklch(0.80_0.13_75)]',
    },
    {
        href: '/codigoq', icon: BookOpen,
        labelKey: 'toolCodigoQ', subKey: 'toolCodigoQSub',
        iconClass: 'bg-[oklch(0.92_0.045_320)] text-[oklch(0.48_0.13_320)] dark:bg-[oklch(0.26_0.045_320/0.6)] dark:text-[oklch(0.80_0.13_320)]',
    },
]

function ToolsRow({ t }: { t: T }) {
    return (
        <section>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {TOOLS.map((tool) => {
                    const Icon = tool.icon
                    return (
                        <li key={tool.href}>
                            <Link
                                href={tool.href}
                                className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06),0_4px_12px_oklch(0.20_0.012_250/0.04)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-azulejo-200 hover:shadow-[0_1px_2px_oklch(0.20_0.012_250/0.08),0_8px_24px_oklch(0.20_0.012_250/0.08)] dark:hover:border-azulejo-800/60"
                            >
                                <div className="flex items-start justify-between">
                                    <div className={`flex size-9 items-center justify-center rounded-lg ${tool.iconClass}`}>
                                        <Icon className="size-5" aria-hidden="true" />
                                    </div>
                                    <ArrowRightIcon
                                        className="size-4 text-muted-foreground/30 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-azulejo-500"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold tracking-[-0.005em] text-foreground">
                                        {t(`landing.${tool.labelKey}`)}
                                    </div>
                                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                        {t(`landing.${tool.subKey}`)}
                                    </div>
                                </div>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

function SectionHeader({ title, href, label, livePill }: { title: string; href: string; label: string; livePill?: number }) {
    return (
        <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold tracking-[-0.015em] text-foreground">{title}</h2>
                {livePill && livePill > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-azulejo-100 dark:bg-azulejo-950/50 px-2 py-0.5 text-[11px] font-medium text-azulejo-700 dark:text-azulejo-300">
                        <span className="relative flex size-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-azulejo-500 opacity-60 motion-reduce:hidden" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-azulejo-500" />
                        </span>
                        {livePill} ao vivo
                    </span>
                ) : null}
            </div>
            <Link
                href={href}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors duration-150 hover:bg-azulejo-50 hover:text-azulejo-700 dark:hover:bg-azulejo-950/30 dark:hover:text-azulejo-300"
            >
                {label}
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Link>
        </header>
    )
}

function SoftCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <section
            className={`rounded-xl border border-border bg-card p-5 sm:p-6 shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06),0_4px_12px_oklch(0.20_0.012_250/0.04)] ${className ?? ''}`}
        >
            {children}
        </section>
    )
}

function EventsCard({ events, liveCount, t }: { events: EventItem[]; liveCount: number; t: T }) {
    const now = Date.now()
    const today = new Date()
    return (
        <SoftCard className="space-y-4">
            <SectionHeader
                title={t('landing.eventsTitle')}
                href="/events"
                label={t('landing.eventsAll')}
                livePill={liveCount}
            />
            {events.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('landing.eventsEmpty')}</p>
            ) : (
                <ol className="-mx-2 space-y-1">
                    {events.map((event) => {
                        const start = new Date(event.start)
                        const startMs = start.getTime()
                        const live = startMs <= now && (!event.end || new Date(event.end).getTime() > now)
                        const sameDay = start.toDateString() === today.toDateString()
                        const tomorrow =
                            !sameDay &&
                            start.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString()
                        return (
                            <li key={event.id}>
                                <Link
                                    href={event.url ?? `/events/${event.id}`}
                                    className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-azulejo-50/50 dark:hover:bg-azulejo-950/20"
                                >
                                    <div className="flex flex-col">
                                        <span className={`font-mono text-sm font-semibold tabular-nums ${live ? 'text-azulejo-600 dark:text-azulejo-400' : 'text-foreground'}`}>
                                            {formatUTCHHMM(event.start)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {live ? 'agora' : sameDay ? 'hoje' : tomorrow ? 'amanhã' : `${start.getDate()} ${PT_MONTHS[start.getMonth()]}`}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium tracking-[-0.005em] text-foreground">
                                            {event.title}
                                        </div>
                                        {(event.location || event.category) && (
                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                {event.category && <span className="capitalize">{event.category}</span>}
                                                {event.category && event.location && (
                                                    <span aria-hidden="true">·</span>
                                                )}
                                                {event.location && <span className="truncate">{event.location}</span>}
                                            </div>
                                        )}
                                    </div>
                                    {live && (
                                        <span className="inline-flex items-center rounded-full bg-azulejo-100 px-2 py-0.5 text-[10px] font-medium text-azulejo-700 dark:bg-azulejo-950/50 dark:text-azulejo-300">
                                            {t('landing.now')}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        )
                    })}
                </ol>
            )}
        </SoftCard>
    )
}

function NewsCard({ news, t }: { news: NewsItem[]; t: T }) {
    return (
        <SoftCard className="space-y-4">
            <SectionHeader
                title={t('landing.newsTitle')}
                href="/noticias"
                label={t('landing.viewAllNews')}
            />
            {news.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Sem notícias recentes.</p>
            ) : (
                <NewsList news={news} />
            )}
        </SoftCard>
    )
}

function NewsList({ news }: { news: NewsItem[] }) {
    const [lead, ...rest] = news
    return (
        <div className="space-y-4">
            <Link href={`/noticias/${lead.slug}`} className="group block space-y-2.5">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-muted">
                    {lead.featuredImage?.url ? (
                        <Image
                            src={lead.featuredImage.url}
                            alt={lead.featuredImage.alt || lead.title}
                            fill
                            sizes="(min-width: 1024px) 40vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-azulejo-100 to-azulejo-200 dark:from-azulejo-900/40 dark:to-azulejo-800/30" />
                    )}
                </div>
                <h3 className="text-sm font-semibold tracking-[-0.005em] leading-snug text-foreground transition-colors group-hover:text-azulejo-700 dark:group-hover:text-azulejo-400">
                    {lead.title}
                </h3>
                {lead.publishedDate && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                        {formatDatePT(new Date(lead.publishedDate))}
                    </p>
                )}
            </Link>
            {rest.length > 0 && (
                <ol className="-mx-2 space-y-0.5 border-t border-border pt-3">
                    {rest.slice(0, 3).map((item) => (
                        <li key={item.id}>
                            <Link href={`/noticias/${item.slug}`} className="block rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-azulejo-50/50 dark:hover:bg-azulejo-950/20">
                                <h3 className="text-[13px] font-medium tracking-[-0.005em] leading-snug text-foreground line-clamp-2">
                                    {item.title}
                                </h3>
                                {item.publishedDate && (
                                    <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                                        {formatDatePT(new Date(item.publishedDate))}
                                    </p>
                                )}
                            </Link>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    )
}

function RepeatersCard({ repeaters, t }: { repeaters: Repeater[]; t: T }) {
    return (
        <SoftCard className="space-y-4">
            <SectionHeader
                title={t('landing.activityTitle')}
                href="/repetidores"
                label={t('landing.activityAllRepeaters')}
            />
            {repeaters.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('landing.activityEmpty')}</p>
            ) : (
                <ol className="-mx-2 divide-y divide-border/60">
                    {repeaters.map((r) => {
                        const primary = r.frequencies.find((f) => f.isPrimary) ?? r.frequencies[0]
                        const freq = primary?.outputFrequency
                        const modes = r.modes?.join(' · ')
                        const verified = r.lastVerified ? new Date(r.lastVerified) : null
                        return (
                            <li key={String(r.id ?? r.callsign)}>
                                <Link
                                    href={`/repeater/${encodeURIComponent(r.callsign.toUpperCase())}`}
                                    className="grid grid-cols-[7rem_1fr_auto] items-center gap-4 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-azulejo-50/50 dark:hover:bg-azulejo-950/20 sm:grid-cols-[8rem_1fr_auto]"
                                >
                                    <span className="font-mono text-sm font-semibold tabular-nums text-foreground transition-colors group-hover:text-azulejo-700 dark:group-hover:text-azulejo-400">
                                        {r.callsign.toUpperCase()}
                                    </span>
                                    <span className="min-w-0 truncate text-sm text-muted-foreground">
                                        {[r.address, modes].filter(Boolean).join(' · ')}
                                    </span>
                                    <div className="flex items-baseline gap-3 font-mono text-sm tabular-nums">
                                        {typeof freq === 'number' && (
                                            <span className="text-foreground">
                                                {freq.toFixed(freq >= 100 ? 3 : 4)}
                                            </span>
                                        )}
                                        {verified && (
                                            <span className="hidden text-[11px] text-muted-foreground sm:inline">
                                                {formatDatePT(verified)}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        )
                    })}
                </ol>
            )}
        </SoftCard>
    )
}
