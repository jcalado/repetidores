"use client";

import { Repeater } from "@/app/columns";
import BearingCompass from "@/components/BearingCompass";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { useDeviceCompass } from "@/hooks/useDeviceCompass";
import { cn } from "@/lib/utils";
import { getAllAutoStatus, type RepeaterAutoStatus } from "@/lib/auto-status";
import { getBrandmeisterProfile, type BMProfileBySlot, type BMTalkgroupEntry } from "@/lib/brandmeister";
import { formatRelativeTime } from "@/lib/time";
import { toggleFavorite, isFavorite } from "@/lib/favorites";
import {
  ArrowLeft,
  Ban,
  Building2,
  Clock,
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
  ShieldCheck,
  Wifi,
  Zap,
  Antenna,
  Globe,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import * as React from "react";

// Import from refactored repeater module
import {
  getBandFromFrequency,
  fmtMHzDisplay,
  fmtMHzCopy,
  duplex,
} from "@/components/repeater/utils/formatters";
import { getPrimaryFrequency } from "@/types/repeater-helpers";
import { RepeaterHealthCard } from "@/components/repeater/RepeaterHealthCard";
import { operationalStatusConfig } from "@/components/repeater/utils/statusConfig";

// Dynamic import for the mini map (SSR disabled)
const MiniMap = dynamic(() => import("./MiniMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-ship-cove-100 dark:bg-ship-cove-900/50 animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-ship-cove-500 text-sm">A carregar mapa...</span>
    </div>
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
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}


interface RepeaterPageClientProps {
  repeater: Repeater;
  allRepeaters: Repeater[];
}

export default function RepeaterPageClient({ repeater: r, allRepeaters }: RepeaterPageClientProps) {
  const primary = getPrimaryFrequency(r);
  const band = primary ? getBandFromFrequency(primary.outputFrequency) : 'unknown';
  const { sign, offsetDisplay, offsetCopy } = primary
    ? duplex(primary.outputFrequency, primary.inputFrequency)
    : { sign: '', offsetDisplay: '—', offsetCopy: '' };
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

  // Fetch live BM profile for Brandmeister DMR repeaters
  React.useEffect(() => {
    if (!r.modes?.includes('DMR') || !r.dmr?.dmrId || r.dmr.network !== 'Brandmeister') return;
    setBmLoading(true);
    getBrandmeisterProfile(r.dmr.dmrId)
      .then((profile) => {
        if (profile) setBmProfile(profile);
      })
      .finally(() => setBmLoading(false));
  }, [r.modes, r.dmr?.dmrId, r.dmr?.network]);

  const { userLocation, requestLocation, isLocating } = useUserLocation();
  const compass = useDeviceCompass();

  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(r.latitude + "," + r.longitude)}`;
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

  // Calculate nearby repeaters (within 50km, excluding self)
  const nearbyRepeaters = React.useMemo(() => {
    if (!r.latitude || !r.longitude) return [];

    return allRepeaters
      .filter((other) => other.callsign !== r.callsign && other.latitude && other.longitude)
      .map((other) => ({
        ...other,
        distance: calculateDistance(r.latitude, r.longitude, other.latitude, other.longitude),
      }))
      .filter((other) => other.distance <= 50)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [allRepeaters, r.callsign, r.latitude, r.longitude]);

  // Status configuration
  const statusConfig = r.status ? operationalStatusConfig[r.status] : null;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        href="/repetidores"
        className="inline-flex items-center gap-2 text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-900 dark:hover:text-ship-cove-100 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>{tNav("repeaters")}</span>
      </Link>

      {/* Hero Header */}
      <PageHeader
        noMargin
        floatingIcons={[
          <Radio key="radio" className="h-12 w-12 text-white" />,
          <Antenna key="antenna" className="h-10 w-10 text-white" />,
        ]}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            {/* Callsign and favorite */}
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-mono">
                {r.callsign}
              </h1>
              <button
                onClick={handleFavoriteToggle}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-colors",
                    favorite ? "fill-red-400 text-red-400" : "text-white/70 hover:text-red-300"
                  )}
                />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-white/10 text-white text-sm font-medium backdrop-blur-sm">
                {band}
              </span>
              {r.modes?.map((mode) => (
                <span
                  key={mode}
                  className={cn(
                    "px-3 py-1 rounded-md text-sm font-medium",
                    mode === 'DMR' && "bg-purple-500/30 text-purple-100",
                    mode === 'DSTAR' && "bg-blue-500/30 text-blue-100",
                    mode === 'C4FM' && "bg-orange-500/30 text-orange-100",
                    mode === 'TETRA' && "bg-cyan-500/30 text-cyan-100",
                    mode === 'FM' && "bg-ship-cove-500/30 text-ship-cove-100",
                    mode === 'Digipeater' && "bg-green-500/30 text-green-100"
                  )}
                >
                  {mode === 'DSTAR' ? 'D-STAR' : mode}
                </span>
              ))}
              {r.qthLocator && (
                <span className="px-3 py-1 rounded-md bg-white/10 text-white text-sm font-mono backdrop-blur-sm">
                  {r.qthLocator}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <ShareButton callsign={r.callsign} />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-ship-cove-900 font-medium text-sm hover:bg-ship-cove-50 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              {t("maps")}
            </a>
          </div>
        </div>

        {/* Status badge in header */}
        {statusConfig && r.status !== "unknown" && (
          <div className={cn(
            "mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
            r.status === "active" && "bg-emerald-500/20 text-emerald-100",
            r.status === "maintenance" && "bg-amber-500/20 text-amber-100",
            r.status === "offline" && "bg-red-500/20 text-red-100"
          )}>
            <div className={cn(
              "h-2 w-2 rounded-full",
              r.status === "active" && "bg-emerald-400 animate-pulse",
              r.status === "maintenance" && "bg-amber-400",
              r.status === "offline" && "bg-red-400"
            )} />
            {statusConfig.label}
            {r.lastVerified && (
              <span className="text-white/60 text-xs">
                · Verificado {new Date(r.lastVerified).toLocaleDateString("pt-PT")}
              </span>
            )}
          </div>
        )}
      </PageHeader>

      {/* Community Section */}
      <RepeaterHealthCard
        repeaterId={r.callsign}
        operationalStatus={r.status}
        lastVerified={r.lastVerified}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequency Info Panel */}
        <EquipmentPanel title="Frequências" icon={Radio}>
          <div className="grid grid-cols-2 gap-4">
            <FrequencyDisplay
              label={t("output")}
              value={primary ? fmtMHzDisplay(primary.outputFrequency) : "—"}
              copyValue={primary ? fmtMHzCopy(primary.outputFrequency) : undefined}
            />
            <FrequencyDisplay
              label={t("input")}
              value={primary ? fmtMHzDisplay(primary.inputFrequency) : "—"}
              copyValue={primary ? fmtMHzCopy(primary.inputFrequency) : undefined}
            />
            <FrequencyDisplay
              label={t("offset")}
              value={`${sign}${sign ? " " : ""}${offsetDisplay}`}
              copyValue={`${sign}${offsetCopy}`}
            />
            <FrequencyDisplay
              label={t("tone")}
              value={primary?.tone ? `${Number(primary.tone.toFixed(1))} Hz` : "—"}
              copyValue={primary?.tone ? `${Number(primary.tone.toFixed(1))}` : undefined}
            />
          </div>
        </EquipmentPanel>

        {/* Map Panel */}
        <EquipmentPanel title="Localização" icon={MapPin}>
          <MiniMap
            latitude={r.latitude}
            longitude={r.longitude}
            callsign={r.callsign}
            userLatitude={userLocation?.latitude}
            userLongitude={userLocation?.longitude}
          />
          <div className="flex items-center justify-between text-sm mt-3">
            <span className="font-mono text-ship-cove-600 dark:text-ship-cove-400 text-xs">
              {r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)}
            </span>
            {osmUrl && (
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-900 dark:hover:text-ship-cove-100 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                OpenStreetMap
              </a>
            )}
          </div>
        </EquipmentPanel>
      </div>

      {/* Bearing Compass */}
      {hasValidLocations ? (
        <EquipmentPanel
          title="Direção para o Repetidor"
          icon={Compass}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-ship-cove-600 dark:text-ship-cove-400">
                {compass.isEnabled
                  ? "Aponte o dispositivo para a direção indicada"
                  : "Baseado na sua localização atual"}
              </p>
              {compass.isSupported && (
                <button
                  onClick={() => compass.toggle()}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    compass.isEnabled
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-700 dark:text-ship-cove-300 hover:bg-ship-cove-200 dark:hover:bg-ship-cove-700"
                  )}
                >
                  <Compass className="h-4 w-4" />
                  {compass.isEnabled ? "Desativar bússola" : "Ativar bússola"}
                </button>
              )}
              {compass.error && (
                <p className="text-xs text-red-600 dark:text-red-400">{compass.error}</p>
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
        </EquipmentPanel>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-dashed border-ship-cove-300 dark:border-ship-cove-700 bg-ship-cove-50/50 dark:bg-ship-cove-900/20 p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium text-ship-cove-700 dark:text-ship-cove-300">
                Direção para o Repetidor
              </h3>
              <p className="text-sm text-ship-cove-500">
                Partilhe a sua localização para ver a direção
              </p>
            </div>
            <button
              onClick={() => requestLocation()}
              disabled={isLocating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-700 dark:text-ship-cove-300 font-medium text-sm hover:bg-ship-cove-200 dark:hover:bg-ship-cove-700 transition-colors disabled:opacity-50"
            >
              <MapPin className="h-4 w-4" />
              {isLocating ? "A localizar..." : "Obter localização"}
            </button>
          </div>
        </div>
      )}

      {/* Owner/Association Info */}
      {(r.association || r.owner || r.website) && (
        <EquipmentPanel title="Proprietário" icon={Building2}>
          {(r.association || r.owner) && (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
                <Building2 className="h-6 w-6 text-ship-cove-600 dark:text-ship-cove-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ship-cove-500 mb-1">{t("owner")}</p>
                {r.association ? (
                  <Link
                    href={`/association/${r.association.slug}/`}
                    className="font-medium text-ship-cove-900 dark:text-ship-cove-100 hover:text-ship-cove-600 dark:hover:text-ship-cove-300 transition-colors"
                  >
                    {r.association.abbreviation} - {r.association.name}
                  </Link>
                ) : (
                  <p className="font-medium text-ship-cove-900 dark:text-ship-cove-100">{r.owner}</p>
                )}
              </div>
              {r.association && (
                <ChevronRight className="h-5 w-5 text-ship-cove-400" />
              )}
            </div>
          )}
          {r.website && (
            <a
              href={r.website}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-4 group",
                (r.association || r.owner) && "mt-3 pt-3 border-t border-ship-cove-100 dark:border-ship-cove-800/50"
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
                <Globe className="h-6 w-6 text-ship-cove-600 dark:text-ship-cove-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ship-cove-500 mb-1">Website</p>
                <p className="font-medium text-ship-cove-900 dark:text-ship-cove-100 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors truncate">
                  {r.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </p>
              </div>
              <ExternalLink className="h-5 w-5 text-ship-cove-400" />
            </a>
          )}
        </EquipmentPanel>
      )}

      {/* Technical Specs */}
      {(r.power || r.antennaHeight || r.coverage || r.operatingHours) && (
        <EquipmentPanel title="Especificações Técnicas" icon={Zap}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {r.power && (
              <TechSpec label="Potência" value={`${r.power}W`} />
            )}
            {r.antennaHeight && (
              <TechSpec label="Altura Antena" value={`${r.antennaHeight}m AGL`} />
            )}
            {r.coverage && (
              <TechSpec label="Cobertura" value={r.coverage} capitalize />
            )}
            {r.operatingHours && (
              <TechSpec label="Horário" value={r.operatingHours} />
            )}
          </div>
        </EquipmentPanel>
      )}

      {/* Digital Modes */}
      {(r.modes?.includes('DMR') || r.modes?.includes('DSTAR') || r.modes?.includes('C4FM') || r.modes?.includes('TETRA') || r.echolink?.enabled || r.allstarNode || autoStatus) && (
        <EquipmentPanel
          title="Modos Digitais & Linking"
          icon={Wifi}
          titleExtra={autoStatus && (
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
              autoStatus.isOnline
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
            )}>
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                autoStatus.isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              )} />
              {autoStatus.isOnline ? t('autoStatus.online') : t('autoStatus.offline')}
              <ShieldCheck className="h-3 w-3 opacity-60" />
            </span>
          )}
        >
          <div className="space-y-4">
            {/* DMR Details */}
            {r.modes?.includes('DMR') && (
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500 text-white">
                    DMR
                  </span>
                  {r.dmr?.colorCode && (
                    <span className="text-sm text-purple-700 dark:text-purple-300 font-mono">
                      Color Code {r.dmr.colorCode}
                    </span>
                  )}
                  {r.dmr?.network && (
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      {r.dmr.network}
                    </span>
                  )}
                  {(() => {
                    const bmSource = autoStatus?.sources.find(s => s.source === 'brandmeister');
                    if (!bmSource) return null;
                    return (
                      <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                        <span className={cn(
                          "h-2 w-2 rounded-full",
                          bmSource.isOnline ? "bg-emerald-500" : "bg-red-500"
                        )} />
                        {bmSource.lastSeen && formatRelativeTime(bmSource.lastSeen)}
                      </span>
                    );
                  })()}
                </div>

                {/* Timeslot Columns */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Timeslot 1 */}
                  <TimeslotColumn
                    label="TS1"
                    slot="1"
                    liveTalkgroups={bmProfile?.ts1}
                    cmsTalkgroups={r.dmr?.ts1Talkgroups}
                    blockedTalkgroups={bmProfile?.blocked ?? r.dmr?.blockedTalkgroups}
                    loading={bmLoading}
                  />

                  {/* Timeslot 2 */}
                  <TimeslotColumn
                    label="TS2"
                    slot="2"
                    liveTalkgroups={bmProfile?.ts2}
                    cmsTalkgroups={r.dmr?.ts2Talkgroups}
                    blockedTalkgroups={bmProfile?.blocked ?? r.dmr?.blockedTalkgroups}
                    loading={bmLoading}
                  />
                </div>

                {/* Live data indicator */}
                {bmProfile && r.dmr?.dmrId && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Dados ao vivo do Brandmeister</span>
                    <a
                      href={`https://brandmeister.network/?page=repeater&id=${r.dmr.dmrId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver perfil
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* D-STAR Details */}
            {r.modes?.includes('DSTAR') && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500 text-white">
                    D-STAR
                  </span>
                  {r.dstar?.module && (
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-mono">
                      Module {r.dstar.module}
                    </span>
                  )}
                </div>
                {r.dstar?.reflector && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Reflector: {r.dstar.reflector}
                  </p>
                )}
                {r.dstar?.gateway && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Gateway: {r.dstar.gateway}
                  </p>
                )}
              </div>
            )}

            {/* C4FM Details */}
            {r.modes?.includes('C4FM') && (
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500 text-white">
                    C4FM
                  </span>
                  {r.c4fm?.network && (
                    <span className="text-sm text-orange-700 dark:text-orange-300 font-mono uppercase">
                      {r.c4fm.network}
                    </span>
                  )}
                </div>
                {r.c4fm?.room && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Sala: {r.c4fm.room}
                  </p>
                )}
                {r.c4fm?.node && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Node: {r.c4fm.node}
                  </p>
                )}
              </div>
            )}

            {/* TETRA Details */}
            {r.modes?.includes('TETRA') && r.tetra && (
              <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500 text-white">
                    TETRA
                  </span>
                </div>
                {r.tetra.talkgroups && r.tetra.talkgroups.length > 0 && (
                  <p className="text-sm text-cyan-600 dark:text-cyan-400">
                    Talkgroups: {r.tetra.talkgroups.join(', ')}
                  </p>
                )}
                {r.tetra.network && (
                  <p className="text-sm text-cyan-600 dark:text-cyan-400">
                    Rede: {r.tetra.network}
                  </p>
                )}
              </div>
            )}

            {/* EchoLink & AllStar */}
            {(r.echolink?.enabled || r.allstarNode) && (
              <div className="flex flex-wrap gap-3">
                {r.echolink?.enabled && r.echolink.nodeNumber && (() => {
                  const elSource = autoStatus?.sources.find(s => s.source === 'echolink');
                  return (
                    <a
                      href={`echolink://${r.echolink.nodeNumber}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ship-cove-200 dark:border-ship-cove-700 text-sm font-medium text-ship-cove-700 dark:text-ship-cove-300 hover:bg-ship-cove-50 dark:hover:bg-ship-cove-800 transition-colors"
                    >
                      {elSource ? (
                        <span className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          elSource.isOnline ? "bg-emerald-500" : "bg-red-500"
                        )} />
                      ) : (
                        <Wifi className="h-4 w-4" />
                      )}
                      EchoLink #{r.echolink.nodeNumber}
                      {r.echolink.conference && ` (${r.echolink.conference})`}
                      {elSource?.lastSeen && (
                        <span className="text-xs text-ship-cove-500">
                          · {formatRelativeTime(elSource.lastSeen)}
                        </span>
                      )}
                    </a>
                  );
                })()}
                {r.allstarNode && (() => {
                  const asSource = autoStatus?.sources.find(s => s.source === 'allstar');
                  return (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ship-cove-200 dark:border-ship-cove-700 text-sm font-medium text-ship-cove-700 dark:text-ship-cove-300">
                      {asSource ? (
                        <span className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          asSource.isOnline ? "bg-emerald-500" : "bg-red-500"
                        )} />
                      ) : (
                        <Radio className="h-4 w-4" />
                      )}
                      AllStar #{r.allstarNode}
                      {asSource?.lastSeen && (
                        <span className="text-xs text-ship-cove-500">
                          · {formatRelativeTime(asSource.lastSeen)}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </EquipmentPanel>
      )}

      {/* Notes */}
      {r.notes && (
        <EquipmentPanel title="Notas" icon={FileText}>
          <p className="text-sm text-ship-cove-700 dark:text-ship-cove-300 whitespace-pre-wrap">
            {r.notes}
          </p>
        </EquipmentPanel>
      )}

      {/* Nearby Repeaters */}
      {nearbyRepeaters.length > 0 && (
        <EquipmentPanel title="Repetidores Próximos" icon={Navigation}>
          <div className="space-y-2">
            {nearbyRepeaters.map((nearby, index) => (
              <Link
                key={nearby.callsign}
                href={`/repeater/${encodeURIComponent(nearby.callsign)}/`}
                className="flex items-center gap-4 p-3 rounded-lg border border-ship-cove-100 dark:border-ship-cove-800/50 hover:border-ship-cove-300 dark:hover:border-ship-cove-700 bg-white dark:bg-ship-cove-900/30 hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/50 transition-all group animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800 group-hover:bg-ship-cove-200 dark:group-hover:bg-ship-cove-700 transition-colors">
                  <Radio className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold text-ship-cove-900 dark:text-ship-cove-100">
                    {nearby.callsign}
                  </p>
                  <p className="text-xs text-ship-cove-500 font-mono">
                    {(() => {
                      const nearbyPrimary = getPrimaryFrequency(nearby);
                      return nearbyPrimary ? `${nearbyPrimary.outputFrequency.toFixed(3)} MHz` : '';
                    })()}
                    {nearby.modes?.length ? ` · ${nearby.modes.map(m => m === 'DSTAR' ? 'D-STAR' : m).join(', ')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-ship-cove-500">
                  <span className="font-mono tabular-nums">{formatDistance(nearby.distance)}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </EquipmentPanel>
      )}

    </div>
  );
}

// --- Reusable Components ---

function EquipmentPanel({
  title,
  icon: Icon,
  children,
  titleExtra,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  titleExtra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-white dark:bg-ship-cove-950">
      <div className="p-5">
        <h3 className="flex items-center gap-2.5 text-base font-semibold text-ship-cove-900 dark:text-ship-cove-100 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
            <Icon className="h-4 w-4 text-ship-cove-600 dark:text-ship-cove-400" />
          </div>
          {title}
          {titleExtra && <span className="ml-auto">{titleExtra}</span>}
        </h3>
        {children}
      </div>
    </div>
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
      className={cn(
        "group p-3 rounded-lg bg-ship-cove-50 dark:bg-ship-cove-900/50 transition-all",
        isCopyable && "cursor-pointer hover:bg-ship-cove-100 dark:hover:bg-ship-cove-800/50 active:scale-[0.98]"
      )}
    >
      <p className="text-xs uppercase tracking-wider text-ship-cove-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-lg font-bold text-ship-cove-900 dark:text-ship-cove-100 tabular-nums">
          {value}
        </span>
        {isCopyable && (
          copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4 text-ship-cove-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )
        )}
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
    <div className="p-3 rounded-lg bg-ship-cove-50 dark:bg-ship-cove-900/50">
      <p className="text-xs text-ship-cove-500 mb-1">{label}</p>
      <p className={cn(
        "font-medium text-ship-cove-900 dark:text-ship-cove-100",
        capitalize && "capitalize"
      )}>
        {value}
      </p>
    </div>
  );
}

// --- DMR Talkgroup Sub-components ---

const TYPE_BADGE_STYLES = {
  static: "bg-purple-500 text-white",
  cluster: "border border-purple-400 dark:border-purple-500 text-purple-600 dark:text-purple-300 border-dashed",
  timed: "border border-purple-400 dark:border-purple-500 text-purple-600 dark:text-purple-300",
  dynamic: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
} as const;

const TYPE_LABELS: Record<string, string> = {
  static: "Estático",
  cluster: "Cluster",
  timed: "Agendado",
  dynamic: "Dinâmico",
};

function translateDays(days: string): string {
  return days
    .replace(/Mon/g, 'Seg').replace(/Tue/g, 'Ter').replace(/Wed/g, 'Qua')
    .replace(/Thu/g, 'Qui').replace(/Fri/g, 'Sex').replace(/Sat/g, 'Sáb').replace(/Sun/g, 'Dom');
}

function formatScheduleTooltip(entry: { tgId: number; name?: string; days?: string; startTime?: string; endTime?: string }): string {
  const parts = [entry.name || `TG ${entry.tgId}`];
  const schedule: string[] = [];
  if (entry.days) schedule.push(translateDays(entry.days));
  if (entry.startTime) schedule.push(`${entry.startTime}${entry.endTime ? `-${entry.endTime}` : ''}`);
  if (schedule.length) parts.push(`Horário: ${schedule.join(' ')}`);
  return parts.join(' — ');
}

function TalkgroupEntry({ entry }: { entry: { tgId: number; name?: string; type: string; extTalkgroup?: number; days?: string; startTime?: string; endTime?: string } }) {
  const tooltip = entry.type === 'timed' ? formatScheduleTooltip(entry) : (entry.name || `TG ${entry.tgId}`);
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/70 dark:bg-purple-900/40 border border-purple-200/60 dark:border-purple-700/40"
      title={tooltip}
    >
      <span className="font-mono text-sm font-semibold text-purple-800 dark:text-purple-200">
        {entry.tgId}{entry.type === 'cluster' && entry.extTalkgroup ? ` → ${entry.extTalkgroup}` : ''}
      </span>
      {entry.name && (
        <span className="text-xs text-purple-600 dark:text-purple-400 truncate">{entry.name}</span>
      )}
      <span className={cn(
        "ml-auto shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none",
        TYPE_BADGE_STYLES[entry.type as keyof typeof TYPE_BADGE_STYLES] || TYPE_BADGE_STYLES.static
      )}>
        {entry.type === 'dynamic' && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 align-middle" />}
        {TYPE_LABELS[entry.type] || entry.type}
      </span>
      {entry.type === 'timed' && (entry.days || entry.startTime) && (
        <span className="text-[10px] text-purple-500 dark:text-purple-400 whitespace-nowrap">
          {entry.days && translateDays(entry.days)}
          {entry.startTime && ` ${entry.startTime}`}{entry.endTime && `-${entry.endTime}`}
        </span>
      )}
    </div>
  );
}

function BlockedEntry({ talkgroup }: { talkgroup: { tgId: number; slot?: string } }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-mono">
      <Ban className="h-3 w-3 shrink-0" />
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
  slot: '1' | '2';
  liveTalkgroups?: BMTalkgroupEntry[];
  cmsTalkgroups?: Array<{ tgId: number; name?: string; type: string; extTalkgroup?: number; days?: string; startTime?: string; endTime?: string }>;
  blockedTalkgroups?: Array<{ tgId: number; slot?: string }>;
  loading: boolean;
}) {
  // Use live data if available, otherwise fall back to CMS data.
  // When using live data, merge in names from CMS since the BM API often omits them.
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
  const slotBlocked = blockedTalkgroups?.filter(tg => tg.slot === slot || tg.slot === 'both');

  return (
    <div className="rounded-lg bg-purple-100/60 dark:bg-purple-800/30 border border-purple-200/80 dark:border-purple-700/40 p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider">
          {label}
        </span>
        <div className="flex-1 h-px bg-purple-200 dark:bg-purple-700/50" />
        {loading && (
          <span className="h-3 w-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
        )}
      </div>
      {talkgroups && talkgroups.length > 0 ? (
        <div className="space-y-1.5">
          {talkgroups.map((tg, idx) => (
            <TalkgroupEntry key={idx} entry={tg} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-purple-400 dark:text-purple-500 italic">
          Sem talkgroups
        </p>
      )}
      {slotBlocked && slotBlocked.length > 0 && (
        <div className="mt-2 pt-2 border-t border-purple-200/60 dark:border-purple-700/40">
          <div className="flex flex-wrap gap-1.5">
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
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
      aria-label={t("share")}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-300" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {t("share")}
    </button>
  );
}

