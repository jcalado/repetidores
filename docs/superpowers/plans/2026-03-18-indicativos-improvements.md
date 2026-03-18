# /indicativos Page Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the /indicativos page with URL-synced filters, concelho filter, field-specific search, choropleth map, red flag explainer, and error/empty states.

**Architecture:** Six independent improvements applied incrementally. Items 1-3 are sequential (URL sync → concelho filter → field search). Items 4-6 are independent. Each task produces a working commit. The frontend is a Next.js 16 app with Tailwind 4, shadcn/ui, Leaflet, and Recharts. The backend is a Payload CMS app in a sibling directory.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui (New York), Radix UI, Leaflet, Recharts, TanStack Table, Payload CMS (backend)

**Spec:** `docs/superpowers/specs/2026-03-18-indicativos-improvements-design.md`

---

### Task 1: Create `useIndicativosFilters` hook with URL sync

**Files:**
- Create: `src/app/indicativos/hooks/useIndicativosFilters.ts`

This hook replaces the scattered `useState` calls in `IndicativosContent.tsx` with a single hook that reads/writes all filter state from URL query params. It follows the same pattern as `src/components/events/hooks/useFilterState.ts`.

- [ ] **Step 1: Create the hook file**

```ts
// src/app/indicativos/hooks/useIndicativosFilters.ts
"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import type { CallsignFilters } from "../FilterBar"

const VALID_TABS = ["indicativos", "alteracoes", "tendencias"] as const
type Tab = (typeof VALID_TABS)[number]

function isValidTab(value: string | null): value is Tab {
  return VALID_TABS.includes(value as Tab)
}

function parseCommaSeparated(value: string | null): string[] {
  if (!value) return []
  return value.split(",").filter(Boolean)
}

function toCommaSeparated(arr: string[]): string | undefined {
  return arr.length > 0 ? arr.join(",") : undefined
}

export interface IndicativosFilterState {
  tab: Tab
  filters: CallsignFilters
  page: number
  changeType: string
  startDate: string
  endDate: string
}

export function useIndicativosFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const [state, setStateInternal] = useState<IndicativosFilterState>(() => {
    const tabParam = searchParams.get("tab")
    return {
      tab: isValidTab(tabParam) ? tabParam : "indicativos",
      filters: {
        search: searchParams.get("search") || "",
        distrito: parseCommaSeparated(searchParams.get("distrito")),
        categoria: parseCommaSeparated(searchParams.get("categoria")),
        estado: parseCommaSeparated(searchParams.get("estado")),
      },
      page: Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1),
      changeType: searchParams.get("changeType") || "",
      startDate: searchParams.get("startDate") || "",
      endDate: searchParams.get("endDate") || "",
    }
  })

  // Sync state → URL (with URL-comparison guard to prevent loops)
  // Follows the same pattern as src/components/events/hooks/useFilterState.ts
  const lastUrlRef = useRef<string>("")
  useEffect(() => {
    const params = new URLSearchParams()
    if (state.tab !== "indicativos") params.set("tab", state.tab)
    if (state.filters.search) params.set("search", state.filters.search)
    const distrito = toCommaSeparated(state.filters.distrito)
    if (distrito) params.set("distrito", distrito)
    const categoria = toCommaSeparated(state.filters.categoria)
    if (categoria) params.set("categoria", categoria)
    const estado = toCommaSeparated(state.filters.estado)
    if (estado) params.set("estado", estado)
    if (state.page > 1) params.set("page", String(state.page))
    if (state.changeType) params.set("changeType", state.changeType)
    if (state.startDate) params.set("startDate", state.startDate)
    if (state.endDate) params.set("endDate", state.endDate)

    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname

    // Only update if URL actually changed (prevents infinite loops)
    if (newUrl !== lastUrlRef.current) {
      lastUrlRef.current = newUrl
      router.replace(newUrl, { scroll: false })
    }
  }, [state, pathname, router])

  const setTab = useCallback((tab: string) => {
    if (isValidTab(tab)) {
      setStateInternal((prev) => ({ ...prev, tab, page: 1 }))
    }
  }, [])

  const setFilters = useCallback((filters: CallsignFilters) => {
    setStateInternal((prev) => ({ ...prev, filters, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setStateInternal((prev) => ({ ...prev, page }))
  }, [])

  const setChangeType = useCallback((changeType: string) => {
    setStateInternal((prev) => ({ ...prev, changeType }))
  }, [])

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    setStateInternal((prev) => ({ ...prev, startDate, endDate }))
  }, [])

  return {
    ...state,
    setTab,
    setFilters,
    setPage,
    setChangeType,
    setDateRange,
  }
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /mnt/c/Users/jcalado/code/repetidores && npx tsc --noEmit src/app/indicativos/hooks/useIndicativosFilters.ts 2>&1 | head -20`

If there are import resolution issues with the tsconfig path aliases, just run `npx next lint` instead to check for syntax errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/indicativos/hooks/useIndicativosFilters.ts
git commit -m "feat(indicativos): add useIndicativosFilters hook with URL sync"
```

---

### Task 2: Wire hook into IndicativosContent and add Suspense boundary

**Files:**
- Modify: `src/app/indicativos/page.tsx`
- Modify: `src/app/indicativos/IndicativosContent.tsx`

Replace the `useState`-based filter/tab/page management with the new hook. Switch Tabs from uncontrolled to controlled. Add Suspense boundary in page.tsx.

- [ ] **Step 1: Update `page.tsx` to add Suspense boundary**

In `src/app/indicativos/page.tsx`, wrap `<IndicativosContent />` in `<Suspense>`:

```tsx
import { Suspense } from "react"
import { StandardPageHeader } from "@/components/ui/PageHeader"
import { IdCard, Users } from "lucide-react"
import { IndicativosContent } from "./IndicativosContent"
import { Loader2 } from "lucide-react"

// ... generateMetadata stays the same ...

