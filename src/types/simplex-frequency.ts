export interface SimplexFrequency {
  id: string
  frequency: number
  municipality: string
  district: string
  latitude: number
  longitude: number
  mode: 'FM' | 'DMR' | 'D-STAR' | 'C4FM'
  tone: number | null
  band: 'VHF' | 'UHF'
  status: 'active' | 'inactive'
  notes: string | null
}
