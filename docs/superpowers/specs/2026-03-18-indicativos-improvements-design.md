# /indicativos Page Improvements — Design Spec

## Summary

Six improvements to the /indicativos page across two workstreams: data exploration (B) and UX polish (C). Each item is independent and shippable on its own.

## Priority Order

1. URL-synced filters
2. Concelho faceted filter
3. Field-specific search
4. Choropleth map tab
5. Red flag explainer
6. Error & empty states

---

## 1. URL-Synced Filters

### Problem
All filter state (search, distrito, categoria, estado, active tab, page) lives in React state only. Switching tabs, navigating away, or sharing a link loses the current view.

### Solution
Sync all filter state to URL query params via `useSearchParams`.

### URL Structure
```
/indicativos?tab=indicativos&search=CT1&distrito=Lisboa,Porto&categoria=1&estado=Ativo&page=2
/indicativos?tab=alteracoes&changeType=added
/indicativos?tab=tendencias&startDate=2025-01-01&endDate=2025-12-31
/indicativos?tab=mapa
```

### Params
| Param | Type | Default | Tab |
|-------|------|---------|-----|
| `tab` | `indicativos\|alteracoes\|tendencias\|mapa` | `indicativos` | all |
| `search` | string | `""` | indicativos, tendencias |
| `distrito` | comma-separated | `""` | indicativos, tendencias |
| `categoria` | comma-separated | `""` | indicativos, tendencias |
| `estado` | comma-separated | `""` | indicativos, tendencias |
| `concelho` | comma-separated | `""` | indicativos |
| `searchField` | `todos\|indicativo\|nome\|localidade` | `todos` | indicativos |
| `page` | number | `1` | indicativos |
| `changeType` | `added\|removed\|modified` | `""` | alteracoes |
| `startDate` | `YYYY-MM-DD` | `""` | tendencias |
| `endDate` | `YYYY-MM-DD` | `""` | tendencias |

### Behavior
- On mount: read URL params → initialize state
- On filter change: update state + `router.replace()` with new params (no history entry per keystroke)
- Search input: debounce 300ms before URL update (same as current debounce)
- Browser back/forward: navigates filter history
- Invalid/unknown params: silently ignored, defaults used
- **URL-comparison guard**: Before calling `router.replace()`, compare the computed URL to the current URL — only update if they differ. This prevents infinite re-render loops (state → URL → re-render → state). Follow the existing pattern in `src/components/events/hooks/useFilterState.ts`.
- **Tab validation**: If the `tab` param value doesn't match an existing `TabsContent`, fall back to the default tab (`indicativos`). This avoids blank content if Item 4 (Mapa tab) is not yet implemented.

### Implementation notes
- **Suspense boundary required**: `useSearchParams()` in Next.js requires a `<Suspense>` boundary around the calling component, or the entire route devolves to client-side rendering. Wrap `<IndicativosContent />` in `<Suspense fallback={<Loading />}>` in `page.tsx`.
- **Controlled Tabs**: The current `<Tabs defaultValue="indicativos">` (uncontrolled) must switch to `<Tabs value={tab} onValueChange={setTab}>` (controlled) for bidirectional URL sync.
- **Indicativos vs Tendências filter independence**: The indicativos tab and tendências tab currently maintain independent filter states. Keep this separation — use the same URL param names but scoped per tab. The `useIndicativosFilters()` hook reads/writes params for the active tab only; TrendsCharts maintains its own internal state synced to `startDate`/`endDate` params.
- **Alterações tab pagination**: `ChangesFeed` uses append-based "load more", not page-based navigation. Exclude `page` from URL sync for this tab — it's not meaningful to land on `?tab=alteracoes&page=3` (the component always loads pages 1 through N). Only sync the `changeType` filter.

### Files to modify
- `src/app/indicativos/page.tsx` — wrap `<IndicativosContent />` in `<Suspense>` boundary
- `src/app/indicativos/IndicativosContent.tsx` — replace `useState` filter state with `useSearchParams`-backed state; switch Tabs to controlled mode
- Extract a `useIndicativosFilters()` hook for clean separation
- `src/app/indicativos/TrendsCharts.tsx` — sync `startDate`/`endDate` to URL; update `EMPTY_CALLSIGN_FILTERS` if `CallsignFilters` type grows

### Side effect
This also fixes the tab state loss issue (C1) — tab selection is persisted in the URL.

---

## 2. Concelho Faceted Filter

### Problem
Users can filter by distrito but not by concelho. The backend already supports `concelho` as a query param on `/api/indicativos/list`.