export default function IndicativosPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <StandardPageHeader
        icon={<IdCard className="h-7 w-7" />}
        title="Indicativos"
        description="Directório de indicativos de radioamador em Portugal"
        floatingIcons={[
          <IdCard key="id" className="h-12 w-12 text-white" />,
          <Users key="users" className="h-10 w-10 text-white" />,
        ]}
      />

      <Suspense fallback={
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          A carregar...
        </div>
      }>
        <IndicativosContent />
      </Suspense>
    </main>
  )
}
```

- [ ] **Step 2: Rewrite `IndicativosContent.tsx` to use the hook**

Replace the `useState`-based state management with `useIndicativosFilters()`. Switch `<Tabs defaultValue=...>` to `<Tabs value={tab} onValueChange={setTab}>`.

Key changes in `src/app/indicativos/IndicativosContent.tsx`:
- Remove: `useState` for `filters`, `page`
- Add: `import { useIndicativosFilters } from "./hooks/useIndicativosFilters"`
- Replace `<Tabs defaultValue="indicativos">` with `<Tabs value={tab} onValueChange={setTab}>`
- Pass `changeType` and `setChangeType` to `ChangesFeed`
- Pass `startDate`, `endDate`, `setDateRange` to `TrendsCharts`

```tsx
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchCallsigns, fetchCallsignStats } from "@/lib/callsigns"
import type { Callsign, CallsignStats, PaginatedCallsignResponse } from "@/types/callsign"
import { useCallback, useEffect, useState } from "react"
import { StatsCards } from "./StatsCards"
import { FilterBar, type CallsignFilters } from "./FilterBar"
import { CallsignTable } from "./CallsignTable"
import { ChangesFeed } from "./ChangesFeed"
import { TrendsCharts } from "./TrendsCharts"
import { IdCard, History, TrendingUp } from "lucide-react"
import { useIndicativosFilters } from "./hooks/useIndicativosFilters"

const emptyStats: CallsignStats = {
  total: 0,
  byEstado: {},
  byCategoria: {},
  byDistrito: {},
  newThisMonth: 0,
  changesThisMonth: 0,
  lastSyncAt: null,
}

