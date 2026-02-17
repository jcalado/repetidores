"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { CallsignStats } from "@/types/callsign"
import { Users, UserCheck, TrendingUp, Activity } from "lucide-react"

interface StatsCardsProps {
  stats: CallsignStats
  loading?: boolean
}

interface StatCardProps {
  icon: React.ReactNode
  value: number
  label: string
  trend?: string
  trendColor?: string
  iconBgClass: string
  iconTextClass: string
}

function StatCard({ icon, value, label, trend, trendColor, iconBgClass, iconTextClass }: StatCardProps) {
  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}>
            <span className={iconTextClass}>{icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {value.toLocaleString("pt-PT")}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{label}</p>
            {trend && (
              <p className={`text-xs font-medium ${trendColor || "text-slate-400"}`}>{trend}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const activos = Object.entries(stats.byEstado)
    .filter(([key]) => key.toLowerCase() === "ativo" || key.toLowerCase() === "activo")
    .reduce((sum, [, count]) => sum + count, 0)

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-2">
                  <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Users className="h-5 w-5" />}
        value={stats.total}
        label="Total Indicativos"
        iconBgClass="bg-ship-cove-100 dark:bg-ship-cove-900/50"
        iconTextClass="text-ship-cove-600 dark:text-ship-cove-400"
      />
      <StatCard
        icon={<UserCheck className="h-5 w-5" />}
        value={activos}
        label="Activos"
        iconBgClass="bg-emerald-100 dark:bg-emerald-900/50"
        iconTextClass="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        value={stats.newThisMonth}
        label="Novos Este Mês"
        trendColor="text-emerald-500"
        iconBgClass="bg-blue-100 dark:bg-blue-900/50"
        iconTextClass="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        icon={<Activity className="h-5 w-5" />}
        value={stats.changesThisMonth}
        label="Alterações Este Mês"
        iconBgClass="bg-amber-100 dark:bg-amber-900/50"
        iconTextClass="text-amber-600 dark:text-amber-400"
      />
    </div>
  )
}
