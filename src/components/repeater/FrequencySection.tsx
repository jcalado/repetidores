"use client";

import { Antenna } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "./SectionCard";
import { InfoCard } from "./InfoCard";
import { fmtMHzDisplay, fmtMHzCopy, duplex } from "./utils/formatters";
import type { Repeater } from "./types";

interface FrequencySectionProps {
  repeater: Repeater;
}

/**
 * Frequency information section displaying output, input, offset, and tone.
 */
export function FrequencySection({ repeater: r }: FrequencySectionProps) {
  const t = useTranslations("repeater");
  const { sign, offsetDisplay, offsetCopy } = duplex(r.outputFrequency, r.inputFrequency);

  return (
    <SectionCard icon={Antenna} title="Frequências">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        <InfoCard
          label={t("output")}
          value={fmtMHzDisplay(r.outputFrequency)}
          copyValue={fmtMHzCopy(r.outputFrequency)}
        />
        <InfoCard
          label={t("input")}
          value={fmtMHzDisplay(r.inputFrequency)}
          copyValue={fmtMHzCopy(r.inputFrequency)}
        />
        <InfoCard
          label={t("offset")}
          value={`${sign}${sign ? " " : ""}${offsetDisplay}`}
          copyValue={`${sign}${offsetCopy}`}
        />
        <InfoCard
          label={t("tone")}
          value={r.tone ? `${Number(r.tone.toFixed(1))} Hz` : "None"}
          copyValue={r.tone ? `${Number(r.tone.toFixed(1))} Hz` : undefined}
        />
      </div>
    </SectionCard>
  );
}