export function IndicativosContent() {
  const {
    tab, setTab,
    filters, setFilters,
    page, setPage,
    changeType, setChangeType,
    startDate, endDate, setDateRange,
  } = useIndicativosFilters()

  const [stats, setStats] = useState<CallsignStats>(emptyStats)
  const [statsLoading, setStatsLoading] = useState(true)
  const [data, setData] = useState<PaginatedCallsignResponse<Callsign> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCallsignStats()
      .then(setStats)
      .catch((err) => console.error("Failed to fetch stats:", err))
      .finally(() => setStatsLoading(false))
  }, [])

  const loadData = useCallback(async (p: number, f: CallsignFilters) => {
    setLoading(true)
    try {
      const result = await fetchCallsigns({
        page: p,
        limit: 50,
        search: f.search || undefined,
        distrito: f.distrito.length > 0 ? f.distrito.join(",") : undefined,
        categoria: f.categoria.length > 0 ? f.categoria.join(",") : undefined,
        estado: f.estado.length > 0 ? f.estado.join(",") : undefined,
      })
      setData(result)
    } catch (err) {
      console.error("Failed to fetch callsigns:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(page, filters)
  }, [filters, page, loadData])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div className="space-y-6 mt-6">
      <StatsCards stats={stats} loading={statsLoading} />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="indicativos" className="gap-2">
            <IdCard className="h-4 w-4" />
            Indicativos
          </TabsTrigger>
          <TabsTrigger value="alteracoes" className="gap-2">
            <History className="h-4 w-4" />
            Alterações
          </TabsTrigger>
          <TabsTrigger value="tendencias" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="indicativos" className="space-y-4">
          <FilterBar
            stats={stats}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <CallsignTable
            data={data?.docs || []}
            loading={loading}
            page={page}
            totalPages={data?.totalPages || 1}
            totalDocs={data?.totalDocs || 0}
            onPageChange={handlePageChange}
          />
        </TabsContent>

        <TabsContent value="alteracoes">
          <ChangesFeed
            changeType={changeType}
            onChangeTypeChange={setChangeType}
          />
        </TabsContent>

        <TabsContent value="tendencias">
          <TrendsCharts
            stats={stats}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={setDateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: Update `ChangesFeed.tsx` to accept external `changeType`**

In `src/app/indicativos/ChangesFeed.tsx`:
- Change the component to accept `changeType` and `onChangeTypeChange` props instead of internal `filter` state
- Keep internal `page`, `changes`, `loading`, `totalPages` state (these are append-based, not URL-synced)

Update the interface and component signature:

```tsx
interface ChangesFeedProps {
  changeType: string
  onChangeTypeChange: (type: string) => void
}

export function ChangesFeed({ changeType, onChangeTypeChange }: ChangesFeedProps) {
  const [changes, setChanges] = useState<CallsignChange[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Remove: const [filter, setFilter] = useState("")
  // Replace all references to `filter` with `changeType`
  // Replace `setFilter` with `onChangeTypeChange`

  const loadChanges = useCallback(async (p: number, ct: string) => {
    // ... same as before but using ct instead of changeType ...
  }, [])

  useEffect(() => {
    setPage(1)
    setChanges([]) // Clear on filter change
    loadChanges(1, changeType)
  }, [changeType, loadChanges])

  // ... filter buttons use onChangeTypeChange instead of setFilter ...
  // In the button: onClick={() => onChangeTypeChange(opt.value)}
  // Active check: filter === opt.value → changeType === opt.value
```

- [ ] **Step 4: Update `TrendsCharts.tsx` to accept external date range**

In `src/app/indicativos/TrendsCharts.tsx`:
- Add `startDate`, `endDate`, and `onDateRangeChange` props
- Replace internal `dateRange` state with the props
- Keep internal `filters` state for the trends-specific filter bar (independent from indicativos tab)

Update the interface:

```tsx
interface TrendsChartsProps {
  stats: CallsignStats
  startDate: string
  endDate: string
  onDateRangeChange: (startDate: string, endDate: string) => void
}
```

In the component:
- Remove: `const [dateRange, setDateRange] = useState<DateRange>({})`
- Use `{ startDate, endDate }` directly where `dateRange` was used
- Replace `setDateRange` calls with `onDateRangeChange`
- Update `handleClearAll` to call `onDateRangeChange("", "")`
- The `TrendsDateFilter` `value` prop becomes `{ startDate: startDate || undefined, endDate: endDate || undefined }` (convert empty strings to `undefined` so the DateFilter treats them as empty/unset, not as truthy values)
- The `onChange` prop becomes `(dr: DateRange) => onDateRangeChange(dr.startDate || "", dr.endDate || "")`
- The `hasDateFilter` check becomes `!!(startDate || endDate)` (using the string props directly)

- [ ] **Step 4b: Add searchInput sync to FilterBar for browser back/forward**

In `src/app/indicativos/FilterBar.tsx`, the local `searchInput` state is initialized once from `filters.search` on mount. When the user navigates via back/forward, `filters.search` will change via the URL hook but `searchInput` will be stale. Add a `useEffect` after the existing `searchInput` state to keep it in sync:

```tsx
// After: const [searchInput, setSearchInput] = useState(filters.search)
useEffect(() => {
  setSearchInput(filters.search)
}, [filters.search])
```

This ensures the search input value reflects the URL-sourced state on back/forward navigation.

- [ ] **Step 5: Verify the app builds**

Run: `cd /mnt/c/Users/jcalado/code/repetidores && npx next build 2>&1 | tail -30`

If build fails, fix type errors. Common issues:
- `TrendsDateFilter` expects `DateRange` type — ensure the adapter converts correctly
- `ChangesFeed` internal `filter` references need to all be replaced with `changeType`

- [ ] **Step 6: Manually test URL sync**

Run dev server: `cd /mnt/c/Users/jcalado/code/repetidores && npx next dev`

Test:
1. Navigate to `/indicativos` — should load with default tab
2. Click "Alterações" tab — URL should update to `?tab=alteracoes`
3. Click "Tendências" tab — URL should update to `?tab=tendencias`
4. On Indicativos tab, type "CT1" in search — URL should update with `?search=CT1` after 300ms debounce
5. Select a distrito filter — URL should update with `?distrito=Lisboa`
6. Navigate to `/indicativos?tab=alteracoes&changeType=added` directly — should load on Alterações tab with "Novos" filter active
7. Press browser back — should return to previous filter state

- [ ] **Step 7: Commit**

```bash
git add src/app/indicativos/page.tsx src/app/indicativos/IndicativosContent.tsx src/app/indicativos/ChangesFeed.tsx src/app/indicativos/TrendsCharts.tsx
git commit -m "feat(indicativos): wire URL-synced filters into all tabs"
```

---

### Task 3: Add concelho faceted filter

**Files:**
- Modify: `src/app/indicativos/FacetedFilter.tsx` — add `disabled` prop
- Modify: `src/app/indicativos/FilterBar.tsx` — add 4th filter + `CallsignFilters` type update
- Modify: `src/lib/callsigns.ts` — add `fetchConcelhos()`
- Modify: `src/app/indicativos/IndicativosContent.tsx` — pass `concelho` to fetch
- Modify: `src/app/indicativos/hooks/useIndicativosFilters.ts` — add `concelho` param
- Modify: `src/app/indicativos/TrendsCharts.tsx` — update `EMPTY_CALLSIGN_FILTERS` usage
- Modify: `/mnt/c/Users/jcalado/code/repetidores-backend/src/endpoints/callsigns.ts` — add concelhos endpoint

- [ ] **Step 1: Add backend `/api/indicativos/concelhos` endpoint**

In `/mnt/c/Users/jcalado/code/repetidores-backend/src/endpoints/callsigns.ts`, add a new handler function after the existing exports:

```ts
export async function listConcelhos(req: PayloadRequest) {
  const { payload } = req
  const url = new URL(req.url || '', 'http://localhost')
  const distrito = url.searchParams.get('distrito')

  const where: any = distrito
    ? { distrito: distrito.includes(',') ? { in: distrito.split(',') } : { equals: distrito } }
    : {}

  const concelhoCounts: Record<string, number> = {}
  let page = 1
  let hasMore = true

  while (hasMore) {
    const result = await payload.find({
      collection: 'callsigns',
      limit: 5000,
      page,
      where,
      depth: 0,
    })

    for (const doc of result.docs) {
      const c = (doc as any).concelho
      if (c) concelhoCounts[c] = (concelhoCounts[c] || 0) + 1
    }

    hasMore = result.hasNextPage
    page++
  }

  const docs = Object.entries(concelhoCounts)
    .map(([concelho, count]) => ({ concelho, count }))
    .sort((a, b) => a.concelho.localeCompare(b.concelho, 'pt'))

  return Response.json({ docs })
}
```

Register this endpoint in the Payload config (follow the pattern used for the other callsign endpoints — check how `listCallsigns` is registered).

- [ ] **Step 2: Add `fetchConcelhos()` to `src/lib/callsigns.ts`**

```ts
export async function fetchConcelhos(distrito?: string): Promise<{ concelho: string; count: number }[]> {
  const base = getApiBaseUrl()
  const params = new URLSearchParams()
  if (distrito) params.set('distrito', distrito)
  const qs = params.toString()
  const url = `${base}/api/indicativos/concelhos${qs ? `?${qs}` : ''}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Failed to fetch concelhos: ${res.status}`)
  const data = await res.json()
  return data.docs
}
```

- [ ] **Step 3: Add `disabled` prop to `FacetedFilter`**

In `src/app/indicativos/FacetedFilter.tsx`, add an optional `disabled` prop to the interface:

```ts
interface FacetedFilterProps {
  icon?: React.ReactNode
  title: string
  options: FacetedFilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
  disabledHint?: string
}
```

In the component, pass `disabled` to the trigger button and show the hint when disabled:

```tsx
export function FacetedFilter({ icon, title, options, selected, onChange, disabled, disabledHint }: FacetedFilterProps) {
```

On the trigger `<button>`:
- Add `disabled={disabled}` attribute
- Add `disabled:opacity-50 disabled:cursor-not-allowed` to className

When `disabled && disabledHint`, render a tooltip or title attribute: `title={disabled ? disabledHint : undefined}`

- [ ] **Step 4: Update `CallsignFilters` type and `FilterBar`**

In `src/app/indicativos/FilterBar.tsx`:

Add `concelho` to the `CallsignFilters` interface:

```ts
export interface CallsignFilters {
  search: string
  distrito: string[]
  categoria: string[]
  estado: string[]
  concelho: string[]
}

export const EMPTY_CALLSIGN_FILTERS: CallsignFilters = {
  search: "",
  distrito: [],
  categoria: [],
  estado: [],
  concelho: [],
}
```

Add the 4th FacetedFilter in the FilterBar JSX, after the Estado filter. It requires fetching concelhos based on the selected distritos:

```tsx
import { fetchConcelhos } from "@/lib/callsigns"
import { Building2 } from "lucide-react"

// Inside FilterBar component (useState is already imported):
const [concelhoOptions, setConcelhoOptions] = useState<{ value: string; label: string; count?: number }[]>([])
const [concelhoLoading, setConcelhoLoading] = useState(false)

useEffect(() => {
  if (filters.distrito.length === 0) {
    setConcelhoOptions([])
    return
  }
  setConcelhoLoading(true)
  fetchConcelhos(filters.distrito.join(","))
    .then((docs) => setConcelhoOptions(docs.map((d) => ({ value: d.concelho, label: d.concelho, count: d.count }))))
    .catch(() => setConcelhoOptions([]))
    .finally(() => setConcelhoLoading(false))
}, [filters.distrito])

// In JSX, after the Estado FacetedFilter:
<FacetedFilter
  icon={<Building2 />}
  title="Concelho"
  options={concelhoOptions}
  selected={filters.concelho}
  onChange={(v) => onFiltersChange({ ...filters, concelho: v })}
  disabled={filters.distrito.length === 0}
  disabledHint="Selecione um distrito primeiro"
/>
```

Also add concelho chips in the `activeChips` section:

```ts
for (const co of filters.concelho) {
  activeChips.push({
    key: `co-${co}`,
    label: co,
    onRemove: () => onFiltersChange({ ...filters, concelho: filters.concelho.filter((v) => v !== co) }),
  })
}
```

Update `hasActiveFilters` to include `filters.concelho.length > 0`.

Update `clearFilters` — `EMPTY_CALLSIGN_FILTERS` already has `concelho: []`.

- [ ] **Step 5: Update `useIndicativosFilters` hook to handle `concelho`**

In `src/app/indicativos/hooks/useIndicativosFilters.ts`:

Add `concelho` to the `CallsignFilters` parsing in the init function:
```ts
filters: {
  // ... existing fields ...
  concelho: parseCommaSeparated(searchParams.get("concelho")),
},
```

Add `concelho` to the URL sync effect:
```ts
const concelho = toCommaSeparated(state.filters.concelho)
if (concelho) params.set("concelho", concelho)
```

- [ ] **Step 5b: Clear stale concelhos when distrito changes**

In `src/app/indicativos/FilterBar.tsx`, inside the `useEffect` that fetches concelhos when `filters.distrito` changes, also clear any currently-selected concelhos that are no longer valid:

```tsx
useEffect(() => {
  if (filters.distrito.length === 0) {
    setConcelhoOptions([])
    // Clear any selected concelhos since no distrito is selected
    if (filters.concelho.length > 0) {
      onFiltersChange({ ...filters, concelho: [] })
    }
    return
  }
  setConcelhoLoading(true)
  fetchConcelhos(filters.distrito.join(","))
    .then((docs) => {
      const validConcelhos = new Set(docs.map((d) => d.concelho))
      const filtered = filters.concelho.filter((c) => validConcelhos.has(c))
      setConcelhoOptions(docs.map((d) => ({ value: d.concelho, label: d.concelho, count: d.count })))
      // Remove any selected concelhos that are no longer valid for the new distrito selection
      if (filtered.length !== filters.concelho.length) {
        onFiltersChange({ ...filters, concelho: filtered })
      }
    })
    .catch(() => setConcelhoOptions([]))
    .finally(() => setConcelhoLoading(false))
}, [filters.distrito])
```

- [ ] **Step 6: Update `IndicativosContent.tsx` to pass `concelho` to fetch**

In the `loadData` callback, add `concelho`:
```ts
const result = await fetchCallsigns({
  // ... existing params ...
  concelho: f.concelho.length > 0 ? f.concelho.join(",") : undefined,
})
```

- [ ] **Step 7: Verify build and test**

Run: `cd /mnt/c/Users/jcalado/code/repetidores && npx next build 2>&1 | tail -30`

Manual test:
1. Load `/indicativos` — Concelho filter should be visible but disabled
2. Select "Lisboa" distrito — Concelho filter should enable and show Lisboa concelhos
3. Select a concelho — URL should update with `&concelho=Sintra`
4. Clear distrito — Concelho filter should disable and clear its selection

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(indicativos): add concelho faceted filter with async loading"
```

---

### Task 4: Add field-specific search

**Files:**
- Modify: `src/app/indicativos/FilterBar.tsx` — add Select before search input
- Modify: `src/app/indicativos/hooks/useIndicativosFilters.ts` — add `searchField` param
- Modify: `src/lib/callsigns.ts` — add `searchField` to `CallsignListParams`
- Modify: `src/app/indicativos/IndicativosContent.tsx` — pass `searchField` to fetch
- Modify: `/mnt/c/Users/jcalado/code/repetidores-backend/src/endpoints/callsigns.ts` — support `searchField`

- [ ] **Step 1: Update backend to support `searchField`**

In `/mnt/c/Users/jcalado/code/repetidores-backend/src/endpoints/callsigns.ts`, in the `listCallsigns` function, after `const search = params.get('search')` (line 105), add:

```ts
const searchField = params.get('searchField')
```

Replace the existing search clause (lines 123-131):

```ts
if (search) {
  if (searchField && ['indicativo', 'nome', 'localidade'].includes(searchField)) {
    where.and.push({ [searchField]: { like: search } })
  } else {
    where.and.push({
      or: [
        { indicativo: { like: search } },
        { nome: { like: search } },
        { localidade: { like: search } },
      ],
    })
  }
}
```

- [ ] **Step 2: Add `searchField` to `CallsignListParams` in `src/lib/callsigns.ts`**

```ts
export interface CallsignListParams {
  page?: number
  limit?: number
  distrito?: string
  categoria?: string
  estado?: string
  concelho?: string
  search?: string
  searchField?: string
}
```

In `fetchCallsigns`, add:
```ts
if (params.searchField) searchParams.set('searchField', params.searchField)
```

- [ ] **Step 3: Add `searchField` to `CallsignFilters` type**

In `src/app/indicativos/FilterBar.tsx`:

```ts
export interface CallsignFilters {
  search: string
  searchField: string  // "todos" | "indicativo" | "nome" | "localidade"
  distrito: string[]
  categoria: string[]
  estado: string[]
  concelho: string[]
}

export const EMPTY_CALLSIGN_FILTERS: CallsignFilters = {
  search: "",
  searchField: "todos",
  distrito: [],
  categoria: [],
  estado: [],
  concelho: [],
}
```

- [ ] **Step 4: Add Select component to FilterBar**

In `src/app/indicativos/FilterBar.tsx`, add the import:

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
```

Replace the search input `<div>` (lines 100-109) with:

```tsx
{/* Search with field selector */}
<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
  <Select
    value={filters.searchField}
    onValueChange={(v) => onFiltersChange({ ...filters, searchField: v })}
  >
    <SelectTrigger className="h-8 w-full sm:w-[110px] text-xs bg-white dark:bg-white/5 border-slate-200 dark:border-slate-700">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="todos">Todos</SelectItem>
      <SelectItem value="indicativo">Indicativo</SelectItem>
      <SelectItem value="nome">Nome</SelectItem>
      <SelectItem value="localidade">Localidade</SelectItem>
    </SelectContent>
  </Select>
  <div className="relative w-full sm:w-56">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
    <Input
      placeholder="Pesquisar..."
      value={searchInput}
      onChange={(e) => handleSearchChange(e.target.value)}
      className="pl-9 h-8 text-sm bg-white dark:bg-white/5 border-slate-200 dark:border-slate-700"
    />
  </div>
</div>
```

- [ ] **Step 5: Update hook and IndicativosContent**

In `src/app/indicativos/hooks/useIndicativosFilters.ts`:
- Add `searchField` to filters init: `searchField: searchParams.get("searchField") || "todos"`
- Add to URL sync: `if (state.filters.searchField && state.filters.searchField !== "todos") params.set("searchField", state.filters.searchField)`

In `src/app/indicativos/IndicativosContent.tsx`, update `loadData`:
```ts
const result = await fetchCallsigns({
  // ... existing params ...
  searchField: f.searchField !== "todos" ? f.searchField : undefined,
})
```

- [ ] **Step 6: Verify build and test**

Run: `cd /mnt/c/Users/jcalado/code/repetidores && npx next build 2>&1 | tail -30`

Test:
1. Load `/indicativos` — Select should show "Todos" by default
2. Type "Silva" with "Nome" selected — should search only in nome field
3. URL should show `?searchField=nome&search=Silva`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(indicativos): add field-specific search selector"
```

---

### Task 5: Add red flag explainer to CategoryFlows

**Files:**
- Modify: `src/app/indicativos/CategoryFlows.tsx`

- [ ] **Step 1: Add info box at the top of CategoryFlows**

In `src/app/indicativos/CategoryFlows.tsx`, add an import for the Alert component and Info icon:

```tsx
import { AlertTriangle, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
```

Add a helper function to compute the flag reason from category and reason:

```tsx
function getFlagReason(category: string, reason: string): string {
  if (reason === "removed") return "Indicativo removido da categoria"
  if (reason.startsWith("to_")) {
    const targetCat = reason.slice(3)
    // Expected upgrade path: 3→2→1
    const expectedNext: Record<string, string> = { "3": "2", "2": "1" }
    const expected = expectedNext[category]
    if (expected && targetCat !== expected) {
      return `Esperado: Cat ${category} → Cat ${expected}, mas foi Cat ${category} → Cat ${targetCat}`
    }
    return `Transição inesperada de Cat ${category} para Cat ${targetCat}`
  }
  return "Movimento sinalizado"
}
```

After the month selector `<div>` and before the loading state, add:

```tsx
{/* Red flag explanation */}
<div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
  <p>
    <span className="font-semibold">Movimentos sinalizados</span> — Entradas e saídas destacadas a vermelho indicam transições de categoria inesperadas (ex: saltar de Categoria 3 para Categoria 1 sem passar pela 2).
  </p>
</div>
```

- [ ] **Step 2: Add tooltips to flagged entries**

Wrap the leaving entries section with `<TooltipProvider>`. For each flagged entry, wrap it in a `<Tooltip>`:

Replace the flagged entry rendering (the `leaving.map(...)` block, lines 167-185) with:

```tsx
<TooltipProvider delayDuration={200}>
  {leaving.map((entry) => (
    <div
      key={entry.indicativo}
      className={`text-xs ${
        entry.flagged
          ? "bg-red-50 dark:bg-red-950/30 border-l-2 border-red-400 pl-1.5"
          : ""
      }`}
    >
      {entry.flagged ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 mr-1 align-middle" />
                {entry.indicativo}
              </span>
              <span className="ml-1 text-slate-400 dark:text-slate-500">
                {formatReason(entry.reason)}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-xs">
            {getFlagReason(cat, entry.reason)}
          </TooltipContent>
        </Tooltip>
      ) : (
        <>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {entry.indicativo}
          </span>
          <span className="ml-1 text-slate-400 dark:text-slate-500">
            {formatReason(entry.reason)}
          </span>
        </>
      )}
    </div>
  ))}
</TooltipProvider>
```

- [ ] **Step 3: Verify build**

Run: `cd /mnt/c/Users/jcalado/code/repetidores && npx next build 2>&1 | tail -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/indicativos/CategoryFlows.tsx
git commit -m "feat(indicativos): add red flag explainer and per-entry tooltips"
```

---

### Task 6: Add error and empty states

**Depends on:** Task 2 (IndicativosContent uses hook-based state and prop-driven children)

**Files:**
- Modify: `src/app/indicativos/CallsignTable.tsx` — improve empty state
- Modify: `src/app/indicativos/ChangesFeed.tsx` — improve empty state message
- Modify: `src/app/indicativos/TrendsCharts.tsx` — verify empty state
- Modify: `src/app/indicativos/IndicativosContent.tsx` — add error boundaries
- Add dependency: `react-error-boundary`

- [ ] **Step 1: Install `react-error-boundary`**

```bash
cd /mnt/c/Users/jcalado/code/repetidores && bun add react-error-boundary
```

- [ ] **Step 2: Improve empty states across all components**

**ChangesFeed** (`src/app/indicativos/ChangesFeed.tsx`): Update the empty state message (line 166-168) from "Nenhuma alteração encontrada." to:

```tsx
<div className="text-center py-12 text-slate-400">
  Sem alterações registadas para o período selecionado.
</div>
```

**TrendsCharts** (`src/app/indicativos/TrendsCharts.tsx`): Already has a good empty state at lines 136-147. Verify it renders correctly. No changes needed.

**CategoryFlows** (`src/app/indicativos/CategoryFlows.tsx`): Already has an error state at lines 99-103. No changes needed.

- [ ] **Step 3: Improve CallsignTable empty state**

In `src/app/indicativos/CallsignTable.tsx`, the empty state (lines 94-99) currently shows "Nenhum indicativo encontrado." — update it to include a clear-filters action. Add an `onClearFilters` prop:

```tsx
interface CallsignTableProps {
  data: Callsign[]
  loading: boolean
  page: number
  totalPages: number
  totalDocs: number
  onPageChange: (page: number) => void
  onClearFilters?: () => void
}
```

Replace the empty state row (lines 94-99):

```tsx
) : table.getRowModel().rows.length === 0 ? (
  <TableRow>
    <TableCell colSpan={callsignColumns.length} className="text-center py-12">
      <div className="text-slate-400">
        Nenhum indicativo encontrado para os filtros selecionados.
      </div>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-2 text-sm text-ship-cove-600 dark:text-ship-cove-400 hover:underline"
        >
          Limpar filtros
        </button>
      )}
    </TableCell>
  </TableRow>
```

- [ ] **Step 4: Add error boundaries to `IndicativosContent`**

In `src/app/indicativos/IndicativosContent.tsx`, import `ErrorBoundary`:

```tsx
import { ErrorBoundary } from "react-error-boundary"
```

Create a fallback component:

```tsx
function TabErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 text-center">
      <p className="text-sm text-red-600 dark:text-red-400">
        Erro inesperado. Tente recarregar a página.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="mt-3 text-sm text-ship-cove-600 dark:text-ship-cove-400 hover:underline"
      >
        Tentar novamente
      </button>
    </div>
  )
}
```

Wrap each `<TabsContent>` body with `<ErrorBoundary>`:

```tsx
<TabsContent value="indicativos" className="space-y-4">
  <ErrorBoundary FallbackComponent={TabErrorFallback}>
    <FilterBar ... />
    <CallsignTable ... onClearFilters={() => setFilters(EMPTY_CALLSIGN_FILTERS)} />
  </ErrorBoundary>
