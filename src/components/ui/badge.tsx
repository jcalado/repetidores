import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-azulejo-500/40 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,background-color,box-shadow] duration-150 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-azulejo-100 text-azulejo-700 dark:bg-azulejo-950/50 dark:text-azulejo-300 [a&]:hover:bg-azulejo-200 dark:[a&]:hover:bg-azulejo-900/60",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        success:
          "border-transparent bg-[oklch(0.94_0.04_145)] text-[oklch(0.40_0.13_145)] dark:bg-[oklch(0.30_0.06_145/0.5)] dark:text-[oklch(0.78_0.13_145)]",
        warning:
          "border-transparent bg-[oklch(0.95_0.04_75)] text-[oklch(0.42_0.13_75)] dark:bg-[oklch(0.30_0.06_75/0.5)] dark:text-[oklch(0.80_0.13_75)]",
        destructive:
          "border-transparent bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-[oklch(0.85_0.18_22)] [a&]:hover:bg-destructive/25",
        outline:
          "text-foreground border-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        live:
          "border-transparent bg-azulejo-100 text-azulejo-700 dark:bg-azulejo-950/50 dark:text-azulejo-300 before:content-[''] before:size-1.5 before:rounded-full before:bg-azulejo-500 before:mr-1 before:animate-[pulse_2s_ease-in-out_infinite] motion-reduce:before:animate-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
