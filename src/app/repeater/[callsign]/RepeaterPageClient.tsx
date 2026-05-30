"use client";

import { Repeater } from "@/app/columns";
import BearingCompass from "@/components/BearingCompass";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { useDeviceCompass } from "@/hooks/useDeviceCompass";
import { cn } from "@/lib/utils";
import { getAllAutoStatus, type RepeaterAutoStatus } from "@/lib/auto-status";
import {
  getBrandmeisterProfile,
  type BMProfileBySlot,
  type BMTalkgroupEntry,
} from "@/lib/brandmeister";
import { formatRelativeTime } from "@/lib/time";
import { toggleFavorite, isFavorite } from "@/lib/favorites";
import {
  ArrowLeft,
  Ban,
  Building2,
  Check,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  FileText,
  Heart,
  MapPin,
  Navigation,
  Radio,
  Share2,
  Wifi,
  Zap,
  Globe,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import * as React from "react";

import {
  getBandFromFrequency,
  fmtMHzDisplay,
  fmtMHzCopy,
  duplex,
} from "@/components/repeater/utils/formatters";
import { getPrimaryFrequency } from "@/types/repeater-helpers";
import { RepeaterHealthCard } from "@/components/repeater/RepeaterHealthCard";

const MiniMap = dynamic(() => import("./MiniMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 animate-pulse rounded-lg bg-muted" />
  ),
});

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Admin operational status → semantic dot + label. DESIGN.md §2 sanctions
// Success / Warning / Destructive as the only saturated colours beyond
// azulejo, and only for state signalling.
function statusDot(status?: string): {
  color: string;
  label: string;
} | null {
  switch (status) {
    case "active":
      return { color: "bg-[oklch(0.55_0.13_145)]", label: "Operacional" };
    case "maintenance":
      return { color: "bg-[oklch(0.72_0.13_75)]", label: "Em manutenção" };
    case "offline":
      return { color: "bg-destructive", label: "Offline" };
    case "unknown":
    default:
      return null;
  }
}

interface RepeaterPageClientProps {
  repeater: Repeater;
  allRepeaters: Repeater[];
}