</TabsContent>

<TabsContent value="alteracoes">
  <ErrorBoundary FallbackComponent={TabErrorFallback}>
    <ChangesFeed ... />
  </ErrorBoundary>
</TabsContent>

<TabsContent value="tendencias">
  <ErrorBoundary FallbackComponent={TabErrorFallback}>
    <TrendsCharts ... />
  </ErrorBoundary>
</TabsContent>
```

Also import `EMPTY_CALLSIGN_FILTERS` from `FilterBar`:

```tsx
import { FilterBar, type CallsignFilters, EMPTY_CALLSIGN_FILTERS } from "./FilterBar"
```

- [ ] **Step 5: Verify build**

Run: `cd /mnt/c/Users/jcalado/code/repetidores && npx next build 2>&1 | tail -20`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(indicativos): add error boundaries and improved empty states"
```

---

### Task 7: Add choropleth map tab (backend + data)

**Files:**
- Modify: `/mnt/c/Users/jcalado/code/repetidores-backend/src/endpoints/callsigns.ts` — add distrito-stats endpoint
- Create: `public/geo/distritos.json` — simplified GeoJSON
- Modify: `src/lib/callsigns.ts` — add `fetchDistritoStats()`
- Create: `src/types/distrito-stats.ts` — type definition

- [ ] **Step 1: Add backend `/api/indicativos/distrito-stats` endpoint**

