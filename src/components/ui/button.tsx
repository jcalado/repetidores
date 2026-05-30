import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-azulejo-500/40 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-azulejo-500 to-azulejo-600 text-white shadow-[0_2px_6px_oklch(0.50_0.137_252/0.35)] hover:from-azulejo-600 hover:to-azulejo-700 hover:shadow-[0_4px_10px_oklch(0.50_0.137_252/0.4)] hover:-translate-y-px",
        destructive:
          "bg-destructive text-white shadow-[0_2px_6px_oklch(0.577_0.245_27/0.3)] hover:bg-destructive/90 hover:-translate-y-px focus-visible:ring-destructive/30 dark:bg-destructive/80",
        outline:
          "border border-border bg-card text-foreground shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06)] hover:bg-azulejo-50 hover:border-azulejo-300 hover:text-azulejo-700 dark:bg-card dark:hover:bg-azulejo-950/30 dark:hover:border-azulejo-700 dark:hover:text-azulejo-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-azulejo-100/60 hover:text-azulejo-700 dark:hover:bg-azulejo-950/30 dark:hover:text-azulejo-300",
        link: "text-azulejo-600 dark:text-azulejo-400 underline-offset-4 hover:underline hover:text-azulejo-700 dark:hover:text-azulejo-300",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        pill: "h-9 rounded-full px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
