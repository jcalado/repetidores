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
    bgClass:
      "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20",
    borderClass: "border-emerald-200 dark:border-emerald-800/50",
    iconBgClass: "bg-emerald-100 dark:bg-emerald-900/50",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    textClass: "text-emerald-700 dark:text-emerald-300",
  },
  maintenance: {
    label: "Em Manutenção",
    description: "Temporariamente indisponível para manutenção",
    icon: AlertCircle,
    bgClass:
      "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20",
    borderClass: "border-amber-200 dark:border-amber-800/50",
    iconBgClass: "bg-amber-100 dark:bg-amber-900/50",
    iconClass: "text-amber-600 dark:text-amber-400",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  offline: {
    label: "Offline",
    description: "Repetidor fora de serviço",
    icon: XCircle,
    bgClass:
      "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20",
    borderClass: "border-red-200 dark:border-red-800/50",
    iconBgClass: "bg-red-100 dark:bg-red-900/50",
    iconClass: "text-red-600 dark:text-red-400",
    textClass: "text-red-700 dark:text-red-300",
  },
  unknown: {
    label: "Desconhecido",
    description: "Estado não verificado",
    icon: HelpCircle,
    bgClass:
      "bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-800/20",
    borderClass: "border-slate-200 dark:border-slate-700/50",
    iconBgClass: "bg-slate-100 dark:bg-slate-800/50",
    iconClass: "text-slate-500 dark:text-slate-400",
    textClass: "text-slate-600 dark:text-slate-300",
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
    bgClass:
      "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30",
    borderClass: "border-emerald-200 dark:border-emerald-800/50",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    textClass: "text-emerald-700 dark:text-emerald-300",
  },
  "prob-bad": {
    labelKey: "status.probBad.label",
    descriptionKey: "status.probBad.description",
    icon: AlertCircle,
    bgClass:
      "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30",
    borderClass: "border-amber-200 dark:border-amber-800/50",
    iconClass: "text-amber-600 dark:text-amber-400",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  bad: {
    labelKey: "status.bad.label",
    descriptionKey: "status.bad.description",
    icon: XCircle,
    bgClass:
      "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30",
    borderClass: "border-red-200 dark:border-red-800/50",
    iconClass: "text-red-600 dark:text-red-400",
    textClass: "text-red-700 dark:text-red-300",
  },
  unknown: {
    labelKey: "status.unknown.label",
    descriptionKey: "status.unknown.description",
    icon: HelpCircle,
    bgClass:
      "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/30",
    borderClass: "border-slate-200 dark:border-slate-700/50",
    iconClass: "text-slate-500 dark:text-slate-400",
    textClass: "text-slate-600 dark:text-slate-300",
  },
};
