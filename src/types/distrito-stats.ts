export interface DistritoStats {
  distrito: string
  total: number
  active: number
  byCategoria: Record<string, number>
}