In `/mnt/c/Users/jcalado/code/repetidores-backend/src/endpoints/callsigns.ts`, add:

```ts
export async function getDistritoStats(req: PayloadRequest) {
  const { payload } = req

  const stats: Record<string, { total: number; active: number; byCategoria: Record<string, number> }> = {}

  let page = 1
  let hasMore = true

  while (hasMore) {
    const result = await payload.find({
      collection: 'callsigns',
      limit: 5000,
      page,
      depth: 0,
    })

    for (const doc of result.docs) {
      const d = doc as any
      if (!d.distrito) continue
      if (!stats[d.distrito]) stats[d.distrito] = { total: 0, active: 0, byCategoria: {} }
      stats[d.distrito].total++
      if (d.estado?.toLowerCase().includes('ativ')) stats[d.distrito].active++
      if (d.categoria) {
        stats[d.distrito].byCategoria[d.categoria] = (stats[d.distrito].byCategoria[d.categoria] || 0) + 1
      }
    }

    hasMore = result.hasNextPage
    page++
  }

  const docs = Object.entries(stats)
    .map(([distrito, data]) => ({ distrito, ...data }))
    .sort((a, b) => b.total - a.total)

  return Response.json({ docs })
}
```

Register the endpoint in the Payload config alongside the other callsign endpoints.

