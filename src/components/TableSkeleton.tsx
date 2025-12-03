"use client"

import { cn } from "@/lib/utils"

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-muted",
        className
      )}
    />
  )
}

export function TableSkeleton({
  rows = 10,
  columns = 7,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex gap-4 border-b pb-3 mb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Shimmer
            key={`header-${i}`}
            className={cn(
              "h-4",
              i === 0 ? "w-8" : i === 1 ? "w-20" : "flex-1"
            )}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} className="flex gap-4 items-center py-2">
            {/* Favorite icon */}
            <Shimmer className="h-5 w-5 rounded-full" />
            {/* Status dot */}
            <Shimmer className="h-3 w-3 rounded-full" />
            {/* Callsign */}
            <Shimmer className="h-4 w-16" />
            {/* Band */}
            <Shimmer className="h-4 w-12" />
            {/* Frequency */}
            <Shimmer className="h-4 w-20" />
            {/* Modulation */}
            <Shimmer className="h-4 w-10" />
            {/* Owner */}
            <Shimmer className="h-4 flex-1 max-w-[120px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center", className)}>
      <div className="text-muted-foreground text-sm">A carregar mapa...</div>
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-4 space-y-3", className)}>
      <Shimmer className="h-5 w-2/3" />
      <Shimmer className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Shimmer className="h-6 w-16 rounded-full" />
        <Shimmer className="h-6 w-12 rounded-full" />
      </div>
    </div>
  )
}
