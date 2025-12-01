"use client"

import { getOwnerShort, useColumns, type Repeater } from "@/app/columns"
import MapClient from "@/components/MapClient"
import RepeaterDetails from "@/components/RepeaterDetails"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Drawer, DrawerContent, DrawerFooter, DrawerOverlay, DrawerTitle } from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { getCachedLocation, cacheLocation, searchLocation, type UserLocation, type GeocodingResult } from "@/lib/geolocation"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { ChevronDown, FunnelX, Heart, Loader2, MapPin, Search, X } from "lucide-react"
import { useTranslations } from 'next-intl'
import * as React from "react"

type Props = {
  data: Repeater[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  isLoading?: boolean
  initialRepeaterCallsign?: string | null
  onInitialRepeaterOpened?: () => void
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm"
  if (mhz >= 144 && mhz <= 148) return "2m"
  if (mhz >= 50 && mhz <= 54) return "6m"
  return "Other"
}

export default function RepeaterBrowser({
  data,
  activeTab = "table",
  onTabChange,
  isLoading = false,
  initialRepeaterCallsign,
  onInitialRepeaterOpened,
}: Props) {
  const t = useTranslations()
  const [userLocation, setUserLocation] = React.useState<UserLocation | null>(() => getCachedLocation())
  const [isLocating, setIsLocating] = React.useState(false)
  const [locationError, setLocationError] = React.useState<string | null>(null)
  const columns = useColumns({ userLocation })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Repeater | null>(null)
  const modulationOptions = React.useMemo(() => {
    const set = new Set<string>()
    data.forEach((d) => d.modulation && set.add(d.modulation))
    return Array.from(set).sort()
  }, [data])

  // Auto-open drawer for deep-linked repeater
  React.useEffect(() => {
    if (initialRepeaterCallsign && data.length > 0) {
      const repeater = data.find(
        (r) => r.callsign.toUpperCase() === initialRepeaterCallsign.toUpperCase()
      )
      if (repeater) {
        setSelected(repeater)
        setOpen(true)
        onInitialRepeaterOpened?.()
      }
    }
  }, [initialRepeaterCallsign, data, onInitialRepeaterOpened])

  // Geolocation handler
  const handleLocateMe = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('location.error.notSupported'))
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setUserLocation(location)
        cacheLocation(location)
        setIsLocating(false)
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(t('location.error.denied'))
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError(t('location.error.unavailable'))
            break
          case error.TIMEOUT:
            setLocationError(t('location.error.timeout'))
            break
          default:
            setLocationError(t('location.error.unknown'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }, [t])

  const handleClearLocation = React.useCallback(() => {
    setUserLocation(null)
    setLocationError(null)
    setLocationSearchQuery('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_location')
    }
  }, [])

  // Location search state
  const [locationSearchQuery, setLocationSearchQuery] = React.useState('')
  const [locationSearchResults, setLocationSearchResults] = React.useState<GeocodingResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [showSearchResults, setShowSearchResults] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Debounced location search
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!locationSearchQuery || locationSearchQuery.length < 2) {
      setLocationSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocation(locationSearchQuery)
      setLocationSearchResults(results)
      setShowSearchResults(true)
      setIsSearching(false)
    }, 300) // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [locationSearchQuery])

  const handleSelectSearchResult = React.useCallback((result: GeocodingResult) => {
    const location: UserLocation = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    }
    setUserLocation(location)
    cacheLocation(location)
    setLocationSearchQuery(result.display_name.split(',')[0]) // Show just the first part
    setShowSearchResults(false)
    setLocationSearchResults([])
  }, [])

  const filtered = React.useMemo(() => {
    let result = data
    const callsign = columnFilters.find((f) => f.id === "callsign")?.value as
      | string
      | undefined
    const band = columnFilters.find((f) => f.id === "band")?.value as
      | string
      | undefined
    const owner = columnFilters.find((f) => f.id === "owner")?.value as
      | string
      | undefined
    const modulation = columnFilters.find((f) => f.id === "modulation")?.value as
      | string[]
      | undefined
    const qth = columnFilters.find((f) => f.id === "qth_locator")?.value as
      | string
      | undefined

    if (callsign && callsign.trim()) {
      const q = callsign.trim().toLowerCase()
      result = result.filter((r) => r.callsign.toLowerCase().includes(q))
    }
    if (band) {
      result = result.filter(
        (r) => getBandFromFrequency(r.outputFrequency) === band
      )
    }
    if (owner && owner.trim()) {
      const q = owner.trim().toLowerCase()
      result = result.filter((r) =>
        r.owner.toLowerCase().includes(q) || getOwnerShort(r.owner).toLowerCase().includes(q)
      )
    }
    if (modulation && modulation.length > 0) {
      result = result.filter((r) =>
        modulation.some(m => {
          if (m === 'DMR' && r.dmr) return true
          if (m === 'D-STAR' && r.dstar) return true
          return r.modulation && m.toLowerCase() === r.modulation.toLowerCase()
        })
      )
    }
    if (qth && qth.trim()) {
      const q = qth.trim().toLowerCase()
      result = result.filter((r) => r.qth_locator?.toLowerCase().includes(q))
    }
    return result
  }, [data, columnFilters])

  return (
    <>
      <Card className="w-full max-w-7xl">
        <CardContent>
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList>
              <TabsTrigger value="table">{t('nav.table')}</TabsTrigger>
              <TabsTrigger value="map">{t('nav.map')}</TabsTrigger>
            </TabsList>
            <TabsContent value="table">
              {/* Location controls - search and geolocation */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {/* Location search input */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('location.searchPlaceholder')}
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      className="w-48 pl-8 pr-8"
                      disabled={!!userLocation}
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {/* Search results dropdown */}
                  {showSearchResults && locationSearchResults.length > 0 && (
                    <div className="absolute z-50 mt-1 w-72 rounded-md border bg-popover p-1 shadow-md">
                      {locationSearchResults.map((result) => (
                        <button
                          key={result.place_id}
                          type="button"
                          className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => handleSelectSearchResult(result)}
                        >
                          <div className="font-medium">{result.display_name.split(',')[0]}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {result.display_name.split(',').slice(1, 3).join(',')}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSearchResults && locationSearchResults.length === 0 && !isSearching && locationSearchQuery.length >= 2 && (
                    <div className="absolute z-50 mt-1 w-72 rounded-md border bg-popover p-2 shadow-md">
                      <span className="text-sm text-muted-foreground">{t('location.noResults')}</span>
                    </div>
                  )}
                </div>

                <span className="text-sm text-muted-foreground">{t('location.or')}</span>

                {/* Geolocation button */}
                {!userLocation ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {isLocating ? t('location.locating') : t('location.locateMe')}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearLocation}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('location.clearLocation')}
                  </Button>
                )}
                {locationError && (
                  <span className="text-sm text-destructive">{locationError}</span>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Show favorites toggle */}
                <Button
                  variant={columnFilters.find((f) => f.id === "favorite")?.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setColumnFilters((prev) => {
                      const hasFavoriteFilter = prev.find((f) => f.id === "favorite")
                      if (hasFavoriteFilter) {
                        return prev.filter((f) => f.id !== "favorite")
                      }
                      return [...prev, { id: "favorite", value: true }]
                    })
                  }}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {columnFilters.find((f) => f.id === "favorite")?.value
                    ? t('favorites.showAll')
                    : t('favorites.showOnly')}
                </Button>
              </div>
              <DataTable
                columns={columns}
                data={data}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                onRowClick={(row) => {
                  setSelected(row as Repeater)
                  setOpen(true)
                }}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="map" className="h-[500px]">
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>{t('filters.callsign')}</Label>
                    <Input
                      placeholder={t('filters.callsign')}
                      value={(columnFilters.find((f) => f.id === "callsign")?.value as string) ?? ""}
                      onChange={(event) => {
                        const v = event.target.value
                        setColumnFilters((prev) => {
                          const next = prev.filter((f) => f.id !== "callsign")
                          if (v) next.push({ id: "callsign", value: v })
                          return next
                        })
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('filters.owner')}</Label>
                    <Input
                      placeholder={t('filters.owner')}
                      value={(columnFilters.find((f) => f.id === "owner")?.value as string) ?? ""}
                      onChange={(event) => {
                        const v = event.target.value
                        setColumnFilters((prev) => {
                          const next = prev.filter((f) => f.id !== "owner")
                          if (v) next.push({ id: "owner", value: v })
                          return next
                        })
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('filters.qth')}</Label>
                    <Input
                      placeholder={t('filters.qth')}
                      value={(columnFilters.find((f) => f.id === "qth_locator")?.value as string) ?? ""}
                      onChange={(event) => {
                        const v = event.target.value
                        setColumnFilters((prev) => {
                          const next = prev.filter((f) => f.id !== "qth_locator")
                          if (v) next.push({ id: "qth_locator", value: v })
                          return next
                        })
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('filters.band')}</Label>
                    <Select
                      value={(columnFilters.find((f) => f.id === "band")?.value as string) ?? "all"}
                      onValueChange={(value) => {
                        setColumnFilters((prev) => {
                          const next = prev.filter((f) => f.id !== "band")
                          if (value && value !== "all") next.push({ id: "band", value })
                          return next
                        })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('filters.all')}</SelectItem>
                        <SelectItem value="2m">{t('filters.2m')}</SelectItem>
                        <SelectItem value="70cm">{t('filters.70cm')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('filters.modulation')}</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          <span className="truncate">
                            {(() => {
                              const selected = columnFilters.find((f) => f.id === "modulation")?.value as string[] | undefined
                              if (!selected || selected.length === 0) return t('filters.all')
                              return selected.join(', ')
                            })()}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px]">
                        <DropdownMenuLabel>{t('filters.modulation')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {modulationOptions.map((m) => {
                          const selected = (columnFilters.find((f) => f.id === "modulation")?.value as string[] | undefined) || []
                          return (
                            <DropdownMenuCheckboxItem
                              key={m}
                              checked={selected.includes(m)}
                              onCheckedChange={(checked) => {
                                setColumnFilters((prev) => {
                                  const next = prev.filter((f) => f.id !== "modulation")
                                  const current = (prev.find((f) => f.id === "modulation")?.value as string[] | undefined) || []
                                  const updated = checked
                                    ? [...current, m]
                                    : current.filter((v) => v !== m)
                                  if (updated.length > 0) {
                                    next.push({ id: "modulation", value: updated })
                                  }
                                  return next
                                })
                              }}
                            >
                              {m}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setColumnFilters([])}
                    >
                      <FunnelX className="mr-2 h-4 w-4" />
                      {t('filters.clear')}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="h-[500px]">
                <MapClient
                  repeaters={filtered}
                  onSelectRepeater={(repeater) => {
                    setSelected(repeater)
                    setOpen(true)
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        {open && (
          <>
            <DrawerOverlay onClick={() => setOpen(false)} />
            <DrawerContent>
              <VisuallyHidden>
                <DrawerTitle>
                  {selected ? `${t('repeater.details')} - ${selected.callsign}` : t('repeater.details')}
                </DrawerTitle>
              </VisuallyHidden>
              <div className="p-4">
                {selected && <RepeaterDetails r={selected} />}
              </div>
              <DrawerFooter>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setOpen(false)}
                >
                  {t('repeater.close')}
                </button>
              </DrawerFooter>
            </DrawerContent>
          </>
        )}
      </Drawer>
    </>
  )
}
