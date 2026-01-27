"use client";

import { getOwnerShort, useColumns, type Repeater } from "@/app/columns";
import MapClient from "@/components/MapClient";
import RepeaterDetails from "@/components/RepeaterDetails";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerOverlay,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { calculateDistance } from "@/lib/geolocation";
import type { ColumnFiltersState } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Globe,
  Heart,
  Hexagon,
  LayoutGrid,
  Link2,
  MapIcon,
  MapPin,
  Radio,
  RefreshCw,
  Shield,
  Signal,
  Star,
  TableIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";
import { useRepeaters } from "./RepeatersProvider";
import ImportantNotice from "../notice";
import LocationTip from "@/components/LocationTip";
import RepeaterSubmitDialog from "@/components/RepeaterSubmitDialog";

type Props = {
  view: "table" | "map";
};

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm";
  if (mhz >= 144 && mhz <= 148) return "2m";
  if (mhz >= 50 && mhz <= 54) return "6m";
  if (mhz >= 1240 && mhz <= 1300) return "23cm";
  if (mhz >= 2300 && mhz <= 2450) return "13cm";
  return "Other";
}

// Mode colors - matches quick filter cards and ModesCell in columns.tsx
function getModeColors(mode: string): string {
  switch (mode.toUpperCase()) {
    case "FM":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700";
    case "DMR":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700";
    case "DSTAR":
    case "D-STAR":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700";
    case "C4FM":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700";
    case "TETRA":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700";
    case "ECHOLINK":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
    case "ALLSTAR":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700";
    case "DIGIPEATER":
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300 border-gray-300 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300 border-gray-300 dark:border-gray-700";
  }
}

// Helper to get primary frequency from repeater
function getPrimaryFrequency(r: Repeater) {
  if (!r.frequencies || r.frequencies.length === 0) return null;
  return r.frequencies.find(f => f.isPrimary) || r.frequencies[0];
}

