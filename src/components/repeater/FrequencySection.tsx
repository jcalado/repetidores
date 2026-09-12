"use client";

import { Antenna } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "./SectionCard";
import { InfoCard } from "./InfoCard";
import { fmtMHzDisplay, fmtMHzCopy, duplex } from "./utils/formatters";
import { getAllFrequencyPairs } from "./RepeaterCells";
import type { Repeater } from "./types";

interface FrequencySectionProps {
  repeater: Repeater;
}

/**
 * Frequency information section displaying output, input, offset, and tone.
 */
export function FrequencySection({ repeater: r }: FrequencySectionProps) {
  const t = useTranslations("repeater");
  const tf = useTranslations("table.frequencies");
  const tCard = useTranslations("table.card");
  const pairs = getAllFrequencyPairs(r);
  const primary = pairs[0];
  const { sign, offsetDisplay, offsetCopy } = primary
    ? duplex(primary.outputFrequency, primary.inputFrequency)
    : { sign: '', offsetDisplay: '-', offsetCopy: '' };

  return (
    <SectionCard icon={Antenna} title="Frequências">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        <InfoCard
          label={t("output")}
          value={primary ? fmtMHzDisplay(primary.outputFrequency) : "-"}
          copyValue={primary ? fmtMHzCopy(primary.outputFrequency) : undefined}
        />
        <InfoCard
          label={t("input")}
          value={primary ? fmtMHzDisplay(primary.inputFrequency) : "-"}
          copyValue={primary ? fmtMHzCopy(primary.inputFrequency) : undefined}
        />
        <InfoCard
          label={t("offset")}
          value={`${sign}${sign ? " " : ""}${offsetDisplay}`}
          copyValue={`${sign}${offsetCopy}`}
        />
        <InfoCard
          label={t("tone")}
          value={primary?.tone ? `${Number(primary.tone.toFixed(1))} Hz` : tCard("noTone")}
          copyValue={primary?.tone ? `${Number(primary.tone.toFixed(1))} Hz` : undefined}
        />
      </div>

      {/* Every pair the repeater carries, primary first (spec item 8) */}
      {pairs.length > 1 && (
        <div className="mt-3 border-t border-border pt-2.5">
          <div className="mb-1.5 text-[10px] tracking-wider text-azulejo-500 sm:text-xs">
            {tf("allLabel")}
          </div>
          <ul className="flex flex-col gap-1">
            {pairs.map((pair, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-x-2 font-mono text-sm tabular-nums text-azulejo-900 dark:text-azulejo-100"
              >
                <span>
                  {tf("pair", {
                    output: pair.outputFrequency.toFixed(4),
                    input: pair.inputFrequency.toFixed(4),
                  })}
                </span>
                {pair.tone ? (
                  <span className="text-xs text-muted-foreground">
                    {Number(pair.tone.toFixed(1))} Hz
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
