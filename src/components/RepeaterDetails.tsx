"use client";

import * as React from "react";
import { Repeater } from "@/app/columns";
import { cn } from "@/lib/utils";

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm";
  if (mhz >= 144 && mhz <= 148) return "2m";
  if (mhz >= 50 && mhz <= 54) return "6m";
  return "Other";
}

function fmtFreq(n?: number) {
  return typeof n === "number" && Number.isFinite(n) ? `${n.toFixed(6)} MHz` : "–";
}

function duplex(rx?: number, tx?: number) {
  if (typeof rx !== "number" || typeof tx !== "number") return { sign: "", offset: "–" };
  const sign = tx > rx ? "+" : tx < rx ? "-" : "";
  const off = Math.abs(tx - rx).toFixed(6) + " MHz";
  return { sign, offset: off };
}

export default function RepeaterDetails({ r }: { r: Repeater }) {
  const band = getBandFromFrequency(r.outputFrequency);
  const { sign, offset } = duplex(r.outputFrequency, r.inputFrequency);

  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(r.latitude + "," + r.longitude)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">{r.callsign}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{band}</span>
            {r.modulation && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                {r.modulation.toUpperCase()}
              </span>
            )}
            {r.qth_locator && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                QTH {r.qth_locator}
              </span>
            )}
          </div>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Open in Maps
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard label="Output" value={fmtFreq(r.outputFrequency)} />
        <InfoCard label="Input" value={fmtFreq(r.inputFrequency)} />
        <InfoCard label="Offset" value={`${sign}${sign ? " " : ""}${offset}`} />
        <InfoCard label="Tone" value={r.tone ? `${Number(r.tone.toFixed(1))} Hz` : "None"} />
        <InfoCard label="Owner" value={r.owner || "–"} className="sm:col-span-2" />
        <InfoCard label="Coordinates" value={`${r.latitude?.toFixed(5)}, ${r.longitude?.toFixed(5)}`} className="sm:col-span-2" />
      </div>
    </div>
  );
}

function InfoCard({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border p-3", className)}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

