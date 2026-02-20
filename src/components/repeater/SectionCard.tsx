import type { ComponentType, ReactNode } from "react";

interface SectionCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  titleExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Generic card wrapper for content sections with icon and title header.
 */
export function SectionCard({ icon: Icon, title, titleExtra, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-white dark:bg-ship-cove-950">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 sm:px-4 pt-3 pb-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
          <Icon className="h-3.5 w-3.5 text-ship-cove-600 dark:text-ship-cove-400" />
        </div>
        <span className="text-sm font-semibold text-ship-cove-900 dark:text-ship-cove-100">
          {title}
        </span>
        {titleExtra && <span className="ml-auto">{titleExtra}</span>}
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 pb-3">{children}</div>
    </div>
  );
}
