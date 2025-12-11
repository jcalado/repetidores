"use client";

import { Badge } from "@/components/ui/badge";
import { Radio, Wifi } from "lucide-react";
import { SectionCard } from "./SectionCard";
import type { Repeater } from "./types";

interface DigitalModesSectionProps {
  repeater: Repeater;
}

/**
 * Digital modes and linking section displaying DMR, D-STAR, EchoLink, and AllStar.
 * Returns null if no digital mode data is available.
 */
export function DigitalModesSection({ repeater: r }: DigitalModesSectionProps) {
  const hasDmrDetails = r.dmr && (r.dmrColorCode || r.dmrTalkgroups);
  const hasDstarDetails = r.dstar && (r.dstarReflector || r.dstarModule);
  const hasLinking = r.echolinkNode || r.allstarNode;

  if (!hasDmrDetails && !hasDstarDetails && !hasLinking) {
    return null;
  }

  return (
    <SectionCard icon={Radio} title="Modos Digitais & Linking">
      <div className="space-y-2">
        {/* DMR Details */}
        {hasDmrDetails && (
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 p-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white">DMR</Badge>
              {r.dmrColorCode && (
                <Badge
                  variant="outline"
                  className="text-xs border-purple-300 dark:border-purple-700"
                >
                  CC {r.dmrColorCode}
                </Badge>
              )}
            </div>
            {r.dmrTalkgroups && (
              <div className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Talkgroups:</span> {r.dmrTalkgroups}
              </div>
            )}
          </div>
        )}

        {/* D-STAR Details */}
        {hasDstarDetails && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white">D-STAR</Badge>
              {r.dstarModule && (
                <Badge
                  variant="outline"
                  className="text-xs border-blue-300 dark:border-blue-700"
                >
                  Module {r.dstarModule}
                </Badge>
              )}
            </div>
            {r.dstarReflector && (
              <div className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Reflector:</span> {r.dstarReflector}
              </div>
            )}
          </div>
        )}

        {/* EchoLink & AllStar */}
        {hasLinking && (
          <div className="flex flex-wrap gap-2">
            {r.echolinkNode && (
              <a
                href={`echolink://${r.echolinkNode}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <Wifi className="h-3.5 w-3.5" />
                EchoLink #{r.echolinkNode}
              </a>
            )}
            {r.allstarNode && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                <Radio className="h-3.5 w-3.5" />
                AllStar #{r.allstarNode}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
