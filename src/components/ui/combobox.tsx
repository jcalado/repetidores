"use client"

import * as React from "react"
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
            "inline-flex h-9 items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm",
            className
          )}
        >
          <span>{selected ? selected.label : placeholder}</span>
          <span aria-hidden>▾</span>
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
            <span className="inline-block w-4 text-center">
              {String(opt.value) === String(value) ? "✓" : ""}
            </span>
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

