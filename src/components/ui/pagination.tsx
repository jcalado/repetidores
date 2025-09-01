"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav role="navigation" aria-label="pagination" className={cn("w-full", className)} {...props} />
)

const PaginationContent = ({ className, ...props }: React.ComponentProps<"ul">) => (
  <ul className={cn("flex items-center gap-1", className)} {...props} />
)

const PaginationItem = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li className={cn("", className)} {...props} />
)

type PaginationLinkProps = React.ComponentProps<"a"> & {
  isActive?: boolean
  disabled?: boolean
}

const baseLink =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border bg-background px-3 text-sm transition-colors hover:bg-accent aria-disabled:opacity-50 aria-disabled:pointer-events-none"

const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ className, isActive, disabled, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled ? true : undefined}
      className={cn(
        baseLink,
        isActive && "border-primary bg-accent",
        className
      )}
      {...props}
    />
  )
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({ className, ...props }: PaginationLinkProps) => (
  <PaginationLink className={cn(className)} {...props}>
    <span className="sr-only">Previous</span>
    <span aria-hidden>‹</span>
  </PaginationLink>
)

const PaginationNext = ({ className, ...props }: PaginationLinkProps) => (
  <PaginationLink className={cn(className)} {...props}>
    <span className="sr-only">Next</span>
    <span aria-hidden>›</span>
  </PaginationLink>
)

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span className={cn("px-2 text-sm", className)} {...props}>
    …
    <span className="sr-only">More pages</span>
  </span>
)

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}

