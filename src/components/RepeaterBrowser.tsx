"use client"

import { getOwnerShort, useColumns, type Repeater } from "@/app/columns"
import LocationPickerDialog from "@/components/LocationPickerDialog"
import MapClient from "@/components/MapClient"
import RepeaterDetails from "@/components/RepeaterDetails"
import SearchAutocomplete from "@/components/SearchAutocomplete"
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
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { useUserLocation } from "@/contexts/UserLocationContext"
import { searchLocation, calculateDistance, reverseGeocode, formatAddress, type GeocodingResult } from "@/lib/geolocation"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"
import { ChevronDown, ChevronUp, Filter, FunnelX, Heart, Loader2, MapPin, RefreshCw, Search, X } from "lucide-react"
import { useTranslations } from 'next-intl'
import * as React from "react"

type Props = {
  data: Repeater[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  isLoading?: boolean
  initialRepeaterCallsign?: string | null
  onInitialRepeaterOpened?: () => void
  isRefreshing?: boolean
  onRefresh?: () => void
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
  isRefreshing = false,
  onRefresh,
}: Props) {
  const t = useTranslations()
  const { userLocation, isLocating, error: locationError, requestLocation, setLocation, clearLocation } = useUserLocation()
  const columns = useColumns({ userLocation })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Repeater | null>(null)
  const [distanceRadius, setDistanceRadius] = React.useState<number | null>(null) // km, null = no limit
  const [filtersExpanded, setFiltersExpanded] = React.useState(false) // Mobile filter visibility

  // Count active filters for badge display
  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (columnFilters.find((f) => f.id === "callsign")?.value) count++
    if (columnFilters.find((f) => f.id === "band")?.value) count++
    if (columnFilters.find((f) => f.id === "owner")?.value) count++
    if ((columnFilters.find((f) => f.id === "modulation")?.value as string[] | undefined)?.length) count++
    if (columnFilters.find((f) => f.id === "qth_locator")?.value) count++
    if (columnFilters.find((f) => f.id === "opStatus")?.value) count++
    if (distanceRadius !== null) count++
    return count
  }, [columnFilters, distanceRadius])

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

  const handleClearLocation = React.useCallback(() => {
    clearLocation()
    setLocationSearchQuery('')
  }, [clearLocation])

  // Location search state
  const [locationSearchQuery, setLocationSearchQuery] = React.useState('')
  const [locationSearchResults, setLocationSearchResults] = React.useState<GeocodingResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [showSearchResults, setShowSearchResults] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Reverse geocoded address for current user location
  const [userLocationAddress, setUserLocationAddress] = React.useState<string | null>(null)
  const [isLoadingAddress, setIsLoadingAddress] = React.useState(false)

  // Fetch address when user location changes
  React.useEffect(() => {
    if (!userLocation) {
      setUserLocationAddress(null)
      return
    }

    let cancelled = false
    setIsLoadingAddress(true)

    reverseGeocode(userLocation.latitude, userLocation.longitude).then((result) => {
      if (cancelled) return
      setIsLoadingAddress(false)
      if (result) {
        setUserLocationAddress(formatAddress(result))
      } else {
        setUserLocationAddress(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [userLocation])

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
    setLocation({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    })
    setLocationSearchQuery(result.display_name.split(',')[0]) // Show just the first part
    setShowSearchResults(false)
    setLocationSearchResults([])
  }, [setLocation])

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
    const opStatus = columnFilters.find((f) => f.id === "opStatus")?.value as
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
    if (opStatus) {
      result = result.filter((r) => r.status === opStatus)
    }
    // Distance filter - only if user location is set and radius is selected
    if (userLocation && distanceRadius !== null) {
      result = result.filter((r) => {
        const dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          r.latitude,
          r.longitude
        )
        return dist <= distanceRadius
      })
    }
    return result
  }, [data, columnFilters, userLocation, distanceRadius])

  return (
    <>
      <Card className="w-full max-w-7xl">
        <CardContent>
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <TabsList>
                <TabsTrigger value="table">{t('nav.table')}</TabsTrigger>
                <TabsTrigger value="map">{t('nav.map')}</TabsTrigger>
              </TabsList>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  title="Refresh repeaters"
                  className="h-9 w-9"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
            <TabsContent value="table">
              {/* Location controls - search and geolocation */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {/* Location search input - hidden when location is set */}
                {!userLocation && (
                  <>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={t('location.searchPlaceholder')}
                          value={locationSearchQuery}
                          onChange={(e) => setLocationSearchQuery(e.target.value)}
                          className="w-48 pl-8 pr-8"
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
                  </>
                )}

                {/* Geolocation button */}
                {!userLocation ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => requestLocation()}
                      disabled={isLocating}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {isLocating ? t('location.locating') : t('location.locateMe')}
                    </Button>
                    <LocationPickerDialog onLocationSelect={setLocation} />
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col">
                      {isLoadingAddress ? (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t('location.loadingAddress')}
                        </span>
                      ) : userLocationAddress ? (
                        <span className="text-sm font-medium">{userLocationAddress}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                        </span>
                      )}
                      {userLocation.isApproximate && (
                        <span className="text-xs text-muted-foreground">{t('location.approximate')}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearLocation}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">{t('location.clearLocation')}</span>
                    </Button>
                  </div>
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
                initialSorting={userLocation ? [{ id: 'distance', desc: false }] : undefined}
              />
            </TabsContent>
            <TabsContent value="map" className="h-[500px]">
              <div className="mb-4 space-y-4">
                {/* Mobile: Search + Filter toggle row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchAutocomplete
                      repeaters={data}
                      value={(columnFilters.find((f) => f.id === "callsign")?.value as string) ?? ""}
                      onChange={(v) => {
                        setColumnFilters((prev) => {
                          const next = prev.filter((f) => f.id !== "callsign")
                          if (v) next.push({ id: "callsign", value: v })
                          return next
                        })
                      }}
                      onSelect={(repeater) => {
                        setSelected(repeater)
                        setOpen(true)
                      }}
                      className="w-full"
                      placeholder={t('filters.callsign')}
                    />
                  </div>
                  {/* Mobile filter toggle button */}
                  <Button
                    variant={activeFilterCount > 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className="lg:hidden shrink-0"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    {t('filters.filter')}
                    {activeFilterCount > 0 && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                        {activeFilterCount}
                      </span>
                    )}
                    {filtersExpanded ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </Button>
                </div>

                {/* Filter grid - collapsible on mobile, always visible on desktop */}
                <div className={`space-y-4 ${filtersExpanded ? 'block' : 'hidden'} lg:block`}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <div className="space-y-2">
                      <Label>{t('filters.opStatus')}</Label>
                      <Select
                        value={(columnFilters.find((f) => f.id === "opStatus")?.value as string) ?? "all"}
                        onValueChange={(value) => {
                          setColumnFilters((prev) => {
                            const next = prev.filter((f) => f.id !== "opStatus")
                            if (value && value !== "all") next.push({ id: "opStatus", value })
                            return next
                          })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('filters.all')}</SelectItem>
                          <SelectItem value="active">{t('filters.opStatusActive')}</SelectItem>
                          <SelectItem value="maintenance">{t('filters.opStatusMaintenance')}</SelectItem>
                          <SelectItem value="offline">{t('filters.opStatusOffline')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Distance radius filter - only enabled when location is set */}
                    <div className="space-y-2">
                      <Label className={!userLocation ? "opacity-50" : ""}>
                        {t('filters.distance')}: {distanceRadius ? `${distanceRadius} km` : t('filters.distanceAll')}
                      </Label>
                      <Slider
                        disabled={!userLocation}
                        value={[distanceRadius ?? 0]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={([val]) => {
                          setDistanceRadius(val === 0 ? null : val)
                        }}
                        className={!userLocation ? "opacity-50" : ""}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('filters.distanceAll')}</span>
                        <span>100 km</span>
                      </div>
                    </div>
                    <div className="flex items-end sm:col-span-2 lg:col-span-1">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setColumnFilters([])
                          setDistanceRadius(null)
                        }}
                      >
                        <FunnelX className="mr-2 h-4 w-4" />
                        {t('filters.clear')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[500px]">
                <MapClient
                  repeaters={filtered}
                  onRepeaterClick={(repeater) => {
                    setSelected(repeater)
                    setOpen(true)
                  }}
                  userLocation={userLocation}
                  radiusKm={distanceRadius}
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
