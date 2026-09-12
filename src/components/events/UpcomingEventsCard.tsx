import Link from 'next/link'

import { SectionHeader } from '@/components/landing/SectionHeader'
import { SoftCard } from '@/components/landing/SoftCard'
import { PT_MONTHS } from '@/lib/time'
import { dateKeyUTC, formatTime } from './utils/formatters'
import type { EventItem, TranslationFunction } from './types'

interface UpcomingEventsCardProps {
    events: EventItem[]
    /** Number of events currently running, shown as a pill beside the title. */
    liveCount: number
    t: TranslationFunction
    /**
     * Clock reading behind the "ao vivo" / today / tomorrow labels. Reading the
     * clock belongs to the data step, not to render, so callers that already
     * read it (see `countLiveEvents` on the landing page) should pass it in.
     * When omitted it is read once here, which on a statically exported page
     * means build time.
     */
    now?: Date
    /** Overrides for the copy, which defaults to the `landing.*` messages. */
    title?: string
    href?: string
    label?: string
    emptyLabel?: string
}

/**
 * A compact list of upcoming events: UTC start time, a relative day label and
 * the event's title, category and location. Times are rendered in UTC, the
 * convention for contests and nets, so the day labels key off the UTC date too.
 */
export function UpcomingEventsCard({
    events,
    liveCount,
    t,
    now,
    title,
    href = '/events',
    label,
    emptyLabel,
}: UpcomingEventsCardProps) {
    // One reading for every comparison below: two separate reads could straddle a
    // millisecond or a midnight and disagree about what "hoje" means.
    const today = now ?? new Date()
    const todayMs = today.getTime()
    return (
        <SoftCard
            header={
                <SectionHeader
                    title={title ?? t('landing.eventsTitle')}
                    href={href}
                    label={label ?? t('landing.eventsAll')}
                    livePill={liveCount}
                />
            }
        >
            {events.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    {emptyLabel ?? t('landing.eventsEmpty')}
                </p>
            ) : (
                <ol className="-mx-2 space-y-1">
                    {events.map((event) => {
                        const start = new Date(event.start)
                        const startMs = start.getTime()
                        const live =
                            startMs <= todayMs &&
                            (!event.end || new Date(event.end).getTime() > todayMs)
                        const sameDay = dateKeyUTC(start) === dateKeyUTC(today)
                        const tomorrow =
                            !sameDay &&
                            dateKeyUTC(start) === dateKeyUTC(new Date(todayMs + 24 * 60 * 60 * 1000))
                        return (
                            <li key={event.id}>
                                <Link
                                    href={event.url ?? `/events/${event.id}`}
                                    className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-azulejo-50/50 dark:hover:bg-azulejo-950/20"
                                >
                                    <div className="flex flex-col">
                                        <span className={`font-mono text-sm font-semibold tabular-nums ${live ? 'text-azulejo-600 dark:text-azulejo-400' : 'text-foreground'}`}>
                                            {formatTime(event.start)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {live
                                                ? t('landing.eventsNow')
                                                : sameDay
                                                  ? t('landing.today')
                                                  : tomorrow
                                                    ? t('landing.tomorrow')
                                                    : `${start.getUTCDate()} ${PT_MONTHS[start.getUTCMonth()]}`}
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
