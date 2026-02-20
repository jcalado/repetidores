import type { ComponentType, ReactNode } from "react";

interface SectionCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  titleExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Generic card wrapper for content sections with icon and title header.
 * Styled with Radio Station Dashboard aesthetic.
 */
export function SectionCard({ icon: Icon, title, titleExtra, children }: SectionCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-500 to-transparent opacity-60" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-ship-cove-200 dark:border-ship-cove-800/50">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ship-cove-100 dark:bg-ship-cove-800">
          <Icon className="h-3.5 w-3.5 text-ship-cove-600 dark:text-ship-cove-400" />
        </div>
        <span className="text-sm font-semibold text-ship-cove-900 dark:text-ship-cove-100">
          {title}
        </span>
        {titleExtra && <span className="ml-auto">{titleExtra}</span>}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-3">{children}</div>
    </div>
  );
}
