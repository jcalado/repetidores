"use client"

import * as Popover from "@radix-ui/react-popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface FacetedFilterOption {
  value: string
  label: string
  count?: number
}

interface FacetedFilterProps {
  icon?: React.ReactNode
  title: string
  options: FacetedFilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function FacetedFilter({ icon, title, options, selected, onChange }: FacetedFilterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      // Small delay to let popover render before focusing
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    } else {
      setSearch("")
    }
  }, [open])

  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.value.toLowerCase().includes(search.toLowerCase()),
      )
    : options

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const isActive = selected.length > 0

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={`
            group inline-flex items-center gap-1.5 h-8 rounded-md text-xs font-medium
            border shadow-xs transition-all duration-150
            ${isActive
              ? "bg-ship-cove-50 dark:bg-ship-cove-950/50 border-ship-cove-200 dark:border-ship-cove-800 text-ship-cove-800 dark:text-ship-cove-200"
              : "bg-transparent dark:bg-input/30 border-input text-muted-foreground hover:text-foreground"
            }
            ${isActive ? "pl-2.5 pr-1.5" : "px-2.5"}
          `}
        >
          {icon && <span className="opacity-60 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
          <span>{title}</span>
          {isActive && (
            <>
              <span className="h-3.5 w-px bg-ship-cove-300 dark:bg-ship-cove-700 mx-0.5" />
              <Badge
                variant="secondary"
                className="h-5 min-w-5 px-1 rounded text-[10px] font-semibold bg-ship-cove-500 dark:bg-ship-cove-600 text-white border-0"
              >
                {selected.length}
              </Badge>
            </>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className={`
            z-50 w-56 rounded-lg border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-900
            shadow-lg shadow-slate-200/50 dark:shadow-black/30
            animate-in fade-in-0 zoom-in-95
            data-[side=bottom]:slide-in-from-top-2
            data-[side=top]:slide-in-from-bottom-2
          `}
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Filtrar ${title.toLowerCase()}...`}
              className="flex-1 bg-transparent text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none text-foreground"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">Sem resultados</p>
            ) : (
              filtered.map((option) => {
                const checked = selected.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggle(option.value)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left
                      transition-colors duration-75
                      ${checked
                        ? "text-foreground"
                        : "text-slate-600 dark:text-slate-400"
                      }
                      hover:bg-slate-50 dark:hover:bg-slate-800/50
                    `}
                  >
                    <Checkbox
                      checked={checked}
                      className="h-3.5 w-3.5 rounded-[3px] border-slate-300 dark:border-slate-600 data-[state=checked]:bg-ship-cove-500 data-[state=checked]:border-ship-cove-500"
                      tabIndex={-1}
                    />
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.count != null && (
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                        {option.count.toLocaleString("pt-PT")}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-1.5">
              <button
                onClick={() => onChange([])}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Limpar seleção
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
