"use client";

import { Antenna } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "./SectionCard";
import { InfoCard } from "./InfoCard";
import { fmtMHzDisplay, fmtMHzCopy, duplex } from "./utils/formatters";
import { getPrimaryFrequency } from "@/types/repeater-helpers";
import type { Repeater } from "./types";

interface FrequencySectionProps {
  repeater: Repeater;
}

/**
 * Frequency information section displaying output, input, offset, and tone.
 */
export function FrequencySection({ repeater: r }: FrequencySectionProps) {
  const t = useTranslations("repeater");
  const primary = getPrimaryFrequency(r);
  const { sign, offsetDisplay, offsetCopy } = primary
    ? duplex(primary.outputFrequency, primary.inputFrequency)
    : { sign: '', offsetDisplay: '—', offsetCopy: '' };

  return (
    <SectionCard icon={Antenna} title="Frequências">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        <InfoCard
          label={t("output")}
          value={primary ? fmtMHzDisplay(primary.outputFrequency) : "—"}
          copyValue={primary ? fmtMHzCopy(primary.outputFrequency) : undefined}
        />
        <InfoCard
          label={t("input")}
          value={primary ? fmtMHzDisplay(primary.inputFrequency) : "—"}
          copyValue={primary ? fmtMHzCopy(primary.inputFrequency) : undefined}
        />
        <InfoCard
          label={t("offset")}
          value={`${sign}${sign ? " " : ""}${offsetDisplay}`}
          copyValue={`${sign}${offsetCopy}`}
        />
        <InfoCard
          label={t("tone")}
          value={primary?.tone ? `${Number(primary.tone.toFixed(1))} Hz` : "None"}
          copyValue={primary?.tone ? `${Number(primary.tone.toFixed(1))} Hz` : undefined}
        />
      </div>
    </SectionCard>
  );
}
