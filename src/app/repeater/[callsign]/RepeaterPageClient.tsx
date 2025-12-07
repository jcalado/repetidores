"use client";

import { Repeater } from "@/app/columns";
import BearingCompass from "@/components/BearingCompass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { useDeviceCompass } from "@/hooks/useDeviceCompass";
import { cn } from "@/lib/utils";
import { getVoteStats, postVote, type VoteStats } from "@/lib/votes";
import { toggleFavorite, isFavorite } from "@/lib/favorites";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clipboard,
  Compass,
  Copy,
  ExternalLink,
  Heart,
  MapPin,
  MessageSquare,
  Navigation,
  Radio,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Wifi,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import * as React from "react";

// Dynamic import for the mini map (SSR disabled)
const MiniMap = dynamic(() => import("./MiniMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-muted animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-muted-foreground text-sm">A carregar mapa...</span>
    </div>
  ),
});

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm";
  if (mhz >= 144 && mhz <= 148) return "2m";
  if (mhz >= 50 && mhz <= 54) return "6m";
  return "Other";
}

function fmtMHzDisplay(n?: number) {
  return typeof n === "number" && Number.isFinite(n) ? `${n.toFixed(4)} MHz` : "–";
}

function fmtMHzCopy(n?: number) {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(4) : "";
}

