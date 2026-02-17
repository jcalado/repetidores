"use client"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface MultiSelectFilterProps {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
}

export function MultiSelectFilter({ label, options, selected, onChange, className }: MultiSelectFilterProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const displayText = selected.length === 0
    ? label
    : selected.length === 1
      ? selected[0]
      : `${selected.length} selecionados`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-white dark:bg-input/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-64 overflow-y-auto" align="start">
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onCheckedChange={() => toggle(opt.value)}
            onSelect={(e) => e.preventDefault()}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
