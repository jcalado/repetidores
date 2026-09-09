import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

/**
 * Section title with a "see all" link, and an optional pulsing pill for a
 * live count.
 */
export function SectionHeader({
    title,
    href,
    label,
    livePill,
    livePillLabel = 'ao vivo',
}: {
    title: string
    href: string
    label: string
    livePill?: number
    livePillLabel?: string
}) {
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
                        {livePill} {livePillLabel}
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
