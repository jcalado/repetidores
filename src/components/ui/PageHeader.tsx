"use client";

/**
 * PageHeader - Reusable header component with Radio Station Dashboard aesthetic
 * Provides the gradient background, grid pattern, and decorative elements
 */

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// Stat item for the stats row
export interface PageHeaderStat {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  variant?: "default" | "success";
}

interface PageHeaderProps {
  /** Main content - use PageHeaderContent for standard layout or custom JSX */
  children: React.ReactNode;
  /** Optional floating icons on the right side (desktop only) */
  floatingIcons?: React.ReactNode[];
  /** Compact mode with smaller padding */
  compact?: boolean;
  /** Remove bottom margin */
  noMargin?: boolean;
  /** Additional classes */
  className?: string;
  /** Unique pattern ID to avoid SVG conflicts (default: auto-generated) */
  patternId?: string;
}

// Counter for generating unique pattern IDs
let patternIdCounter = 0;

export function PageHeader({
  children,
  floatingIcons,
  compact = false,
  noMargin = false,
  className,
  patternId,
}: PageHeaderProps) {
  // Generate unique pattern ID if not provided
  const uniquePatternId = patternId || `grid-pattern-${++patternIdCounter}`;

  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-ship-cove-600 via-ship-cove-700 to-ship-cove-800 dark:from-ship-cove-800 dark:via-ship-cove-900 dark:to-ship-cove-950 shadow-xl shadow-ship-cove-500/20",
        compact ? "p-4 sm:p-6" : "p-6 sm:p-8",
        !noMargin && "mb-8",
        className
      )}
    >
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id={uniquePatternId}
              width={compact ? "24" : "32"}
              height={compact ? "24" : "32"}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={compact ? "M 24 0 L 0 0 0 24" : "M 32 0 L 0 0 0 32"}
                fill="none"
                stroke="currentColor"
                strokeWidth={compact ? "0.5" : "1"}
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={`url(#${uniquePatternId})`}
            className="text-white"
          />
        </svg>
      </div>

      {/* Decorative blur circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-ship-cove-500/20 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-ship-cove-400/20 blur-xl" />

      {/* Floating icons (desktop only) */}
      {floatingIcons && floatingIcons.length > 0 && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 opacity-20">
          {floatingIcons}
        </div>
      )}

      {/* Content */}
      <div className="relative">{children}</div>
    </header>
  );
}

// Helper component for the icon box
interface PageHeaderIconProps {
  icon: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function PageHeaderIcon({ icon, size = "md" }: PageHeaderIconProps) {
  const sizeClasses = {
    sm: "h-10 w-10 sm:h-12 sm:w-12",
    md: "h-14 w-14",
    lg: "h-20 w-20",
  };

  const iconSizeClasses = {
    sm: "[&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-6 sm:[&>svg]:w-6",
    md: "[&>svg]:h-7 [&>svg]:w-7",
    lg: "[&>svg]:h-10 [&>svg]:w-10",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 text-white shrink-0",
        sizeClasses[size],
        iconSizeClasses[size]
      )}
    >
      {icon}
    </div>
  );
}

// Helper component for standard title layout
interface PageHeaderTitleProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconSize?: "sm" | "md" | "lg";
}

export function PageHeaderTitle({
  icon,
  title,
  subtitle,
  iconSize = "md",
}: PageHeaderTitleProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <PageHeaderIcon icon={icon} size={iconSize} />
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-ship-cove-200 text-sm sm:text-base mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Helper component for subtitle/description
interface PageHeaderDescriptionProps {
  children: React.ReactNode;
}

export function PageHeaderDescription({ children }: PageHeaderDescriptionProps) {
  return (
    <p className="text-ship-cove-100 text-base sm:text-lg max-w-2xl mb-6">
      {children}
    </p>
  );
}

// Helper component for stats row
interface PageHeaderStatsProps {
  stats: PageHeaderStat[];
}

export function PageHeaderStats({ stats }: PageHeaderStatsProps) {
  return (
    <div className="flex flex-wrap gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg backdrop-blur-sm",
            stat.variant === "success"
              ? "bg-emerald-500/20 text-emerald-100"
              : "bg-white/10 text-white"
          )}
        >
          {stat.icon}
          <span className="font-mono font-bold tabular-nums">{stat.value}</span>
          <span
            className={cn(
              "text-sm",
              stat.variant === "success"
                ? "text-emerald-200/80"
                : "text-ship-cove-200"
            )}
          >
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
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
  floatingIcons,
  actions,
  compact = false,
  noMargin = false,
  className,
}: StandardPageHeaderProps) {
  return (
    <PageHeader
      floatingIcons={floatingIcons}
      compact={compact}
      noMargin={noMargin}
      className={className}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <PageHeaderTitle
            icon={icon}
            title={title}
            subtitle={subtitle}
            iconSize={compact ? "sm" : "md"}
          />
          {description && (
            <PageHeaderDescription>{description}</PageHeaderDescription>
          )}
          {stats && stats.length > 0 && <PageHeaderStats stats={stats} />}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </PageHeader>
  );
}

export default PageHeader;
