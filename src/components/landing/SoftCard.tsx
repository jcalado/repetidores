import type { ReactNode } from "react"

/**
 * The soft-shadowed card surface the landing sections are built from.
 *
 * Passing `header` seats it in a full-bleed Azulejo tint band closed by a Rule
 * hairline (DESIGN.md §5, "Header band"). The band carries the section title,
 * its status pill and its one link, nothing else. Without a `header` the card
 * is the plain padded surface it has always been.
 */
export function SoftCard({
    children,
    header,
    className,
}: {
    children: ReactNode
    header?: ReactNode
    className?: string
}) {
    const surface = `rounded-xl border border-border bg-card shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06),0_4px_12px_oklch(0.20_0.012_250/0.04)] ${className ?? ''}`

    if (!header) {
        return <section className={`p-5 sm:p-6 ${surface}`}>{children}</section>
    }

    return (
        <section className={`overflow-hidden ${surface}`}>
            <div className="border-b border-border bg-azulejo-50 px-5 py-4 dark:bg-azulejo-900/35 sm:px-6">
                {header}
            </div>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    )
}