- [ ] **Step 2: Add type and fetch function**

Create `src/types/distrito-stats.ts`:

```ts
export interface DistritoStats {
  distrito: string
  total: number
  active: number
  byCategoria: Record<string, number>
}
```

In `src/lib/callsigns.ts`, add:

```ts
import type { DistritoStats } from '@/types/distrito-stats'

export async function fetchDistritoStats(): Promise<DistritoStats[]> {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/indicativos/distrito-stats`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Failed to fetch distrito stats: ${res.status}`)
  const data = await res.json()
  return data.docs
}
```

- [ ] **Step 3: Obtain and add GeoJSON file**

Get Portugal distrito boundaries from GADM (Global Administrative Areas). This is the most reliable open source:

```bash
mkdir -p public/geo

# Download GADM level-1 (distritos) for Portugal
curl -L "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_PRT_1.json" -o /tmp/gadm41_PRT_1.json

# Install mapshaper for simplification
npx mapshaper /tmp/gadm41_PRT_1.json \
  -simplify 5% keep-shapes \
  -rename-fields distrito=NAME_1 \
  -filter-fields distrito \
  -o public/geo/distritos.json format=geojson

# Verify file size (should be <100KB)
ls -lh public/geo/distritos.json

# Verify distrito names match ANACOM data
node -e "const g=require('./public/geo/distritos.json'); console.log(g.features.map(f=>f.properties.distrito).sort())"
```

