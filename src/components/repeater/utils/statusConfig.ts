/**
 * Status configuration for repeater operational and community status displays.
 * Centralizes styling to avoid duplication between OperationalStatusCard and StatusDisplay.
 */

import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import type { ComponentType } from "react";

export interface StatusStyleConfig {
  icon: ComponentType<{ className?: string }>;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  iconClass: string;
  textClass: string;
}

export interface OperationalStatusConfig extends StatusStyleConfig {
  label: string;
  description: string;
}

export interface CommunityStatusConfig extends Omit<StatusStyleConfig, "iconBgClass"> {
  labelKey: string;
  descriptionKey: string;
}

/**
 * Configuration for admin-set operational status.
 */
export const operationalStatusConfig: Record<
  "active" | "maintenance" | "offline" | "unknown",
  OperationalStatusConfig
> = {
  active: {
    label: "Operacional",
    description: "Repetidor a funcionar normalmente",
    icon: CheckCircle2,
    bgClass: "bg-[oklch(0.55_0.13_145/0.08)]",
    borderClass: "border-[oklch(0.55_0.13_145/0.25)]",
    iconBgClass: "bg-[oklch(0.55_0.13_145/0.12)]",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    textClass: "text-emerald-700 dark:text-emerald-300",
  },
  maintenance: {
    label: "Em Manutenção",
    description: "Temporariamente indisponível para manutenção",
    icon: AlertCircle,
    bgClass: "bg-[oklch(0.72_0.13_75/0.1)]",
    borderClass: "border-[oklch(0.72_0.13_75/0.3)]",
    iconBgClass: "bg-[oklch(0.72_0.13_75/0.15)]",
    iconClass: "text-amber-600 dark:text-amber-400",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  offline: {
    label: "Offline",
    description: "Repetidor fora de serviço",
    icon: XCircle,
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive/25",
    iconBgClass: "bg-destructive/15",
    iconClass: "text-destructive",
    textClass: "text-destructive",
  },
  unknown: {
    label: "Desconhecido",
    description: "Estado não verificado",
    icon: HelpCircle,
    bgClass: "bg-muted",
    borderClass: "border-border",
    iconBgClass: "bg-muted",
    iconClass: "text-muted-foreground",
    textClass: "text-muted-foreground",
  },
};

/**
 * Configuration for community-voted status (uses translation keys).
 */
export const communityStatusConfig: Record<
  "ok" | "prob-bad" | "bad" | "unknown",
  CommunityStatusConfig
> = {
  ok: {
    labelKey: "status.ok.label",
    descriptionKey: "status.ok.description",
    icon: CheckCircle2,
    bgClass: "bg-[oklch(0.55_0.13_145/0.08)]",
    borderClass: "border-[oklch(0.55_0.13_145/0.25)]",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    textClass: "text-emerald-700 dark:text-emerald-300",
  },
  "prob-bad": {
    labelKey: "status.probBad.label",
    descriptionKey: "status.probBad.description",
    icon: AlertCircle,
    bgClass: "bg-[oklch(0.72_0.13_75/0.1)]",
    borderClass: "border-[oklch(0.72_0.13_75/0.3)]",
    iconClass: "text-amber-600 dark:text-amber-400",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  bad: {
    labelKey: "status.bad.label",
    descriptionKey: "status.bad.description",
    icon: XCircle,
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive/25",
    iconClass: "text-destructive",
    textClass: "text-destructive",
  },
  unknown: {
    labelKey: "status.unknown.label",
    descriptionKey: "status.unknown.description",
    icon: HelpCircle,
    bgClass: "bg-muted",
    borderClass: "border-border",
    iconClass: "text-muted-foreground",
    textClass: "text-muted-foreground",
  },
};
