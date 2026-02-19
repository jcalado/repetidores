export interface Callsign {
  id: string
  indicativo: string
  nome: string
  categoria: string
  estado: string
  distrito: string
  concelho: string
  area: string
  morada: string
  codigoPostal: string
  localidade: string
  firstSeenAt: string | null
  lastSeenAt: string | null
}

export interface CallsignChange {
  id: string
  indicativo: string
  changeType: 'added' | 'removed' | 'modified'
  changedFields: Array<{ field: string; from: string; to: string }> | null
  detectedAt: string
  snapshotDate: string | null
}

export interface CallsignStats {
  total: number
  byEstado: Record<string, number>
  byCategoria: Record<string, number>
  byDistrito: Record<string, number>
  newThisMonth: number
  changesThisMonth: number
  lastSyncAt: string | null
}

export interface CallsignTrends {
  monthly: Array<{ month: string; added: number; removed: number; modified: number }>
  cumulative: Array<{ month: string; total: number }>
  byCategoria: Record<string, number>
  currentTotal: number
}

export interface PaginatedCallsignResponse<T> {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
}

export interface CategoryFlowEntry {
  indicativo: string
  reason: string
}

export interface CategoryFlowLeaving {
  indicativo: string
  reason: string
  flagged?: boolean
}

export interface CategoryFlows {
  month: string
  categories: Record<string, {
    entering: CategoryFlowEntry[]
    leaving: CategoryFlowLeaving[]
  }>
  availableMonths: string[]
}