The GADM dataset uses `NAME_1` for district names. The `-rename-fields` step maps it to `distrito` for consistent property access. Verify the names match the ANACOM distrito names in the database (e.g., "Lisboa", "Porto", "Faro"). Common mismatches:
- GADM may use "Região Autónoma dos Açores" / "Região Autónoma da Madeira" while ANACOM uses "Açores" / "Madeira"
- Fix mismatches with a simple find/replace in the JSON, or handle in `getDistritoName()` in the frontend

Alternative source if GADM is unavailable: CAOP from DGT (Direcção-Geral do Território) at `https://www.dgterritorio.gov.pt/cartografia/caop`.

- [ ] **Step 4: Commit backend + data**

```bash
# In backend repo:
cd /mnt/c/Users/jcalado/code/repetidores-backend
git add src/endpoints/callsigns.ts
git commit -m "feat: add distrito-stats endpoint"

# In frontend repo:
cd /mnt/c/Users/jcalado/code/repetidores
git add public/geo/distritos.json src/types/distrito-stats.ts src/lib/callsigns.ts
git commit -m "feat(indicativos): add distrito stats type, fetch, and GeoJSON data"
```

---

### Task 8: Add choropleth map tab (frontend components)

**Depends on:** Task 7 (backend + GeoJSON data), Task 6 (ErrorBoundary and `TabErrorFallback` component)

**Files:**
- Create: `src/components/indicativos/DistritoMap.tsx` — Leaflet choropleth
- Create: `src/components/indicativos/DistritoRanking.tsx` — sortable ranking table
- Modify: `src/app/indicativos/IndicativosContent.tsx` — add 4th tab
- Modify: `src/app/indicativos/hooks/useIndicativosFilters.ts` — add "mapa" to valid tabs

- [ ] **Step 0: Install @types/geojson if needed**

```bash
cd /mnt/c/Users/jcalado/code/repetidores && bun add -D @types/geojson
```

This provides the `Feature` and `FeatureCollection` types used by `DistritoMap.tsx`.

- [ ] **Step 1: Update hook to accept "mapa" tab**

In `src/app/indicativos/hooks/useIndicativosFilters.ts`, update:

```ts
const VALID_TABS = ["indicativos", "alteracoes", "tendencias", "mapa"] as const
```

- [ ] **Step 2: Create `DistritoRanking.tsx`**