function FilterChip({
  isActive,
  onClick,
  label,
  activeClass = "bg-primary text-primary-foreground shadow-sm border-primary"
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
        isActive
          ? activeClass
          : "bg-background hover:bg-muted text-muted-foreground border-border hover:border-muted-foreground/30"
      }`}
    >
      {label}
    </button>
  );
}

export default function RepeaterView({ view }: Props) {
  const t = useTranslations();
  const { repeaters: data, isRefreshing, fetchError, refreshRepeaters } = useRepeaters();
  const { userLocation } = useUserLocation();
  const columns = useColumns({ userLocation });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Repeater | null>(null);
  const [distanceRadius, setDistanceRadius] = React.useState<number | null>(null);
  const [filtersExpanded, setFiltersExpanded] = React.useState(false);

  // Count active filters for badge display
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (columnFilters.find((f) => f.id === "callsign")?.value) count++;
    if (columnFilters.find((f) => f.id === "band")?.value) count++;
    if (columnFilters.find((f) => f.id === "owner")?.value) count++;
    if (
      (columnFilters.find((f) => f.id === "modes")?.value as string[] | undefined)
        ?.length
    )
      count++;
    if (columnFilters.find((f) => f.id === "qthLocator")?.value) count++;
    if (columnFilters.find((f) => f.id === "opStatus")?.value) count++;
    if (distanceRadius !== null) count++;
    return count;
  }, [columnFilters, distanceRadius]);

  // Collect unique modes from all repeaters
  const modeOptions = React.useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => d.modes?.forEach((m) => set.add(m === 'DSTAR' ? 'D-STAR' : m)));
    return Array.from(set).sort();
  }, [data]);

  const filtered = React.useMemo(() => {
    let result = data;
    const callsign = columnFilters.find((f) => f.id === "callsign")?.value as
      | string
      | undefined;
    const band = columnFilters.find((f) => f.id === "band")?.value as string | undefined;
    const owner = columnFilters.find((f) => f.id === "owner")?.value as
      | string
      | undefined;
    const modes = columnFilters.find((f) => f.id === "modes")?.value as
      | string[]
      | undefined;
    const qth = columnFilters.find((f) => f.id === "qthLocator")?.value as
      | string
      | undefined;
    const opStatus = columnFilters.find((f) => f.id === "opStatus")?.value as
      | string
      | undefined;

    if (callsign && callsign.trim()) {
      const q = callsign.trim().toLowerCase();
      result = result.filter((r) => r.callsign.toLowerCase().includes(q));
    }
    if (band) {
      result = result.filter((r) => {
        const primary = getPrimaryFrequency(r);
        return primary ? getBandFromFrequency(primary.outputFrequency) === band : false;
      });
    }
    if (owner && owner.trim()) {
      const q = owner.trim().toLowerCase();
      result = result.filter((r) => {
        const ownerStr = r.owner ?? '';
        return ownerStr.toLowerCase().includes(q) || getOwnerShort(ownerStr).toLowerCase().includes(q);
      });
    }
    if (modes && modes.length > 0) {
      result = result.filter((r) =>
        modes.some((m) => {
          const normalizedFilter = m === "D-STAR" ? "DSTAR" : m;
          // EchoLink and AllStar are stored as separate fields, not in modes array
          if (m === "EchoLink") return r.echolink?.enabled === true;
          if (m === "AllStar") return r.allstarNode != null;
          return r.modes?.includes(normalizedFilter as typeof r.modes[number]);
        })
      );
    }
    if (qth && qth.trim()) {
      const q = qth.trim().toLowerCase();
      result = result.filter((r) => r.qthLocator?.toLowerCase().includes(q));
    }
    if (opStatus) {
      result = result.filter((r) => r.status === opStatus);
    }
    if (userLocation && distanceRadius !== null) {
      result = result.filter((r) => {
        const dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          r.latitude,
          r.longitude
        );
        return dist <= distanceRadius;
      });
    }
    return result;
  }, [data, columnFilters, userLocation, distanceRadius]);

  return (
    <>
      <LocationTip />
      <Card className="w-full max-w-7xl">
        <CardContent>
          {/* View toggle tabs */}
          <div className="flex items-center gap-2 mb-4">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <Link
                href="/repetidores"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  view === "table"
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/50"
                }`}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                {t("nav.table")}
              </Link>
              <Link
                href="/repetidores/mapa"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  view === "map"
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/50"
                }`}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                {t("nav.map")}
              </Link>
            </div>
          </div>

          {view === "table" && (
            <>

              {/* Mode Filter Presets - Hero Cards */}
              <div className="mb-6 rounded-xl border bg-gradient-to-br from-muted/30 via-background to-muted/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">{t('filters.quickFilters')}</h3>
                  {(columnFilters.find((f) => f.id === "modes")?.value as string[] | undefined)?.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        setColumnFilters((prev) => prev.filter((f) => f.id !== "modes"))
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                    >
                      <X className="h-3 w-3" />
                      {t('filters.clearModes')}
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-8 gap-2">
                  {(() => {
                    const currentModes = (columnFilters.find((f) => f.id === "modes")?.value as string[] | undefined) || []
                    const hasActiveFilter = currentModes.length > 0
                    return [
                      { mode: 'ALL', label: 'Todos', Icon: LayoutGrid, desc: 'Sem filtro', bg: 'bg-slate-50 dark:bg-slate-950/40', hoverBg: 'hover:bg-slate-100 dark:hover:bg-slate-900/50', border: 'border-slate-200 dark:border-slate-800', activeBorder: 'border-slate-500', text: 'text-slate-700 dark:text-slate-300', iconColor: 'text-slate-500', activeRing: 'ring-slate-500/30', dot: 'bg-slate-500' },
                      { mode: 'FM', label: 'FM', Icon: Radio, desc: 'Analógico', bg: 'bg-blue-50 dark:bg-blue-950/40', hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/50', border: 'border-blue-200 dark:border-blue-800', activeBorder: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300', iconColor: 'text-blue-500', activeRing: 'ring-blue-500/30', dot: 'bg-blue-500' },
                      { mode: 'DMR', label: 'DMR', Icon: Signal, desc: 'Digital', bg: 'bg-purple-50 dark:bg-purple-950/40', hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-900/50', border: 'border-purple-200 dark:border-purple-800', activeBorder: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300', iconColor: 'text-purple-500', activeRing: 'ring-purple-500/30', dot: 'bg-purple-500' },
                      { mode: 'DSTAR', label: 'D-STAR', Icon: Star, desc: 'Digital', bg: 'bg-cyan-50 dark:bg-cyan-950/40', hoverBg: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/50', border: 'border-cyan-200 dark:border-cyan-800', activeBorder: 'border-cyan-500', text: 'text-cyan-700 dark:text-cyan-300', iconColor: 'text-cyan-500', activeRing: 'ring-cyan-500/30', dot: 'bg-cyan-500' },
                      { mode: 'C4FM', label: 'C4FM', Icon: Hexagon, desc: 'Fusion', bg: 'bg-rose-50 dark:bg-rose-950/40', hoverBg: 'hover:bg-rose-100 dark:hover:bg-rose-900/50', border: 'border-rose-200 dark:border-rose-800', activeBorder: 'border-rose-500', text: 'text-rose-700 dark:text-rose-300', iconColor: 'text-rose-500', activeRing: 'ring-rose-500/30', dot: 'bg-rose-500' },
                      { mode: 'TETRA', label: 'TETRA', Icon: Shield, desc: 'Digital', bg: 'bg-amber-50 dark:bg-amber-950/40', hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-900/50', border: 'border-amber-200 dark:border-amber-800', activeBorder: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300', iconColor: 'text-amber-500', activeRing: 'ring-amber-500/30', dot: 'bg-amber-500' },
                      { mode: 'EchoLink', label: 'EchoLink', Icon: Globe, desc: 'VoIP', bg: 'bg-emerald-50 dark:bg-emerald-950/40', hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50', border: 'border-emerald-200 dark:border-emerald-800', activeBorder: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', iconColor: 'text-emerald-500', activeRing: 'ring-emerald-500/30', dot: 'bg-emerald-500' },
                      { mode: 'AllStar', label: 'AllStar', Icon: Link2, desc: 'Link', bg: 'bg-orange-50 dark:bg-orange-950/40', hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-900/50', border: 'border-orange-200 dark:border-orange-800', activeBorder: 'border-orange-500', text: 'text-orange-700 dark:text-orange-300', iconColor: 'text-orange-500', activeRing: 'ring-orange-500/30', dot: 'bg-orange-500' },
                    ].map(({ mode, label, Icon, desc, bg, hoverBg, border, activeBorder, text, iconColor, activeRing, dot }) => {
                      const displayMode = mode === 'DSTAR' ? 'D-STAR' : mode
                      // "ALL" is active when no mode filters are set
                      const isActive = mode === 'ALL' ? !hasActiveFilter : currentModes.includes(displayMode)
                      const isInactive = mode === 'ALL' ? false : (hasActiveFilter && !isActive)
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            // "ALL" clears all mode filters
                            if (mode === 'ALL') {
                              setColumnFilters((prev) => prev.filter((f) => f.id !== "modes"))
                              return
                            }
                            setColumnFilters((prev) => {
                              const next = prev.filter((f) => f.id !== "modes")
                              if (isActive) {
                                const updated = currentModes.filter((m) => m !== displayMode)
                                if (updated.length > 0) {
                                  next.push({ id: "modes", value: updated })
                                }
                              } else {
                                next.push({ id: "modes", value: [displayMode] })
                              }
                              return next
                            })
                          }}
                          className={`
                            group relative flex flex-col items-center justify-center p-3 rounded-lg border-2
                            transition-all duration-200 ease-out
                            ${bg} ${hoverBg}
                            ${isActive
                              ? `${activeBorder} shadow-md ring-2 ${activeRing} scale-[1.02]`
                              : `${border} hover:scale-[1.01]`
                            }
                            ${isInactive ? 'opacity-50 saturate-50 hover:opacity-75 hover:saturate-75' : ''}
                          `}
                        >
                        {/* Active indicator dot */}
                        {isActive && (
                          <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${dot} animate-pulse shadow-sm`} />
                        )}

                        {/* Icon */}
                        <Icon className={`h-6 w-6 mb-1 transition-transform duration-200 ${iconColor} ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />

                        {/* Label */}
                        <span className={`text-sm font-semibold tracking-tight ${text}`}>
                          {label}
                        </span>

                        {/* Description */}
                        <span className={`text-[10px] uppercase tracking-wider ${text} opacity-60`}>
                          {desc}
                        </span>
                        </button>
                      )
                    })
                  })()}
                </div>
              </div>

              <DataTable
                columns={columns}
                data={data}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                onRowClick={(row) => {
                  setSelected(row as Repeater);
                  setOpen(true);
                }}
                isLoading={false}
                leftActions={
                  <>
                    <Button
                      variant={
                        columnFilters.find((f) => f.id === "favorite")?.value
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setColumnFilters((prev) => {
                          const hasFavoriteFilter = prev.find((f) => f.id === "favorite");
                          if (hasFavoriteFilter) {
                            return prev.filter((f) => f.id !== "favorite");
                          }
                          return [...prev, { id: "favorite", value: true }];
                        });
                      }}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      {columnFilters.find((f) => f.id === "favorite")?.value
                        ? t("favorites.showAll")
                        : t("favorites.showOnly")}
                    </Button>
                    <RepeaterSubmitDialog repeaters={data} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshRepeaters}
                      disabled={isRefreshing}
                      title="Refresh repeaters"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </>
                }
              />
            </>
          )}

          {view === "map" && (
            <>
              <Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded} className="mb-4">
                {/* Header row - always visible */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Search input */}
                  <div className="flex-1 min-w-0">
                    <SearchAutocomplete
                      repeaters={data}
                      value={
                        (columnFilters.find((f) => f.id === "callsign")?.value as string) ??
                        ""
                      }
                      onChange={(v) => {
                        setColumnFilters((prev) => {
                          const next = prev.filter((f) => f.id !== "callsign");
                          if (v) next.push({ id: "callsign", value: v });
                          return next;
                        });
                      }}
                      onSelect={(repeater) => {
                        setSelected(repeater);
                        setOpen(true);
                      }}
                      className="w-full"
                      placeholder={t("filters.callsign")}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant={activeFilterCount > 0 ? "default" : "outline"}
                        className="h-10 gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("filters.filter")}</span>
                        {activeFilterCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-5 min-w-5 px-1.5 text-xs bg-background/20"
                          >
                            {activeFilterCount}
                          </Badge>
                        )}
                        {filtersExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={refreshRepeaters}
                      disabled={isRefreshing}
                      className="h-10 w-10"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>

                {/* Expanded filters panel */}
                <CollapsibleContent>
                  <div className="pt-4 space-y-4">
                    {/* Filter sections */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Band filter */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <Radio className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.band")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <FilterChip
                            isActive={!columnFilters.find((f) => f.id === "band")?.value}
                            onClick={() => {
                              setColumnFilters((prev) => prev.filter((f) => f.id !== "band"));
                            }}
                            label={t("filters.all")}
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "band")?.value === "2m"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "band");
                                next.push({ id: "band", value: "2m" });
                                return next;
                              });
                            }}
                            label={t("filters.2m")}
                            activeClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "band")?.value === "70cm"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "band");
                                next.push({ id: "band", value: "70cm" });
                                return next;
                              });
                            }}
                            label={t("filters.70cm")}
                            activeClass="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-300 dark:border-violet-700"
                          />
                        </div>
                      </div>

                      {/* Modes filter */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <Signal className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.modulation")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {modeOptions.map((m) => {
                            const selectedMods = (columnFilters.find((f) => f.id === "modes")?.value as string[] | undefined) || [];
                            const isActive = selectedMods.includes(m);
                            const colors = getModeColors(m);
                            return (
                              <FilterChip
                                key={m}
                                isActive={isActive}
                                onClick={() => {
                                  setColumnFilters((prev) => {
                                    const next = prev.filter((f) => f.id !== "modes");
                                    const current = (prev.find((f) => f.id === "modes")?.value as string[] | undefined) || [];
                                    const updated = isActive
                                      ? current.filter((v) => v !== m)
                                      : [...current, m];
                                    if (updated.length > 0) {
                                      next.push({ id: "modes", value: updated });
                                    }
                                    return next;
                                  });
                                }}
                                label={m}
                                activeClass={colors}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Status filter */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <Signal className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.opStatus")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <FilterChip
                            isActive={!columnFilters.find((f) => f.id === "opStatus")?.value}
                            onClick={() => {
                              setColumnFilters((prev) => prev.filter((f) => f.id !== "opStatus"));
                            }}
                            label={t("filters.all")}
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "opStatus")?.value === "active"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "opStatus");
                                next.push({ id: "opStatus", value: "active" });
                                return next;
                              });
                            }}
                            label={t("filters.opStatusActive")}
                            activeClass="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-700"
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "opStatus")?.value === "maintenance"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "opStatus");
                                next.push({ id: "opStatus", value: "maintenance" });
                                return next;
                              });
                            }}
                            label={t("filters.opStatusMaintenance")}
                            activeClass="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "opStatus")?.value === "offline"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "opStatus");
                                next.push({ id: "opStatus", value: "offline" });
                                return next;
                              });
                            }}
                            label={t("filters.opStatusOffline")}
                            activeClass="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advanced filters row */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Owner input */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <Filter className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.owner")}</span>
                        </div>
                        <Input
                          placeholder={t("filters.owner")}
                          value={(columnFilters.find((f) => f.id === "owner")?.value as string) ?? ""}
                          onChange={(event) => {
                            const v = event.target.value;
                            setColumnFilters((prev) => {
                              const next = prev.filter((f) => f.id !== "owner");
                              if (v) next.push({ id: "owner", value: v });
                              return next;
                            });
                          }}
                          className="h-9 bg-background"
                        />
                      </div>

                      {/* QTH input */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.qth")}</span>
                        </div>
                        <Input
                          placeholder={t("filters.qth")}
                          value={(columnFilters.find((f) => f.id === "qthLocator")?.value as string) ?? ""}
                          onChange={(event) => {
                            const v = event.target.value;
                            setColumnFilters((prev) => {
                              const next = prev.filter((f) => f.id !== "qthLocator");
                              if (v) next.push({ id: "qthLocator", value: v });
                              return next;
                            });
                          }}
                          className="h-9 bg-background"
                        />
                      </div>

                      {/* Distance slider */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {t("filters.distance")}: {distanceRadius ? `${distanceRadius} km` : t("filters.distanceAll")}
                          </span>
                        </div>
                        {userLocation ? (
                          <>
                            <Slider
                              value={[distanceRadius ?? 0]}
                              min={0}
                              max={100}
                              step={5}
                              onValueChange={([val]) => {
                                setDistanceRadius(val === 0 ? null : val);
                              }}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>{t("filters.distanceAll")}</span>
                              <span>100 km</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {t("locationTip.title")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer: results count and clear */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {filtered.length === 1
                            ? t("filters.resultsCountSingular")
                            : t("filters.resultsCount", { count: filtered.length })}
                        </span>

                        {activeFilterCount > 0 && (
                          <button
                            onClick={() => {
                              setColumnFilters([]);
                              setDistanceRadius(null);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                            {t("filters.clear")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="h-[500px]">
                <MapClient
                  repeaters={filtered}
                  onRepeaterClick={(repeater) => {
                    setSelected(repeater);
                    setOpen(true);
                  }}
                  userLocation={userLocation}
                  radiusKm={distanceRadius}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {fetchError && (
        <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
          {fetchError}
        </div>
      )}

      <ImportantNotice />

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        {open && (
          <>
            <DrawerOverlay onClick={() => setOpen(false)} />
            <DrawerContent>
              <VisuallyHidden>
                <DrawerTitle>
                  {selected
                    ? `${t("repeater.details")} - ${selected.callsign}`
                    : t("repeater.details")}
                </DrawerTitle>
              </VisuallyHidden>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {selected && <RepeaterDetails r={selected} />}
              </div>
              <DrawerFooter>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setOpen(false)}
                >
                  {t("repeater.close")}
                </button>
              </DrawerFooter>
            </DrawerContent>
          </>
        )}
      </Drawer>
    </>
  );
}