function duplex(rx?: number, tx?: number) {
  if (typeof rx !== "number" || typeof tx !== "number")
    return { sign: "", offsetDisplay: "–", offsetCopy: "" };
  const sign = tx > rx ? "+" : tx < rx ? "-" : "";
  const diff = Math.abs(tx - rx);
  return { sign, offsetDisplay: `${diff.toFixed(4)} MHz`, offsetCopy: diff.toFixed(4) };
}

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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
  const band = getBandFromFrequency(r.outputFrequency);
  const { sign, offsetDisplay, offsetCopy } = duplex(r.outputFrequency, r.inputFrequency);
  const [favorite, setFavorite] = React.useState(() => isFavorite(r.callsign));
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

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/#tabela">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tNav("repeaters")}
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{r.callsign}</h1>
            <button
              onClick={handleFavoriteToggle}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn(
                  "h-6 w-6 transition-colors",
                  favorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"
                )}
              />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{band}</Badge>
            {r.modulation && <Badge variant="outline">{r.modulation.toUpperCase()}</Badge>}
            {r.qth_locator && <Badge variant="outline">QTH {r.qth_locator}</Badge>}
            {r.dmr && <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">DMR</Badge>}
            {r.dstar && <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">D-STAR</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton callsign={r.callsign} />
          <Button asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="mr-2 h-4 w-4" />
              {t("maps")}
            </a>
          </Button>
        </div>
      </div>

      {/* Operational Status */}
      {r.status && r.status !== "unknown" && (
        <OperationalStatusBanner status={r.status} lastVerified={r.lastVerified} />
      )}

      {/* Quick Program Card */}
      <QuickProgramCard repeater={r} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequency Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="h-5 w-5" />
              Frequências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label={t("output")} value={fmtMHzDisplay(r.outputFrequency)} copyValue={fmtMHzCopy(r.outputFrequency)} />
              <InfoItem label={t("input")} value={fmtMHzDisplay(r.inputFrequency)} copyValue={fmtMHzCopy(r.inputFrequency)} />
              <InfoItem label={t("offset")} value={`${sign}${sign ? " " : ""}${offsetDisplay}`} copyValue={`${sign}${offsetCopy}`} />
              <InfoItem label={t("tone")} value={r.tone ? `${Number(r.tone.toFixed(1))} Hz` : "None"} copyValue={r.tone ? `${Number(r.tone.toFixed(1))}` : undefined} />
            </div>
          </CardContent>
        </Card>

        {/* Map Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MiniMap
              latitude={r.latitude}
              longitude={r.longitude}
              callsign={r.callsign}
              userLatitude={userLocation?.latitude}
              userLongitude={userLocation?.longitude}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)}
              </span>
              {osmUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={osmUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    OpenStreetMap
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bearing Compass - shows when user location is available */}
      {hasValidLocations ? (
        <Card className={cn(
          "bg-gradient-to-br border-ship-cove-200 dark:border-ship-cove-800",
          compass.isEnabled
            ? "from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 border-green-300 dark:border-green-700"
            : "from-ship-cove-50 to-ship-cove-100/50 dark:from-ship-cove-950 dark:to-ship-cove-900/50"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Direção para o Repetidor</h3>
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
                    className={cn(
                      "gap-2",
                      compass.isEnabled && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    <Compass className="h-4 w-4" />
                    {compass.isEnabled ? "Desativar bússola" : "Ativar bússola"}
                  </Button>
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
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-muted-foreground">Direção para o Repetidor</h3>
                <p className="text-sm text-muted-foreground">
                  Partilhe a sua localização para ver a direção
                </p>
              </div>
              <Button variant="outline" onClick={() => requestLocation()} disabled={isLocating}>
                <MapPin className="mr-2 h-4 w-4" />
                {isLocating ? "A localizar..." : "Obter localização"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Owner Info */}
      {r.owner && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <Radio className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("owner")}</p>
                <p className="font-medium">{r.owner}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Specs */}
      {(r.power || r.antennaHeight || r.coverage || r.operatingHours) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              Especificações Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {r.power && (
                <div>
                  <p className="text-sm text-muted-foreground">Potência</p>
                  <p className="font-medium">{r.power}W</p>
                </div>
              )}
              {r.antennaHeight && (
                <div>
                  <p className="text-sm text-muted-foreground">Altura Antena</p>
                  <p className="font-medium">{r.antennaHeight}m AGL</p>
                </div>
              )}
              {r.coverage && (
                <div>
                  <p className="text-sm text-muted-foreground">Cobertura</p>
                  <p className="font-medium capitalize">{r.coverage}</p>
                </div>
              )}
              {r.operatingHours && (
                <div>
                  <p className="text-sm text-muted-foreground">Horário</p>
                  <p className="font-medium">{r.operatingHours}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Digital Modes */}
      {(r.dmr || r.dstar || r.echolinkNode || r.allstarNode) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wifi className="h-5 w-5" />
              Modos Digitais & Linking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* DMR Details */}
            {r.dmr && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    DMR
                  </Badge>
                  {r.dmrColorCode && <span className="text-sm">Color Code {r.dmrColorCode}</span>}
                </div>
                {r.dmrTalkgroups && (
                  <p className="text-sm text-muted-foreground">Talkgroups: {r.dmrTalkgroups}</p>
                )}
              </div>
            )}

            {/* D-STAR Details */}
            {r.dstar && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    D-STAR
                  </Badge>
                  {r.dstarModule && <span className="text-sm">Module {r.dstarModule}</span>}
                </div>
                {r.dstarReflector && (
                  <p className="text-sm text-muted-foreground">Reflector: {r.dstarReflector}</p>
                )}
              </div>
            )}

            {/* EchoLink & AllStar */}
            {(r.echolinkNode || r.allstarNode) && (
              <div className="flex flex-wrap gap-3">
                {r.echolinkNode && (
                  <a
                    href={`echolink://${r.echolinkNode}`}
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <Wifi className="h-4 w-4" />
                    EchoLink #{r.echolinkNode}
                  </a>
                )}
                {r.allstarNode && (
                  <div className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium">
                    <Radio className="h-4 w-4" />
                    AllStar #{r.allstarNode}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {r.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Website Link */}
      {r.website && (
        <a
          href={r.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ExternalLink className="h-4 w-4" />
          Visitar website
        </a>
      )}

      {/* Nearby Repeaters */}
      {nearbyRepeaters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Navigation className="h-5 w-5" />
              Repetidores Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nearbyRepeaters.map((nearby) => (
                <Link
                  key={nearby.callsign}
                  href={`/repeater/${encodeURIComponent(nearby.callsign)}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors">
                      <Radio className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{nearby.callsign}</p>
                      <p className="text-xs text-muted-foreground">
                        {nearby.outputFrequency.toFixed(3)} MHz · {nearby.modulation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDistance(nearby.distance)}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Community Voting Section */}
      <VoteSection repeaterId={r.callsign} />
    </div>
  );
}

// --- Components ---

function InfoItem({
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
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-medium">{value}</span>
        {isCopyable && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-accent transition-colors"
            aria-label="Copy"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function OperationalStatusBanner({
  status,
  lastVerified,
}: {
  status: "active" | "maintenance" | "offline" | "unknown";
  lastVerified?: string;
}) {
  const config = {
    active: {
      label: "Activo",
      className: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300",
      icon: "✓",
    },
    maintenance: {
      label: "Em Manutenção",
      className: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300",
      icon: "⚠",
    },
    offline: {
      label: "Desligado",
      className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
      icon: "✕",
    },
    unknown: {
      label: "Desconhecido",
      className: "bg-muted border-border",
      icon: "?",
    },
  } as const;

  const cfg = config[status];

  return (
    <div className={cn("rounded-lg border p-4 flex items-center gap-3", cfg.className)}>
      <span className="text-xl">{cfg.icon}</span>
      <div>
        <p className="font-medium">Estado: {cfg.label}</p>
        {lastVerified && (
          <p className="text-xs opacity-80">
            Verificado em {new Date(lastVerified).toLocaleDateString("pt-PT")}
          </p>
        )}
      </div>
    </div>
  );
}

function ShareButton({ callsign }: { callsign: string }) {
  const [copied, setCopied] = React.useState(false);
  const t = useTranslations("repeater");

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/repeater/${encodeURIComponent(callsign)}`;

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
    <Button variant="outline" onClick={handleShare} aria-label={t("share")}>
      {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Share2 className="mr-2 h-4 w-4" />}
      {t("share")}
    </Button>
  );
}

// --- Voting Section ---
type LocalVote = { vote: "up" | "down"; feedback?: string; ts: number };

function getVoteKey(repeaterId: string) {
  return `repeater-vote:${repeaterId}`;
}

function loadLocalVote(repeaterId: string): LocalVote | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getVoteKey(repeaterId));
    return raw ? (JSON.parse(raw) as LocalVote) : null;
  } catch {
    return null;
  }
}

function saveLocalVote(repeaterId: string, v: LocalVote) {
  try {
    localStorage.setItem(getVoteKey(repeaterId), JSON.stringify(v));
  } catch {}
}

function StatusPill({ status }: { status: "ok" | "prob-bad" | "bad" | "unknown" }) {
  const map = {
    ok: { label: "A funcionar", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
    "prob-bad": { label: "Provavelmente com problemas", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    bad: { label: "Não funciona", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    unknown: { label: "Estado desconhecido", className: "bg-muted text-muted-foreground" },
  } as const;
  const cfg = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

function VoteSection({ repeaterId }: { repeaterId: string }) {
  const [vote, setVote] = React.useState<LocalVote | null>(null);
  const [open, setOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");
  const [stats, setStats] = React.useState<VoteStats | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setVote(loadLocalVote(repeaterId));
    let alive = true;
    getVoteStats(repeaterId).then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, [repeaterId]);

  const status = stats?.category ?? "unknown";

  function handleVote(type: "up" | "down") {
    const v: LocalVote = { vote: type, ts: Date.now(), feedback: vote?.feedback };
    setVote(v);
    saveLocalVote(repeaterId, v);
    setSubmitting(true);
    postVote({ repeaterId, vote: type, feedback: v.feedback })
      .then((s) => setStats(s))
      .finally(() => setSubmitting(false));
  }

  function handleSubmitFeedback() {
    const v: LocalVote = { vote: vote?.vote ?? "up", ts: Date.now(), feedback: feedback.trim() || undefined };
    setVote(v);
    saveLocalVote(repeaterId, v);
    setSubmitting(true);
    postVote({ repeaterId, vote: v.vote, feedback: v.feedback })
      .then((s) => setStats(s))
      .finally(() => setSubmitting(false));
    setOpen(false);
    setFeedback("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estado Comunitário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusPill status={status} />
            {vote?.vote && (
              <Badge variant="secondary" className="text-xs">
                Votaste {vote.vote === "up" ? "Up" : "Down"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={vote?.vote === "up" ? "default" : "outline"}
              size="sm"
              onClick={() => handleVote("up")}
              disabled={submitting}
            >
              <ThumbsUp className="mr-1 h-4 w-4" /> Up
            </Button>
            <Button
              variant={vote?.vote === "down" ? "default" : "outline"}
              size="sm"
              onClick={() => handleVote("down")}
              disabled={submitting}
            >
              <ThumbsDown className="mr-1 h-4 w-4" /> Down
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <MessageSquare className="h-4 w-4" /> Feedback
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Feedback</DialogTitle>
                  <DialogDescription>
                    Partilhe mais informações sobre o estado do repetidor (opcional, máx. 500 caracteres).
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <textarea
                    className="w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[120px]"
                    placeholder="Ex: sem portadora, áudio fraco, tom errado, funciona bem, etc."
                    maxLength={500}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <div className="mt-1 text-xs text-muted-foreground">{feedback.length}/500</div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitFeedback}>Guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {stats ? (
            <>Últimos {stats.windowDays} dias — Up {stats.up} · Down {stats.down}</>
          ) : (
            "A carregar estatísticas..."
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Quick Program Card ---
function QuickProgramCard({ repeater: r }: { repeater: Repeater }) {
  const [copied, setCopied] = React.useState(false);

  // Build programming info text
  const offset = r.inputFrequency - r.outputFrequency;
  const offsetSign = offset > 0 ? "+" : offset < 0 ? "-" : "";
  const offsetMHz = Math.abs(offset).toFixed(3);

  const programText = [
    `${r.callsign}`,
    `RX: ${r.outputFrequency.toFixed(4)} MHz`,
    `TX: ${r.inputFrequency.toFixed(4)} MHz`,
    `Offset: ${offsetSign}${offsetMHz} MHz`,
    r.tone ? `CTCSS: ${r.tone.toFixed(1)} Hz` : null,
    r.modulation ? `Mode: ${r.modulation}` : null,
    r.dmrColorCode ? `DMR CC: ${r.dmrColorCode}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // CHIRP-style one-liner for quick copy
  const chirpLine = `${r.outputFrequency.toFixed(4)},${offsetSign},${offsetMHz},${r.tone ? r.tone.toFixed(1) : ""},${r.modulation || "FM"}`;

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(programText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  return (
    <Card className="bg-gradient-to-br from-ship-cove-50 to-ship-cove-100/50 dark:from-ship-cove-950 dark:to-ship-cove-900/50 border-ship-cove-200 dark:border-ship-cove-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <Clipboard className="h-5 w-5" />
            Programação Rápida
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyAll}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Tudo
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ProgramField label="RX (Saída)" value={`${r.outputFrequency.toFixed(4)}`} unit="MHz" />
          <ProgramField label="TX (Entrada)" value={`${r.inputFrequency.toFixed(4)}`} unit="MHz" />
          <ProgramField label="Offset" value={`${offsetSign}${offsetMHz}`} unit="MHz" />
          <ProgramField
            label="CTCSS"
            value={r.tone ? r.tone.toFixed(1) : "—"}
            unit={r.tone ? "Hz" : ""}
          />
        </div>
        {(r.dmr || r.dstar) && (
          <div className="mt-4 pt-4 border-t border-ship-cove-200 dark:border-ship-cove-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {r.dmrColorCode && (
              <ProgramField label="DMR CC" value={String(r.dmrColorCode)} />
            )}
            {r.dstarModule && (
              <ProgramField label="D-STAR Module" value={r.dstarModule} />
            )}
          </div>
        )}
        <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-black/20 font-mono text-xs overflow-x-auto">
          <code className="text-muted-foreground whitespace-pre">{chirpLine}</code>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramField({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      // noop
    }
  }

  return (
    <div
      onClick={handleCopy}
      className="cursor-pointer p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors group"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-lg font-semibold">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        {copied && (
          <Check className="h-3 w-3 text-emerald-600 ml-1" />
        )}
      </div>
    </div>
  );
}