export default function RepeaterPageClient({
  repeater: r,
  allRepeaters,
}: RepeaterPageClientProps) {
  const primary = getPrimaryFrequency(r);
  const band = primary ? getBandFromFrequency(primary.outputFrequency) : "unknown";
  const { sign, offsetDisplay, offsetCopy } = primary
    ? duplex(primary.outputFrequency, primary.inputFrequency)
    : { sign: "", offsetDisplay: "—", offsetCopy: "" };

  // Derived RF-meta surfaced near the frequency tiles.
  const isSimplex = r.nodeType === "simplex";
  const showCrossband = Boolean(r.isCrossband);
  const fmBandwidthLabel =
    r.modes?.includes("FM") && r.fmBandwidth
      ? r.fmBandwidth === "narrow"
        ? "NFM (12.5 kHz)"
        : "WFM (25 kHz)"
      : null;

  const allFreqPairs = r.frequencies ?? [];
  const primaryIdx = primary ? allFreqPairs.indexOf(primary) : -1;
  const secondaryPairs = allFreqPairs.filter((_, i) => i !== primaryIdx);
  const [favorite, setFavorite] = React.useState(() => isFavorite(r.callsign));
  const [autoStatus, setAutoStatus] = React.useState<RepeaterAutoStatus | null>(null);
  const [bmProfile, setBmProfile] = React.useState<BMProfileBySlot | null>(null);
  const [bmLoading, setBmLoading] = React.useState(false);

  React.useEffect(() => {
    getAllAutoStatus().then((data) => {
      const status = data[r.callsign];
      if (status) setAutoStatus(status);
    });
  }, [r.callsign]);

  React.useEffect(() => {
    if (!r.modes?.includes("DMR") || !r.dmr?.dmrId) return;
    setBmLoading(true);
    getBrandmeisterProfile(r.dmr.dmrId)
      .then((profile) => {
        if (profile) setBmProfile(profile);
      })
      .finally(() => setBmLoading(false));
  }, [r.modes, r.dmr?.dmrId]);

  const { userLocation, requestLocation, isLocating } = useUserLocation();
  const compass = useDeviceCompass();

  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    r.latitude + "," + r.longitude
  )}`;
  const osmUrl =
    typeof r.latitude === "number" && typeof r.longitude === "number"
      ? `https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}&zoom=14`
      : undefined;

  const t = useTranslations("repeater");
  const tNav = useTranslations("nav");

  const hasValidLocations = userLocation && r.latitude && r.longitude;

  const handleFavoriteToggle = () => {
    const newState = toggleFavorite(r.callsign);
    setFavorite(newState);
  };

  const nearbyRepeaters = React.useMemo(() => {
    if (!r.latitude || !r.longitude) return [];

    return allRepeaters
      .filter(
        (other) => other.callsign !== r.callsign && other.latitude && other.longitude
      )
      .map((other) => ({
        ...other,
        distance: calculateDistance(
          r.latitude,
          r.longitude,
          other.latitude,
          other.longitude
        ),
      }))
      .filter((other) => other.distance <= 50)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [allRepeaters, r.callsign, r.latitude, r.longitude]);

  const status = statusDot(r.status);
  const verifiedDate = r.lastVerified
    ? new Date(r.lastVerified).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const hasOwnerInfo = r.association || r.owner || r.website;
  const hasTechSpecs = r.power || r.antennaHeight || r.coverage || r.operatingHours;
  const hasDigitalModes =
    r.modes?.includes("DMR") ||
    r.modes?.includes("DSTAR") ||
    r.modes?.includes("C4FM") ||
    r.modes?.includes("TETRA") ||
    r.echolink?.enabled ||
    r.allstarNode;

  return (
    <>
      {/* Back link */}
      <Link
        href="/repetidores"
        className="group mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-azulejo-700 dark:hover:text-azulejo-300"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        {tNav("repeaters")}
      </Link>

      {/* Health bar (its own card; sibling, not nested) */}
      <div className="mb-4">
        <RepeaterHealthCard
          repeaterId={r.callsign}
          operationalStatus={r.status}
          lastVerified={r.lastVerified}
        />
      </div>

      <Card>
        <CardContent>
          {/* Header: icon + identity + chip strip + actions */}
          <header className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
              <Radio className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <h1 className="font-mono text-lg font-semibold tracking-tight text-foreground">
                  {r.callsign}
                </h1>
                {status && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={cn("size-2 shrink-0 rounded-full", status.color)}
                      aria-hidden="true"
                    />
                    {status.label}
                  </span>
                )}
              </div>

              {/* Chip strip — band + modes + locator + verified. Single voice. */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {band !== "unknown" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-azulejo-100 px-2.5 py-0.5 text-xs text-azulejo-700 dark:bg-azulejo-950/50 dark:text-azulejo-300">
                    {band}
                  </span>
                )}
                {r.modes?.map((mode) => (
                  <span
                    key={mode}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground"
                  >
                    {mode === "DSTAR" ? "D-STAR" : mode}
                  </span>
                ))}
                {r.qthLocator && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {r.qthLocator}
                  </span>
                )}
                {verifiedDate && (
                  <span className="inline-flex items-center gap-1 rounded-full px-1 py-0.5 text-[11px] text-muted-foreground">
                    Verificado <time className="font-mono tabular-nums">{verifiedDate}</time>
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1.5 self-start">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleFavoriteToggle}
                aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    favorite
                      ? "fill-azulejo-600 text-azulejo-600 dark:fill-azulejo-400 dark:text-azulejo-400"
                      : "text-muted-foreground"
                  )}
                />
              </Button>
              <ShareButton callsign={r.callsign} />
              {typeof r.latitude === "number" && typeof r.longitude === "number" && (
                <Button asChild variant="outline" size="sm">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4" />
                    {t("maps")}
                  </a>
                </Button>
              )}
            </div>
          </header>

          <Divider />

          {/* Frequencies + Location */}
          <div className="grid gap-6 pt-5 lg:grid-cols-3 lg:gap-8">
            <section className="lg:col-span-2 lg:border-r lg:border-border lg:pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <SectionLabel>Frequências</SectionLabel>
                {isSimplex && <MetaPill>Simplex</MetaPill>}
                {showCrossband && <MetaPill>Crossband</MetaPill>}
              </div>

              {isSimplex ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <FrequencyDisplay
                    label="Frequência"
                    value={primary ? fmtMHzDisplay(primary.outputFrequency) : "—"}
                    copyValue={
                      primary ? fmtMHzCopy(primary.outputFrequency) : undefined
                    }
                  />
                  <FrequencyDisplay
                    label={t("tone")}
                    value={
                      primary?.tone ? `${Number(primary.tone.toFixed(1))} Hz` : "—"
                    }
                    copyValue={
                      primary?.tone ? `${Number(primary.tone.toFixed(1))}` : undefined
                    }
                  />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <FrequencyDisplay
                    label={t("output")}
                    value={primary ? fmtMHzDisplay(primary.outputFrequency) : "—"}
                    copyValue={
                      primary ? fmtMHzCopy(primary.outputFrequency) : undefined
                    }
                  />
                  <FrequencyDisplay
                    label={t("input")}
                    value={primary ? fmtMHzDisplay(primary.inputFrequency) : "—"}
                    copyValue={
                      primary ? fmtMHzCopy(primary.inputFrequency) : undefined
                    }
                  />
                  <FrequencyDisplay
                    label={t("offset")}
                    value={`${sign}${sign ? " " : ""}${offsetDisplay}`}
                    copyValue={`${sign}${offsetCopy}`}
                  />
                  <FrequencyDisplay
                    label={t("tone")}
                    value={
                      primary?.tone ? `${Number(primary.tone.toFixed(1))} Hz` : "—"
                    }
                    copyValue={
                      primary?.tone ? `${Number(primary.tone.toFixed(1))}` : undefined
                    }
                  />
                </div>
              )}

              {fmBandwidthLabel && (
                <p className="mt-2 text-[12.5px] text-muted-foreground">
                  <span className="text-muted-foreground/70">Largura · </span>
                  <span className="font-mono text-foreground">{fmBandwidthLabel}</span>
                </p>
              )}

              {secondaryPairs.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <h3 className="mb-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
                    Outras frequências{" "}
                    <span className="ml-1 font-mono tabular-nums text-foreground/60">
                      {secondaryPairs.length}
                    </span>
                  </h3>
                  <ul className="divide-y divide-border border-t border-border">
                    {secondaryPairs.map((pair, idx) => {
                      const d = duplex(pair.outputFrequency, pair.inputFrequency);
                      const pairBand = getBandFromFrequency(pair.outputFrequency);
                      return (
                        <li
                          key={idx}
                          className="flex flex-wrap items-baseline gap-x-2.5 py-2 text-[12.5px] text-muted-foreground"
                        >
                          {pairBand !== "unknown" && (
                            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                              {pairBand}
                            </span>
                          )}
                          <span className="font-mono tabular-nums text-foreground">
                            {pair.outputFrequency.toFixed(3)}
                            <span className="text-muted-foreground/70"> MHz</span>
                          </span>
                          {d.sign && (
                            <span className="font-mono tabular-nums text-muted-foreground/60">
                              {d.sign}
                              {d.offsetCopy}
                            </span>
                          )}
                          {pair.tone ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {Number(pair.tone.toFixed(1))} Hz
                              </span>
                            </>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>

            <section>
              <SectionLabel>Localização</SectionLabel>
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <MiniMap
                  latitude={r.latitude}
                  longitude={r.longitude}
                  callsign={r.callsign}
                  userLatitude={userLocation?.latitude}
                  userLongitude={userLocation?.longitude}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-mono tabular-nums text-muted-foreground">
                  {r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)}
                </span>
                {osmUrl && (
                  <a
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-azulejo-600 transition-colors hover:text-azulejo-700 dark:text-azulejo-400 dark:hover:text-azulejo-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    OpenStreetMap
                  </a>
                )}
              </div>
            </section>
          </div>

          {/* Bearing compass */}
          {hasValidLocations ? (
            <Section title="Direção para o repetidor">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {compass.isEnabled
                      ? "Aponte o dispositivo para a direção indicada"
                      : "Baseado na sua localização atual"}
                  </p>
                  {compass.isSupported && (
                    <Button
                      variant={compass.isEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => compass.toggle()}
                    >
                      <Compass className="h-4 w-4" />
                      {compass.isEnabled ? "Desativar bússola" : "Ativar bússola"}
                    </Button>
                  )}
                  {compass.error && (
                    <p className="text-xs text-destructive">{compass.error}</p>
                  )}
                </div>
                <BearingCompass
                  userLat={userLocation.latitude}
                  userLon={userLocation.longitude}
                  targetLat={r.latitude}
                  targetLon={r.longitude}
                  size="lg"
                  deviceHeading={compass.heading}
                  isCompassActive={compass.isEnabled}
                />
              </div>
            </Section>
          ) : (
            r.latitude &&
            r.longitude && (
              <Section title="Direção para o repetidor">
                <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
                  <p className="text-sm text-muted-foreground">
                    Partilhe a sua localização para ver a direção a partir do seu QTH.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestLocation()}
                    disabled={isLocating}
                  >
                    <MapPin className="h-4 w-4" />
                    {isLocating ? "A localizar..." : "Obter localização"}
                  </Button>
                </div>
              </Section>
            )
          )}

          {/* Owner / Association */}
          {hasOwnerInfo && (
            <Section title="Proprietário">
              <ul className="divide-y divide-border">
                {(r.association || r.owner) && (
                  <li>
                    {r.association ? (
                      <Link
                        href={`/association/${r.association.slug}/`}
                        className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-azulejo-50/40 dark:hover:bg-azulejo-950/20"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                          <Building2
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-sm font-semibold text-foreground transition-colors group-hover:text-azulejo-700 dark:group-hover:text-azulejo-300">
                            {r.association.abbreviation}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.association.name}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 py-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                          <Building2
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="text-sm text-foreground">{r.owner}</div>
                      </div>
                    )}
                  </li>
                )}
                {r.website && (
                  <li>
                    <a
                      href={r.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-azulejo-50/40 dark:hover:bg-azulejo-950/20"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                        <Globe
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-azulejo-600 transition-colors group-hover:text-azulejo-700 dark:text-azulejo-400 dark:group-hover:text-azulejo-300">
                        {r.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </div>
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                )}
              </ul>
            </Section>
          )}

          {/* Technical specs */}
          {hasTechSpecs && (
            <Section title="Especificações técnicas" icon={Zap}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {r.power && <TechSpec label="Potência" value={`${r.power} W`} />}
                {r.antennaHeight && (
                  <TechSpec label="Altura da antena" value={`${r.antennaHeight} m AGL`} />
                )}
                {r.coverage && <TechSpec label="Cobertura" value={r.coverage} capitalize />}
                {r.operatingHours && (
                  <TechSpec label="Horário" value={r.operatingHours} />
                )}
              </div>
            </Section>
          )}

          {/* Digital modes + linking */}
          {hasDigitalModes && (
            <Section
              title="Modos digitais e linking"
              icon={Wifi}
              trailing={
                autoStatus && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]",
                      autoStatus.isOnline
                        ? "border-[oklch(0.55_0.13_145/0.3)] bg-[oklch(0.55_0.13_145/0.08)] text-[oklch(0.45_0.13_145)] dark:text-[oklch(0.75_0.13_145)]"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        autoStatus.isOnline ? "bg-[oklch(0.55_0.13_145)]" : "bg-destructive"
                      )}
                    />
                    {autoStatus.isOnline ? t("autoStatus.online") : t("autoStatus.offline")}
                  </span>
                )
              }
            >
              <div className="space-y-3">
                {r.modes?.includes("DMR") && (
                  <DMRBlock
                    repeater={r}
                    autoStatus={autoStatus}
                    bmProfile={bmProfile}
                    bmLoading={bmLoading}
                  />
                )}

                {r.modes?.includes("DSTAR") && (
                  <ModeBlock
                    label="D-STAR"
                    details={[
                      r.dstar?.module ? { label: "Módulo", value: r.dstar.module, mono: true } : null,
                      r.dstar?.reflector
                        ? { label: "Reflector", value: r.dstar.reflector, mono: true }
                        : null,
                      r.dstar?.gateway
                        ? { label: "Gateway", value: r.dstar.gateway, mono: true }
                        : null,
                    ].filter(Boolean) as { label: string; value: string; mono?: boolean }[]}
                  />
                )}

                {r.modes?.includes("C4FM") && (
                  <ModeBlock
                    label="C4FM"
                    details={[
                      r.c4fm?.network
                        ? { label: "Rede", value: r.c4fm.network.toUpperCase(), mono: true }
                        : null,
                      r.c4fm?.room ? { label: "Sala", value: r.c4fm.room } : null,
                      r.c4fm?.node ? { label: "Node", value: r.c4fm.node, mono: true } : null,
                    ].filter(Boolean) as { label: string; value: string; mono?: boolean }[]}
                  />
                )}

                {r.modes?.includes("TETRA") && r.tetra && (
                  <ModeBlock
                    label="TETRA"
                    details={[
                      r.tetra.talkgroups && r.tetra.talkgroups.length > 0
                        ? {
                            label: "Talkgroups",
                            value: r.tetra.talkgroups.join(", "),
                            mono: true,
                          }
                        : null,
                      r.tetra.network ? { label: "Rede", value: r.tetra.network } : null,
                    ].filter(Boolean) as { label: string; value: string; mono?: boolean }[]}
                  />
                )}

                {(r.echolink?.enabled || r.allstarNode) && (
                  <div className="flex flex-wrap gap-2">
                    {r.echolink?.enabled && r.echolink.nodeNumber && (() => {
                      const elSource = autoStatus?.sources.find(
                        (s) => s.source === "echolink"
                      );
                      return (
                        <a
                          href={`echolink://${r.echolink.nodeNumber}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-azulejo-300 hover:text-azulejo-700 dark:hover:border-azulejo-800/60 dark:hover:text-azulejo-300"
                        >
                          {elSource ? (
                            <span
                              className={cn(
                                "size-2 shrink-0 rounded-full",
                                elSource.isOnline
                                  ? "bg-[oklch(0.55_0.13_145)]"
                                  : "bg-destructive"
                              )}
                            />
                          ) : (
                            <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="font-mono text-sm">
                            EchoLink #{r.echolink.nodeNumber}
                          </span>
                          {r.echolink.conference && (
                            <span className="text-xs text-muted-foreground">
                              ({r.echolink.conference})
                            </span>
                          )}
                          {elSource?.lastSeen && (
                            <span className="text-xs text-muted-foreground">
                              · {formatRelativeTime(elSource.lastSeen)}
                            </span>
                          )}
                        </a>
                      );
                    })()}
                    {r.allstarNode && (() => {
                      const asSource = autoStatus?.sources.find(
                        (s) => s.source === "allstar"
                      );
                      return (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                          {asSource ? (
                            <span
                              className={cn(
                                "size-2 shrink-0 rounded-full",
                                asSource.isOnline
                                  ? "bg-[oklch(0.55_0.13_145)]"
                                  : "bg-destructive"
                              )}
                            />
                          ) : (
                            <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="font-mono text-sm">
                            AllStar #{r.allstarNode}
                          </span>
                          {asSource?.lastSeen && (
                            <span className="text-xs text-muted-foreground">
                              · {formatRelativeTime(asSource.lastSeen)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Notes */}
          {r.notes && (
            <Section title="Notas" icon={FileText}>
              <p className="whitespace-pre-wrap text-sm text-foreground">{r.notes}</p>
            </Section>
          )}

          {/* Nearby repeaters */}
          {nearbyRepeaters.length > 0 && (
            <Section title="Repetidores próximos" icon={Navigation}>
              <ol className="divide-y divide-border border-t border-border">
                {nearbyRepeaters.map((nearby) => {
                  const nearbyPrimary = getPrimaryFrequency(nearby);
                  const nearbyStatus = statusDot(nearby.status);
                  const nearbyModes =
                    nearby.modes
                      ?.map((m) => (m === "DSTAR" ? "D-STAR" : m))
                      .join(" · ") || "FM";

                  return (
                    <li key={nearby.callsign}>
                      <Link
                        href={`/repeater/${encodeURIComponent(nearby.callsign)}/`}
                        className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-azulejo-50/40 dark:hover:bg-azulejo-950/20"
                      >
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            nearbyStatus ? nearbyStatus.color : "bg-muted-foreground/40"
                          )}
                          aria-hidden="true"
                          title={nearbyStatus?.label}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-sm font-semibold tabular-nums text-foreground transition-colors group-hover:text-azulejo-700 dark:group-hover:text-azulejo-300">
                              {nearby.callsign}
                            </span>
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              {nearbyModes}
                            </span>
                          </div>
                          {nearbyPrimary && (
                            <div className="mt-0.5 font-mono text-[12.5px] tabular-nums text-muted-foreground">
                              {nearbyPrimary.outputFrequency.toFixed(3)}
                              <span className="text-muted-foreground/70"> MHz</span>
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[12.5px] tabular-nums text-muted-foreground">
                          {formatDistance(nearby.distance)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </Section>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// --- Building-block components ---

function Divider() {
  return <div className="border-t border-border" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
      {children}
    </h2>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}

function Section({
  title,
  icon: Icon,
  trailing,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 border-t border-border pt-5">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
        <SectionLabel>{title}</SectionLabel>
        {trailing && <span className="ml-auto">{trailing}</span>}
      </div>
      {children}
    </section>
  );
}

function FrequencyDisplay({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const isCopyable = typeof copyValue === "string" && copyValue.length > 0;

  async function handleCopy() {
    if (!isCopyable || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(copyValue!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // noop
    }
  }

  return (
    <div
      onClick={handleCopy}
      role={isCopyable ? "button" : undefined}
      tabIndex={isCopyable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isCopyable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCopy();
        }
      }}
      className={cn(
        "group rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition-colors",
        isCopyable && "cursor-pointer hover:border-azulejo-300 hover:bg-muted/60"
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="font-mono text-base font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {isCopyable &&
          (copied ? (
            <Check
              className="h-3.5 w-3.5 text-[oklch(0.55_0.13_145)]"
              aria-hidden="true"
            />
          ) : (
            <Copy
              className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          ))}
      </div>
    </div>
  );
}

function TechSpec({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-sm font-medium text-foreground",
          capitalize && "capitalize"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ModeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-azulejo-100 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-azulejo-700 dark:bg-azulejo-950/50 dark:text-azulejo-300">
      {children}
    </span>
  );
}

function ModeBlock({
  label,
  details,
}: {
  label: string;
  details: { label: string; value: string; mono?: boolean }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ModeChip>{label}</ModeChip>
      </div>
      {details.length > 0 ? (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
          {details.map((d) => (
            <div key={d.label} className="flex items-baseline gap-2">
              <dt className="text-[11px] text-muted-foreground">{d.label}</dt>
              <dd
                className={cn(
                  "text-foreground",
                  d.mono && "font-mono text-sm tabular-nums"
                )}
              >
                {d.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-muted-foreground">Sem detalhes adicionais.</p>
      )}
    </div>
  );
}

function DMRBlock({
  repeater: r,
  autoStatus,
  bmProfile,
  bmLoading,
}: {
  repeater: Repeater;
  autoStatus: RepeaterAutoStatus | null;
  bmProfile: BMProfileBySlot | null;
  bmLoading: boolean;
}) {
  const bmSource = autoStatus?.sources.find((s) => s.source === "brandmeister");

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ModeChip>DMR</ModeChip>
        {r.dmr?.colorCode && (
          <span className="font-mono text-[12.5px] text-muted-foreground">
            CC{r.dmr.colorCode}
          </span>
        )}
        {r.dmr?.network && (
          <span className="text-[12.5px] text-muted-foreground">{r.dmr.network}</span>
        )}
        {bmSource && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                bmSource.isOnline
                  ? "bg-[oklch(0.55_0.13_145)]"
                  : "bg-destructive"
              )}
            />
            {bmSource.lastSeen && formatRelativeTime(bmSource.lastSeen)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TimeslotColumn
          label="TS1"
          slot="1"
          liveTalkgroups={bmProfile?.ts1}
          cmsTalkgroups={r.dmr?.ts1Talkgroups}
          blockedTalkgroups={bmProfile?.blocked ?? r.dmr?.blockedTalkgroups}
          loading={bmLoading}
        />
        <TimeslotColumn
          label="TS2"
          slot="2"
          liveTalkgroups={bmProfile?.ts2}
          cmsTalkgroups={r.dmr?.ts2Talkgroups}
          blockedTalkgroups={bmProfile?.blocked ?? r.dmr?.blockedTalkgroups}
          loading={bmLoading}
        />
      </div>

      {bmProfile && r.dmr?.dmrId && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="size-1.5 shrink-0 rounded-full bg-azulejo-500" />
          <span>Dados ao vivo do Brandmeister</span>
          <a
            href={`https://brandmeister.network/?page=repeater&id=${r.dmr.dmrId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-azulejo-600 transition-colors hover:text-azulejo-700 dark:text-azulejo-400 dark:hover:text-azulejo-300"
          >
            <ExternalLink className="h-3 w-3" />
            Ver perfil
          </a>
        </div>
      )}
    </div>
  );
}

// --- DMR talkgroup sub-components ---

const TYPE_BADGE_STYLES: Record<string, string> = {
  static: "bg-azulejo-100 text-azulejo-700 dark:bg-azulejo-950/50 dark:text-azulejo-300",
  cluster: "border border-border text-muted-foreground",
  timed:
    "border border-[oklch(0.72_0.13_75/0.4)] text-[oklch(0.55_0.13_75)] dark:text-[oklch(0.78_0.13_75)]",
  dynamic:
    "bg-[oklch(0.55_0.13_145/0.12)] text-[oklch(0.45_0.13_145)] dark:text-[oklch(0.75_0.13_145)]",
};

const TYPE_LABELS: Record<string, string> = {
  static: "Estático",
  cluster: "Cluster",
  timed: "Agendado",
  dynamic: "Dinâmico",
};

function translateDays(days: string): string {
  return days
    .replace(/Mon/g, "Seg")
    .replace(/Tue/g, "Ter")
    .replace(/Wed/g, "Qua")
    .replace(/Thu/g, "Qui")
    .replace(/Fri/g, "Sex")
    .replace(/Sat/g, "Sáb")
    .replace(/Sun/g, "Dom");
}

function formatScheduleTooltip(entry: {
  tgId: number;
  name?: string;
  days?: string;
  startTime?: string;
  endTime?: string;
}): string {
  const parts = [entry.name || `TG ${entry.tgId}`];
  const schedule: string[] = [];
  if (entry.days) schedule.push(translateDays(entry.days));
  if (entry.startTime)
    schedule.push(`${entry.startTime}${entry.endTime ? `-${entry.endTime}` : ""}`);
  if (schedule.length) parts.push(`Horário: ${schedule.join(" ")}`);
  return parts.join(" — ");
}

function TalkgroupEntry({
  entry,
}: {
  entry: {
    tgId: number;
    name?: string;
    type: string;
    extTalkgroup?: number;
    days?: string;
    startTime?: string;
    endTime?: string;
  };
}) {
  const tooltip =
    entry.type === "timed" ? formatScheduleTooltip(entry) : entry.name || `TG ${entry.tgId}`;
  return (
    <div
      className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1"
      title={tooltip}
    >
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {entry.tgId}
        {entry.type === "cluster" && entry.extTalkgroup ? ` → ${entry.extTalkgroup}` : ""}
      </span>
      {entry.name && (
        <span className="truncate text-xs text-muted-foreground">{entry.name}</span>
      )}
      <span
        className={cn(
          "ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
          TYPE_BADGE_STYLES[entry.type] || TYPE_BADGE_STYLES.static
        )}
      >
        {entry.type === "dynamic" && (
          <span className="size-1 shrink-0 rounded-full bg-[oklch(0.55_0.13_145)]" />
        )}
        {TYPE_LABELS[entry.type] || entry.type}
      </span>
    </div>
  );
}

function BlockedEntry({ talkgroup }: { talkgroup: { tgId: number; slot?: string } }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-destructive/20 bg-destructive/10 px-2 py-0.5 font-mono text-xs text-destructive">
      <Ban className="h-3 w-3 shrink-0" aria-hidden="true" />
      {talkgroup.tgId}
    </span>
  );
}

function TimeslotColumn({
  label,
  slot,
  liveTalkgroups,
  cmsTalkgroups,
  blockedTalkgroups,
  loading,
}: {
  label: string;
  slot: "1" | "2";
  liveTalkgroups?: BMTalkgroupEntry[];
  cmsTalkgroups?: Array<{
    tgId: number;
    name?: string;
    type: string;
    extTalkgroup?: number;
    days?: string;
    startTime?: string;
    endTime?: string;
  }>;
  blockedTalkgroups?: Array<{ tgId: number; slot?: string }>;
  loading: boolean;
}) {
  const talkgroups = React.useMemo(() => {
    if (!liveTalkgroups) return cmsTalkgroups;
    if (!cmsTalkgroups || cmsTalkgroups.length === 0) return liveTalkgroups;
    const cmsNameMap = new Map<number, string>();
    for (const tg of cmsTalkgroups) {
      if (tg.name) cmsNameMap.set(tg.tgId, tg.name);
    }
    return liveTalkgroups.map((tg) => ({
      ...tg,
      name: tg.name || cmsNameMap.get(tg.tgId),
    }));
  }, [liveTalkgroups, cmsTalkgroups]);

  const slotBlocked = blockedTalkgroups?.filter(
    (tg) => tg.slot === slot || tg.slot === "both"
  );

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="h-px flex-1 bg-border" />
        {loading && (
          <span className="size-2.5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        )}
      </div>
      {talkgroups && talkgroups.length > 0 ? (
        <div className="space-y-1">
          {talkgroups.map((tg, idx) => (
            <TalkgroupEntry key={idx} entry={tg} />
          ))}
        </div>
      ) : (
        <p className="text-[11px] italic text-muted-foreground">Sem talkgroups</p>
      )}
      {slotBlocked && slotBlocked.length > 0 && (
        <div className="mt-2 border-t border-border pt-2">
          <div className="flex flex-wrap gap-1">
            {slotBlocked.map((tg, idx) => (
              <BlockedEntry key={idx} talkgroup={tg} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ShareButton({ callsign }: { callsign: string }) {
  const [copied, setCopied] = React.useState(false);
  const t = useTranslations("repeater");

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/repeater/${encodeURIComponent(callsign)}/`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Repetidor ${callsign}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleShare}
      aria-label={t("share")}
      title={t("share")}
    >
      {copied ? (
        <Check className="h-4 w-4 text-[oklch(0.55_0.13_145)]" />
      ) : (
        <Share2 className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
}
