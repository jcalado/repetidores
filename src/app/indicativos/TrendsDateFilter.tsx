"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format, subMonths } from "date-fns"
import { useCallback, useState } from "react"

export interface DateRange {
  startDate?: string
  endDate?: string
}

type Preset = "all" | "3m" | "6m" | "1y" | "custom"

interface TrendsDateFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  /** Called externally to reset preset to "all" */
  resetRef?: React.RefObject<{ reset: () => void } | null>
}

function presetToRange(preset: Preset): DateRange {
  if (preset === "all") return {}
  const now = new Date()
  const end = format(now, "yyyy-MM-dd")
  if (preset === "3m") return { startDate: format(subMonths(now, 3), "yyyy-MM-dd"), endDate: end }
  if (preset === "6m") return { startDate: format(subMonths(now, 6), "yyyy-MM-dd"), endDate: end }
  if (preset === "1y") return { startDate: format(subMonths(now, 12), "yyyy-MM-dd"), endDate: end }
  return {}
}

export function TrendsDateFilter({ value, onChange, resetRef }: TrendsDateFilterProps) {
  const [preset, setPreset] = useState<Preset>("all")

  // Allow parent to reset preset state
  if (resetRef) {
    resetRef.current = {
      reset: () => setPreset("all"),
    }
  }

  const handlePresetChange = useCallback(
    (v: string) => {
      const p = v as Preset
      setPreset(p)
      if (p !== "custom") {
        onChange(presetToRange(p))
      }
    },
    [onChange],
  )

  const handleCustomDate = useCallback(
    (field: "startDate" | "endDate", val: string) => {
      onChange({ ...value, [field]: val || undefined })
    },
    [value, onChange],
  )

  return (
    <>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-input/30">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo o histórico</SelectItem>
          <SelectItem value="3m">Últimos 3 meses</SelectItem>
          <SelectItem value="6m">Últimos 6 meses</SelectItem>
          <SelectItem value="1y">Último ano</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <>
          <input
            type="date"
            value={value.startDate || ""}
            onChange={(e) => handleCustomDate("startDate", e.target.value)}
            className="h-9 rounded-md border border-input bg-white dark:bg-input/30 px-3 text-sm text-foreground"
          />
          <span className="text-sm text-slate-400">a</span>
          <input
            type="date"
            value={value.endDate || ""}
            onChange={(e) => handleCustomDate("endDate", e.target.value)}
            className="h-9 rounded-md border border-input bg-white dark:bg-input/30 px-3 text-sm text-foreground"
          />
        </>
      )}
    </>
  )
}