### Solution
Add a 4th `FacetedFilter` dropdown for concelho in the FilterBar, positioned after distrito.

### Behavior
- When no distrito is selected: show all concelhos (or disable the filter with a hint "Selecione um distrito primeiro")
- When distrito(s) selected: show only concelhos within those distritos
- Multi-select, same UX as existing filters
- URL param: `&concelho=Sintra,Cascais`

### Data source
Add a `/api/indicativos/concelhos?distrito=Lisboa,Porto` endpoint that returns distinct concelhos for the given distrito(s). Returns `{ docs: { concelho: string, count: number }[] }`.

### Async loading
The existing `FacetedFilter` component takes a static `options` array and has no loading support. Two changes needed:
- `FilterBar` fetches concelhos whenever the distrito selection changes (with a small debounce)
- Pass the fetched options array to `FacetedFilter`. While loading, pass an empty array and set the filter's `disabled` prop (or show a small spinner in the popover)
- **Cache strategy**: Cache the response per distrito combination. If the user adds a second distrito, fetch for the new combination (not incremental merge).
- When no distrito is selected: disable the concelho filter with placeholder text "Selecione um distrito primeiro"

### Files to modify
- `src/app/indicativos/FilterBar.tsx` — add 4th FacetedFilter with async loading logic
- `src/app/indicativos/FacetedFilter.tsx` — add optional `disabled` prop and loading state
- `src/lib/callsigns.ts` — add `fetchConcelhos()` function
- `src/app/indicativos/TrendsCharts.tsx` — update `EMPTY_CALLSIGN_FILTERS` if `CallsignFilters` type changes
- Backend: add `/api/indicativos/concelhos` endpoint (simple distinct query)

---

## 3. Field-Specific Search

### Problem
The single search bar searches across indicativo, nome, and localidade simultaneously. Users can't target a specific field.

### Solution
Add a dropdown prefix selector before the search input.

### Options
- **Todos** (default) — searches all fields, same as current behavior
- **Indicativo** — searches only the indicativo field
- **Nome** — searches only the nome field
- **Localidade** — searches only the localidade field

### URL param
`&searchField=nome` (omitted or `todos` for default behavior)

### Backend change
Add an optional `searchField` query param to `/api/indicativos/list`. When provided, restrict the `or` search clause to only that field. When omitted, search all fields (backwards compatible).

### UI
A compact `<Select>` component (shadcn) to the left of the search input, inside the same visual container. Approximately 100px wide with the field name visible.

**Mobile**: On screens below `sm` (640px), the Select stacks above the search input (full width) to avoid a cramped layout.

### Files to modify
- `src/app/indicativos/FilterBar.tsx` — add Select before search input
- `src/app/indicativos/IndicativosContent.tsx` — pass searchField to fetch
- `src/lib/callsigns.ts` — add `searchField` param to `fetchCallsigns()`
- Backend: update `/api/indicativos/list` handler to accept `searchField`

---

## 4. Choropleth Map Tab ("Mapa")

### Problem
No geographic view of callsign distribution. Users can't see density patterns across Portugal.

### Solution
Add a 4th tab "Mapa" with a choropleth map of Portugal colored by callsign density per distrito, alongside a sortable ranking table.

### Layout
- **Left (~60%)**: Leaflet map with GeoJSON distrito boundaries, colored by callsign count using the Ship Cove palette (lighter = fewer, darker = more)
- **Right (~40%)**: Sortable ranking table showing all distritos with columns: Distrito, Total, Activos, % Activos
- **Interaction**: Hover on map highlights corresponding table row and vice versa. Click a distrito opens a tooltip with breakdown by categoria.
- **Mobile**: Stack vertically — map on top (300px height), table below

### Data source
- **New endpoint**: `/api/indicativos/distrito-stats` — returns `{ distrito: string, total: number, active: number, byCategoria: Record<string, number> }[]`
- **GeoJSON**: Portugal distrito boundaries from CAOP (Carta Administrativa Oficial de Portugal, DGT). Simplify with mapshaper (`-simplify 5%`) to keep the file under 100KB. Output format: GeoJSON (not TopoJSON). Store as `public/geo/distritos.json`. The `public/geo/` directory does not exist yet — create it.

### Leaflet SSR safety
`DistritoMap.tsx` must be dynamically imported with `ssr: false` — Leaflet does not work in SSR. Follow the existing pattern:
```tsx
const DistritoMap = dynamic(() => import('@/components/indicativos/DistritoMap'), { ssr: false })
```
Also replicate the Leaflet default icon fix from `MapView.tsx` or extract it into a shared utility.