```tsx
// src/components/indicativos/DistritoRanking.tsx
"use client"

import type { DistritoStats } from "@/types/distrito-stats"
import { useState } from "react"
import { ArrowUpDown } from "lucide-react"

type SortKey = "distrito" | "total" | "active" | "pct"
type SortDir = "asc" | "desc"

interface DistritoRankingProps {
  data: DistritoStats[]
  highlightedDistrito: string | null
  onHover: (distrito: string | null) => void
}

export function DistritoRanking({ data, highlightedDistrito, onHover }: DistritoRankingProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = [...data].sort((a, b) => {
    const pctA = a.total > 0 ? a.active / a.total : 0
    const pctB = b.total > 0 ? b.active / b.total : 0
    let cmp = 0
    switch (sortKey) {
      case "distrito": cmp = a.distrito.localeCompare(b.distrito, "pt"); break
      case "total": cmp = a.total - b.total; break
      case "active": cmp = a.active - b.active; break
      case "pct": cmp = pctA - pctB; break
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3 opacity-40" />
      {sortKey === field && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  )

  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="overflow-y-auto max-h-[500px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="text-left px-3 py-2"><SortHeader label="Distrito" field="distrito" /></th>
              <th className="text-right px-3 py-2"><SortHeader label="Total" field="total" /></th>
              <th className="text-right px-3 py-2"><SortHeader label="Activos" field="active" /></th>
              <th className="text-right px-3 py-2"><SortHeader label="%" field="pct" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.distrito}
                onMouseEnter={() => onHover(row.distrito)}
                onMouseLeave={() => onHover(null)}
                className={`border-t border-slate-50 dark:border-slate-800 transition-colors cursor-default ${
                  highlightedDistrito === row.distrito
                    ? "bg-ship-cove-50 dark:bg-ship-cove-950/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <td className="px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200">{row.distrito}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{row.total.toLocaleString("pt-PT")}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{row.active.toLocaleString("pt-PT")}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {row.total > 0 ? `${((row.active / row.total) * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `DistritoMap.tsx`**

```tsx
// src/components/indicativos/DistritoMap.tsx
"use client"

import { MapContainer, GeoJSON, useMap } from "react-leaflet"
import { useEffect, useRef, useState } from "react"
import type { DistritoStats } from "@/types/distrito-stats"
import type { Feature, FeatureCollection } from "geojson"
import type L from "leaflet"
import "leaflet/dist/leaflet.css"

// Ship Cove color scale for choropleth (5 quantile stops)
const COLOR_SCALE = [
  "#e7f0f8", // ship-cove-100
  "#b8cfe9", // ship-cove-300
  "#839bd1", // ship-cove-500
  "#5869aa", // ship-cove-700
  "#404c6f", // ship-cove-900
]

function getColor(value: number, breaks: number[]): string {
  for (let i = breaks.length - 1; i >= 0; i--) {
    if (value >= breaks[i]) return COLOR_SCALE[i]
  }
  return COLOR_SCALE[0]
}

function computeBreaks(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  if (n === 0) return [0, 0, 0, 0, 0]
  return [
    sorted[0],
    sorted[Math.floor(n * 0.25)] || 0,
    sorted[Math.floor(n * 0.5)] || 0,
    sorted[Math.floor(n * 0.75)] || 0,
    sorted[n - 1] || 0,
  ]
}

// Fit map to GeoJSON bounds
function FitBounds({ geojson }: { geojson: FeatureCollection }) {
  const map = useMap()
  useEffect(() => {
    import("leaflet").then((L) => {
      const layer = L.geoJSON(geojson)
      map.fitBounds(layer.getBounds(), { padding: [20, 20] })
    })
  }, [map, geojson])
  return null
}

interface DistritoMapProps {
  data: DistritoStats[]
  geojson: FeatureCollection
  highlightedDistrito: string | null
  onHover: (distrito: string | null) => void
}

export default function DistritoMap({ data, geojson, highlightedDistrito, onHover }: DistritoMapProps) {
  const statsMap = new Map(data.map((d) => [d.distrito, d]))
  const breaks = computeBreaks(data.map((d) => d.total))
  const geoJsonRef = useRef<L.GeoJSON | null>(null)

  // Match GeoJSON feature to distrito name — adapt property name as needed
  function getDistritoName(feature: Feature): string {
    const props = feature.properties || {}
    return props.distrito || props.Distrito || props.NAME_1 || props.name || ""
  }

  function style(feature: Feature | undefined) {
    if (!feature) return {}
    const name = getDistritoName(feature)
    const stats = statsMap.get(name)
    const value = stats?.total || 0
    const isHighlighted = highlightedDistrito === name
    return {
      fillColor: getColor(value, breaks),
      weight: isHighlighted ? 2 : 1,
      opacity: 1,
      color: isHighlighted ? "#5869aa" : "#94a3b8",
      fillOpacity: isHighlighted ? 0.9 : 0.7,
    }
  }

  function onEachFeature(feature: Feature, layer: L.Layer) {
    const name = getDistritoName(feature)
    const stats = statsMap.get(name)

    layer.on({
      mouseover: () => onHover(name),
      mouseout: () => onHover(null),
    })

    if (stats) {
      layer.bindTooltip(
        `<strong>${name}</strong><br/>Total: ${stats.total.toLocaleString("pt-PT")}<br/>Activos: ${stats.active.toLocaleString("pt-PT")}`,
        { sticky: true },
      )
    }
  }

  // Re-style when highlighted distrito changes
  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle((feature) => style(feature as Feature))
    }
  }, [highlightedDistrito])

  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
      <MapContainer
        center={[39.5, -8]}
        zoom={7}
        style={{ height: "500px", width: "100%" }}
        scrollWheelZoom={false}
        className="bg-slate-50 dark:bg-slate-900"
      >
        <FitBounds geojson={geojson} />
        <GeoJSON
          ref={geoJsonRef}
          data={geojson}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>

      {/* Legend */}
      <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
        <span>{breaks[0]?.toLocaleString("pt-PT")}</span>
        <div className="flex gap-0.5">
          {COLOR_SCALE.map((color, i) => (
            <div key={i} className="h-3 w-6 rounded-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span>{breaks[4]?.toLocaleString("pt-PT")}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add Mapa tab to `IndicativosContent.tsx`**

Add imports:

```tsx
import { Map as MapIcon } from "lucide-react"
import { fetchDistritoStats } from "@/lib/callsigns"
import type { DistritoStats } from "@/types/distrito-stats"
import dynamic from "next/dynamic"
import { DistritoRanking } from "@/components/indicativos/DistritoRanking"
import { Loader2 } from "lucide-react"

const DistritoMap = dynamic(() => import("@/components/indicativos/DistritoMap"), { ssr: false })
```

Add state for the map tab inside the component:

```tsx
const [distritoStats, setDistritoStats] = useState<DistritoStats[]>([])
const [distritoGeo, setDistritoGeo] = useState<any>(null)
const [mapLoading, setMapLoading] = useState(false)
const [highlightedDistrito, setHighlightedDistrito] = useState<string | null>(null)

// Load map data when mapa tab is first activated
useEffect(() => {
  if (tab !== "mapa" || distritoStats.length > 0) return
  setMapLoading(true)
  Promise.all([
    fetchDistritoStats(),
    fetch("/geo/distritos.json").then((r) => r.json()),
  ])
    .then(([stats, geo]) => {
      setDistritoStats(stats)
      setDistritoGeo(geo)
    })
    .catch((err) => console.error("Failed to load map data:", err))
    .finally(() => setMapLoading(false))
}, [tab, distritoStats.length])
```

Add the tab trigger and content:

```tsx
{/* In TabsList, after tendencias trigger: */}
<TabsTrigger value="mapa" className="gap-2">
  <MapIcon className="h-4 w-4" />
  Mapa
</TabsTrigger>

{/* After tendencias TabsContent: */}
<TabsContent value="mapa">
  <ErrorBoundary FallbackComponent={TabErrorFallback}>
    {mapLoading ? (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        A carregar mapa...
      </div>
    ) : distritoGeo ? (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <DistritoMap
            data={distritoStats}
            geojson={distritoGeo}
            highlightedDistrito={highlightedDistrito}
            onHover={setHighlightedDistrito}
          />
        </div>
        <div className="lg:col-span-2">
          <DistritoRanking
            data={distritoStats}
            highlightedDistrito={highlightedDistrito}
            onHover={setHighlightedDistrito}
          />
        </div>
      </div>
    ) : (
      <div className="text-center py-12 text-slate-400">
        Não foi possível carregar os dados geográficos.
      </div>
    )}
  </ErrorBoundary>
</TabsContent>
```

- [ ] **Step 5: Verify build**

Run: `cd /mnt/c/Users/jcalado/code/repetidores && npx next build 2>&1 | tail -30`

Common issues:
- Leaflet CSS may need to be imported in `DistritoMap.tsx` (already included above)
- GeoJSON property name for distrito may not match — check the actual JSON structure and update `getDistritoName()`

- [ ] **Step 6: Manual test**

1. Load `/indicativos?tab=mapa` — should show the choropleth map + ranking table
2. Hover a distrito on the map — corresponding table row should highlight
3. Hover a table row — corresponding map region should highlight
4. Check mobile — map should stack above table

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(indicativos): add choropleth map tab with distrito ranking"
```

---

## Summary

| Task | Description | Files | Depends on |
|------|-------------|-------|------------|
| 1 | `useIndicativosFilters` hook | 1 create | — |
| 2 | Wire hook + Suspense boundary | 4 modify | Task 1 |
| 3 | Concelho faceted filter | 7 modify | Task 2 |
| 4 | Field-specific search | 5 modify | Task 3 |
| 5 | Red flag explainer | 1 modify | — |
| 6 | Error & empty states | 4 modify, 1 dep | Task 2 |
| 7 | Choropleth (backend + data) | 3 create, 2 modify | — |
| 8 | Choropleth (frontend) | 2 create, 2 modify | Task 6, Task 7 |

Tasks 1→2→3→4 are sequential. Task 5 is independent. Task 6 depends on Task 2. Task 7 is independent. Task 8 depends on Task 6 + Task 7.
