"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Option = {
  label: string
  value: string | number
}

type ComboboxProps = {
  value: string | number
  onChange: (value: string | number) => void
  options: Option[]
  placeholder?: string
  className?: string
  ariaLabel?: string
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select option",
  className,
  ariaLabel,
}: ComboboxProps) {
  const selected = options.find((o) => String(o.value) === String(value))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "inline-flex h-9 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-azulejo-500 focus-visible:ring-azulejo-500/40 focus-visible:ring-[3px]",
            className
          )}
        >
          <span>{selected ? selected.label : placeholder}</span>
          <ChevronDown aria-hidden className="size-4 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((opt) => (
          <DropdownMenuItem
            key={String(opt.value)}
            onSelect={(e) => {
              e.preventDefault()
              onChange(opt.value)
            }}
            className="flex items-center gap-2"
          >
            <span className="inline-flex w-4 items-center justify-center">
              {String(opt.value) === String(value) ? (
                <Check className="size-4" />
              ) : null}
            </span>
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