### Color scale
Ship Cove palette mapped to density quantiles:
- ship-cove-100 → lowest density
- ship-cove-300 → low-mid
- ship-cove-500 → mid
- ship-cove-700 → high
- ship-cove-900 → highest density

### Legend
Compact horizontal legend in the top-right corner of the map showing the color scale with min/max values.

### Files to create
- `src/components/indicativos/DistritoMap.tsx` — Leaflet choropleth component
- `src/components/indicativos/DistritoRanking.tsx` — sortable ranking table
- `public/geo/distritos.json` — GeoJSON boundaries (simplified CAOP data, <100KB)

### Files to modify
- `src/app/indicativos/IndicativosContent.tsx` — add 4th tab with dynamic import
- `src/lib/callsigns.ts` — add `fetchDistritoStats()`
- Backend: add `/api/indicativos/distrito-stats` endpoint

---

## 5. Red Flag Explainer

### Problem
The CategoryFlows component shows red-flagged entries (red left border + dot) but never explains what "flagged" means. Users see the visual emphasis but don't understand why.

### Solution
Add a small info section at the top of the CategoryFlows component.

### Content
A subtle alert/info box:
> **⚠ Movimentos sinalizados** — Entradas e saídas destacadas a vermelho indicam transições de categoria inesperadas (ex: saltar de Categoria 3 para Categoria 1 sem passar pela 2).

### Additionally
Add a tooltip on each flagged entry explaining the specific reason (e.g., "Esperado: Cat 3 → Cat 2, mas foi Cat 3 → Cat 1").

### Flag reason computation
The current `CategoryFlowLeaving`/`CategoryFlowEntering` types only have `flagged?: boolean` — no reason string. Compute the tooltip text client-side from the existing `reason` field and the category context:
- If an entry in Category 1 is flagged and `reason` is "Removido" → "Indicativo removido da Categoria 1"
- If an entry in Category 2 is flagged and `reason` is "Para Cat. 1" → this is expected (not flagged)
- If an entry in Category 3 is flagged and `reason` is "Para Cat. 1" → "Esperado: Cat 3 → Cat 2, mas foi Cat 3 → Cat 1"

No backend changes needed — the logic is derivable from existing data.

### Files to modify
- `src/app/indicativos/CategoryFlows.tsx` — add info box + per-entry tooltips with computed reason

---

## 6. Error & Empty States

### Problem
API failures or zero-result searches show either nothing or a generic message. No guidance on what to do.

### Solution
Add proper error boundaries and empty states to all async sections.

### Empty states
- **Table (no results)**: "Nenhum indicativo encontrado para os filtros selecionados." + "Limpar filtros" button
- **Changes feed (no changes)**: "Sem alterações registadas para o período selecionado."
- **Trends (no data)**: "Dados insuficientes para apresentar tendências."
- **Map (no data)**: "Não foi possível carregar os dados geográficos."

### Error states
Two distinct mechanisms:
1. **Fetch errors** (async/API failures): Use the existing `try/catch` pattern with error state (as in `CategoryFlows.tsx` lines 42-49). Each async section manages its own `error` state and renders an error card with retry button.
2. **Render errors** (unexpected crashes): Add `react-error-boundary` as a dependency. Wrap each tab's content in an `<ErrorBoundary>` with a fallback card showing "Erro inesperado. Tente recarregar a página." + reload button.

Log error details to console for debugging in both cases.

### Loading states
- Existing skeleton loading is already in place for CallsignTable and StatsCards — verify coverage for ChangesFeed, TrendsCharts, and the new Map tab

### Files to modify
- `src/app/indicativos/CallsignTable.tsx` — empty state
- `src/app/indicativos/ChangesFeed.tsx` — empty state
- `src/app/indicativos/TrendsCharts.tsx` — empty state
- `src/app/indicativos/CategoryFlows.tsx` — empty state
- `src/app/indicativos/IndicativosContent.tsx` — error boundaries per tab

---

## Dependencies & Order

```
1. URL-synced filters  (no dependencies, highest impact)
     ↓
2. Concelho filter     (benefits from URL sync already in place)
     ↓
3. Field-specific search (benefits from URL sync + filter bar already extended)

4. Choropleth map tab  (independent, can start in parallel with 1-3)

5. Red flag explainer  (independent, small scope)
6. Error & empty states (independent, small scope)
```

Items 1-3 are sequential. Items 4, 5, 6 can be done in parallel at any point.

## Out of Scope

- Callsign detail view / profile page
- Data export (CSV/PDF)
- Push notifications for callsign changes
- Advanced regex/wildcard search
