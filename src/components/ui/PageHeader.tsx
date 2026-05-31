"use client";

/**
 * PageHeader - Reusable page header components.
 * StandardPageHeader renders a simple bordered header band with an icon slot.
 */

import { cn } from "@/lib/utils";

// Stat item for the stats row
export interface PageHeaderStat {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  variant?: "default" | "success";
}

// Convenience component for a standard page header layout
interface StandardPageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  stats?: PageHeaderStat[];
  floatingIcons?: React.ReactNode[];
  actions?: React.ReactNode;
  compact?: boolean;
  noMargin?: boolean;
  className?: string;
}

export function StandardPageHeader({
  icon,
  title,
  subtitle,
  description,
  stats,
  actions,
  noMargin = false,
  className,
}: StandardPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-border",
        !noMargin && "mb-8",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-azulejo-100 dark:bg-azulejo-900/40 text-azulejo-600 dark:text-azulejo-400 shrink-0 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            {title}
            {subtitle && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {subtitle}
              </span>
            )}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground hidden sm:block">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {stats.map((stat, index) => (
              <span key={index} className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-foreground">
                  {stat.value}
                </span>
                {stat.label}
              </span>
            ))}
          </div>
        )}
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

export default StandardPageHeader;
