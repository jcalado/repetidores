"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StandardPageHeader } from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import {
  Radio,
  Antenna,
  Waves,
  Zap,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";

type Segment = { label: string; startMHz: number; endMHz: number };

type SpectrumBand = { id: "LF" | "MF" | "HF" | "VHF" | "UHF" | "SHF"; title: string; rangeLabel: string; segments: Segment[] };

type NamedBand = { name: string; rangeLabel: string; startMHz?: number; endMHz?: number };

type IARUSegment = { fromKHz: number; toKHz: number; maxBWHz?: number; mode: string; notes?: string[] };

type IARUBand = { label: string; minKHz: number; maxKHz: number; segments: IARUSegment[] };

type PowerEntry = { fromMHz: number; toMHz: number; power: string };

const spectrumBands: SpectrumBand[] = [
    { id: "LF", title: "Banda LF", rangeLabel: "30–300 kHz", segments: [{ label: "135,7–137,8 kHz", startMHz: 0.1357, endMHz: 0.1378 }] },
    { id: "MF", title: "Banda MF", rangeLabel: "300–3000 kHz", segments: [{ label: "1.810–1.850 kHz", startMHz: 1.81, endMHz: 1.85 }] },
    {
        id: "HF",
        title: "Banda HF",
        rangeLabel: "3–30 MHz",
        segments: [
            { label: "3.500–3.800 kHz", startMHz: 3.5, endMHz: 3.8 },
            { label: "7.000–7.200 kHz", startMHz: 7.0, endMHz: 7.2 },
            { label: "10.100–10.150 kHz", startMHz: 10.1, endMHz: 10.15 },
            { label: "14.000–14.350 kHz", startMHz: 14.0, endMHz: 14.35 },
            { label: "18.068–18.168 kHz", startMHz: 18.068, endMHz: 18.168 },
            { label: "21.000–21.450 kHz", startMHz: 21.0, endMHz: 21.45 },
            { label: "24.890–24.990 kHz", startMHz: 24.89, endMHz: 24.99 },
            { label: "28–29,7 MHz", startMHz: 28.0, endMHz: 29.7 },
        ],
    },
    {
        id: "VHF",
        title: "Banda VHF",
        rangeLabel: "30–300 MHz",
        segments: [
            { label: "50–52 MHz", startMHz: 50, endMHz: 52 },
            { label: "70,1570–70,2875 MHz", startMHz: 70.157, endMHz: 70.2875 },
            { label: "144–146 MHz", startMHz: 144, endMHz: 146 },
        ],
    },
    {
        id: "UHF",
        title: "Banda UHF",
        rangeLabel: "300–3000 MHz",
        segments: [
            { label: "430–440 MHz", startMHz: 430, endMHz: 440 },
            { label: "1.240–1.300 MHz", startMHz: 1240, endMHz: 1300 },
            { label: "2.300–2.850 MHz", startMHz: 2300, endMHz: 2850 },
        ],
    },
    {
        id: "SHF",
        title: "Banda SHF",
        rangeLabel: "3–300 GHz",
        segments: [
            { label: "10–10,50 GHz", startMHz: 10000, endMHz: 10500 },
            { label: "24–24,25 GHz", startMHz: 24000, endMHz: 24250 },
            { label: "47–47,2 GHz", startMHz: 47000, endMHz: 47200 },
            { label: "75,5–81 GHz", startMHz: 75500, endMHz: 81000 },
            { label: "122,25–123 GHz", startMHz: 122250, endMHz: 123000 },
            { label: "134–141 GHz", startMHz: 134000, endMHz: 141000 },
            { label: "241–250 GHz", startMHz: 241000, endMHz: 250000 },
        ],
    },
];

const namedBands: NamedBand[] = [
    { name: "160 metros", rangeLabel: "1800–1900 kHz", startMHz: 1.8, endMHz: 1.9 },
    { name: "80 metros", rangeLabel: "3500–3850 kHz", startMHz: 3.5, endMHz: 3.85 },
    { name: "40 metros", rangeLabel: "7000–7300 kHz", startMHz: 7.0, endMHz: 7.3 },
    { name: "30 metros", rangeLabel: "10300–10450 kHz", startMHz: 10.3, endMHz: 10.45 },
    { name: "20 metros", rangeLabel: "14000–14450 kHz", startMHz: 14.0, endMHz: 14.45 },
    { name: "15 metros", rangeLabel: "21000–21450 kHz", startMHz: 21.0, endMHz: 21.45 },
    { name: "12 metros", rangeLabel: "24000–24300 kHz", startMHz: 24.0, endMHz: 24.3 },
    { name: "10 metros", rangeLabel: "28000–29300 kHz", startMHz: 28.0, endMHz: 29.3 },
    { name: "6 metros", rangeLabel: "50–52 MHz", startMHz: 50, endMHz: 52 },
    { name: "2 metros", rangeLabel: "144–146 MHz", startMHz: 144, endMHz: 146 },
    { name: "130 cm", rangeLabel: "220–240 MHz", startMHz: 220, endMHz: 240 },
    { name: "70 cm", rangeLabel: "430–440 MHz", startMHz: 430, endMHz: 440 },
    { name: "23 cm", rangeLabel: "1,2 GHz" },
];

const IARU_R1: IARUBand[] = [
    { label: "LF 2200 m", minKHz: 135.7, maxKHz: 137.8, segments: [{ fromKHz: 135.7, toKHz: 137.8, maxBWHz: 200, mode: "CW", notes: ["CW, QRSS, modos digitais estreitos"] }] },
    { label: "MF 630 m", minKHz: 472, maxKHz: 479, segments: [{ fromKHz: 472, toKHz: 475, maxBWHz: 200, mode: "CW" }, { fromKHz: 475, toKHz: 479, mode: "Narrow band modes", notes: ["Digimodes"] }] },
    { label: "160 m", minKHz: 1810, maxKHz: 2000, segments: [{ fromKHz: 1810, toKHz: 1838, maxBWHz: 200, mode: "CW", notes: ["1836 CW QRP CoA"] }, { fromKHz: 1838, toKHz: 1840, maxBWHz: 500, mode: "Narrow band modes" }, { fromKHz: 1840, toKHz: 1843, maxBWHz: 2700, mode: "All modes", notes: ["Digimodes"] }, { fromKHz: 1843, toKHz: 2000, maxBWHz: 2700, mode: "All modes" }] },
    { label: "80 m", minKHz: 3500, maxKHz: 3800, segments: [{ fromKHz: 3500, toKHz: 3510, maxBWHz: 200, mode: "CW", notes: ["Intercontinental"] }, { fromKHz: 3510, toKHz: 3560, maxBWHz: 200, mode: "CW", notes: ["Contest preferred"] }, { fromKHz: 3560, toKHz: 3570, maxBWHz: 200, mode: "CW", notes: ["3560 CW QRP CoA"] }, { fromKHz: 3570, toKHz: 3580, maxBWHz: 200, mode: "Narrow band modes", notes: ["Digimodes"] }, { fromKHz: 3580, toKHz: 3600, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes"] }, { fromKHz: 3600, toKHz: 3620, maxBWHz: 2700, mode: "All modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 3620, toKHz: 3650, maxBWHz: 2700, mode: "All modes", notes: ["SSB contest pref."] }, { fromKHz: 3650, toKHz: 3700, maxBWHz: 2700, mode: "All modes", notes: ["3690 SSB QRP CoA"] }, { fromKHz: 3700, toKHz: 3775, maxBWHz: 2700, mode: "All modes", notes: ["SSB contest pref.", "3735 Image CoA", "3760 R1 Emergency CoA"] }, { fromKHz: 3775, toKHz: 3800, maxBWHz: 2700, mode: "All modes", notes: ["SSB contest pref.", "Intercontinental"] }] },
    { label: "60 m", minKHz: 5351.5, maxKHz: 5366.5, segments: [{ fromKHz: 5351.5, toKHz: 5354.0, maxBWHz: 200, mode: "CW/Narrow" }, { fromKHz: 5354.0, toKHz: 5366.0, maxBWHz: 2700, mode: "All modes", notes: ["USB recomendado"] }, { fromKHz: 5366.0, toKHz: 5366.5, maxBWHz: 20, mode: "Weak-signal" }] },
    { label: "40 m", minKHz: 7000, maxKHz: 7200, segments: [{ fromKHz: 7000, toKHz: 7040, maxBWHz: 200, mode: "CW", notes: ["7030 CW QRP CoA"] }, { fromKHz: 7040, toKHz: 7047, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes"] }, { fromKHz: 7047, toKHz: 7050, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 7050, toKHz: 7053, maxBWHz: 2700, mode: "All modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 7053, toKHz: 7060, maxBWHz: 2700, mode: "All modes", notes: ["Digimodes"] }, { fromKHz: 7060, toKHz: 7100, maxBWHz: 2700, mode: "All modes", notes: ["SSB contest pref.", "7070 DV CoA", "7090 SSB QRP CoA"] }, { fromKHz: 7100, toKHz: 7130, maxBWHz: 2700, mode: "All modes", notes: ["7110 R1 Emergency CoA"] }, { fromKHz: 7130, toKHz: 7175, maxBWHz: 2700, mode: "All modes", notes: ["SSB contest pref.", "7165 Image CoA"] }, { fromKHz: 7175, toKHz: 7200, maxBWHz: 2700, mode: "All modes", notes: ["SSB contest pref.", "Intercontinental"] }] },
    { label: "30 m", minKHz: 10100, maxKHz: 10150, segments: [{ fromKHz: 10100, toKHz: 10130, maxBWHz: 200, mode: "CW", notes: ["10116 CW QRP CoA"] }, { fromKHz: 10130, toKHz: 10150, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes"] }] },
    { label: "20 m", minKHz: 14000, maxKHz: 14350, segments: [{ fromKHz: 14000, toKHz: 14060, maxBWHz: 200, mode: "CW", notes: ["Contest preferred", "14055 QRS CoA"] }, { fromKHz: 14060, toKHz: 14070, maxBWHz: 200, mode: "CW", notes: ["14060 CW QRP CoA"] }, { fromKHz: 14070, toKHz: 14089, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes"] }, { fromKHz: 14089, toKHz: 14099, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 14099, toKHz: 14101, mode: "Beacons" }, { fromKHz: 14101, toKHz: 14112, maxBWHz: 2700, mode: "All modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 14112, toKHz: 14125, maxBWHz: 2700, mode: "All modes" }, { fromKHz: 14125, toKHz: 14300, maxBWHz: 2700, mode: "All modes", notes: ["SSB contest pref.", "14130 DV CoA", "14195±5 DX", "14230 Image CoA", "14285 SSB QRP CoA"] }, { fromKHz: 14300, toKHz: 14350, maxBWHz: 2700, mode: "All modes", notes: ["14300 Global Emergency CoA"] }] },
    { label: "17 m", minKHz: 18068, maxKHz: 18168, segments: [{ fromKHz: 18068, toKHz: 18095, maxBWHz: 200, mode: "CW", notes: ["18086 CW QRP CoA"] }, { fromKHz: 18095, toKHz: 18105, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes"] }, { fromKHz: 18105, toKHz: 18109, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 18109, toKHz: 18111, mode: "Beacons" }, { fromKHz: 18111, toKHz: 18120, maxBWHz: 2700, mode: "All modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 18120, toKHz: 18168, maxBWHz: 2700, mode: "All modes", notes: ["18130 SSB QRP CoA", "18150 DV CoA", "18160 Emergency CoA"] }] },
    { label: "15 m", minKHz: 21000, maxKHz: 21450, segments: [{ fromKHz: 21000, toKHz: 21070, maxBWHz: 200, mode: "CW", notes: ["21055 QRS CoA", "21060 QRP CoA"] }, { fromKHz: 21070, toKHz: 21090, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes"] }, { fromKHz: 21090, toKHz: 21110, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 21110, toKHz: 21120, maxBWHz: 2700, mode: "All modes", notes: ["Digimodes", "Unattended", "not SSB"] }, { fromKHz: 21120, toKHz: 21149, maxBWHz: 500, mode: "Narrow band modes" }, { fromKHz: 21149, toKHz: 21151, mode: "Beacons" }, { fromKHz: 21151, toKHz: 21450, maxBWHz: 2700, mode: "All modes", notes: ["21180 DV CoA", "21285 SSB QRP CoA", "21340 Image CoA", "21360 Global Emergency CoA"] }] },
    { label: "12 m", minKHz: 24890, maxKHz: 24990, segments: [{ fromKHz: 24890, toKHz: 24915, maxBWHz: 200, mode: "CW", notes: ["24906 CW QRP CoA"] }, { fromKHz: 24915, toKHz: 24925, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes"] }, { fromKHz: 24925, toKHz: 24929, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 24929, toKHz: 24931, mode: "Beacons" }, { fromKHz: 24931, toKHz: 24940, maxBWHz: 2700, mode: "All modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 24940, toKHz: 24990, maxBWHz: 2700, mode: "All modes", notes: ["24950 SSB QRP CoA", "24960 DV CoA"] }] },
    { label: "10 m", minKHz: 28000, maxKHz: 29700, segments: [{ fromKHz: 28000, toKHz: 28070, maxBWHz: 200, mode: "CW", notes: ["28055 QRS CoA", "28060 QRP CoA"] }, { fromKHz: 28070, toKHz: 28120, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes"] }, { fromKHz: 28120, toKHz: 28150, maxBWHz: 500, mode: "Narrow band modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 28150, toKHz: 28190, maxBWHz: 500, mode: "Narrow band modes" }, { fromKHz: 28190, toKHz: 28199, mode: "Beacons", notes: ["IBP Regional"] }, { fromKHz: 28199, toKHz: 28201, mode: "Beacons", notes: ["IBP Worldwide"] }, { fromKHz: 28201, toKHz: 28225, mode: "Beacons", notes: ["IBP Continuous"] }, { fromKHz: 28225, toKHz: 28300, maxBWHz: 2700, mode: "All modes", notes: ["Beacons"] }, { fromKHz: 28300, toKHz: 28320, maxBWHz: 2700, mode: "All modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 28320, toKHz: 29000, maxBWHz: 2700, mode: "All modes", notes: ["28330 DV CoA", "28360 SSB QRP CoA", "28680 Image CoA"] }, { fromKHz: 29000, toKHz: 29100, maxBWHz: 6000, mode: "All modes" }, { fromKHz: 29100, toKHz: 29200, maxBWHz: 6000, mode: "All modes", notes: ["FM simplex 10 kHz"] }, { fromKHz: 29200, toKHz: 29300, maxBWHz: 6000, mode: "All modes", notes: ["Digimodes", "Unattended"] }, { fromKHz: 29300, toKHz: 29510, maxBWHz: 6000, mode: "Satellite Links" }, { fromKHz: 29510, toKHz: 29520, maxBWHz: 6000, mode: "All modes" }, { fromKHz: 29520, toKHz: 29590, maxBWHz: 6000, mode: "All modes", notes: ["FM Repeater input RH1–RH8"] }, { fromKHz: 29600, toKHz: 29600, maxBWHz: 6000, mode: "All modes", notes: ["FM Calling"] }, { fromKHz: 29610, toKHz: 29610, maxBWHz: 6000, mode: "All modes", notes: ["FM Simplex-Repeater"] }, { fromKHz: 29620, toKHz: 29700, maxBWHz: 6000, mode: "All modes", notes: ["FM Repeater output RH1–RH8"] }] },
];

const powerCat2: PowerEntry[] = [
    { fromMHz: 3.7, toMHz: 3.8, power: "200W" },
    { fromMHz: 7.1, toMHz: 7.2, power: "200W" },
    { fromMHz: 14.125, toMHz: 14.25, power: "200W" },
    { fromMHz: 14.25, toMHz: 14.35, power: "200W" },
    { fromMHz: 21.151, toMHz: 21.45, power: "200W" },
    { fromMHz: 28, toMHz: 29.7, power: "200W" },
    { fromMHz: 144, toMHz: 145.806, power: "150W" },
    { fromMHz: 145.806, toMHz: 146, power: "150W" },
    { fromMHz: 430, toMHz: 435, power: "150W" },
    { fromMHz: 438, toMHz: 440, power: "150W" },
    { fromMHz: 24000, toMHz: 24050, power: "10W" },
    { fromMHz: 47000, toMHz: 47200, power: "10W" },
    { fromMHz: 77500, toMHz: 78000, power: "10W" },
    { fromMHz: 134000, toMHz: 136000, power: "10W" },
    { fromMHz: 248000, toMHz: 250000, power: "10W" },
];

const powerCat1: PowerEntry[] = [
    { fromMHz: 0.1357, toMHz: 0.1378, power: "1W" },
    { fromMHz: 1.81, toMHz: 1.83, power: "200W" },
    { fromMHz: 1.83, toMHz: 1.85, power: "1500W" },
    { fromMHz: 3.5, toMHz: 3.7, power: "1500W" },
    { fromMHz: 3.7, toMHz: 3.8, power: "1500W" },
    { fromMHz: 7, toMHz: 7.1, power: "1500W" },
    { fromMHz: 7.1, toMHz: 7.2, power: "1500W" },
    { fromMHz: 10.1, toMHz: 10.15, power: "750W" },
    { fromMHz: 14, toMHz: 14.125, power: "1500W" },
    { fromMHz: 14.125, toMHz: 14.25, power: "1500W" },
    { fromMHz: 14.25, toMHz: 14.35, power: "1500W" },
    { fromMHz: 18.068, toMHz: 18.168, power: "1500W" },
    { fromMHz: 21, toMHz: 21.151, power: "1500W" },
    { fromMHz: 21.151, toMHz: 21.45, power: "1500W" },
    { fromMHz: 24.89, toMHz: 24.99, power: "1500W" },
    { fromMHz: 28, toMHz: 29.7, power: "1500W" },
    { fromMHz: 50, toMHz: 50.5, power: "25W" },
    { fromMHz: 70.157, toMHz: 70.2125, power: "100W" },
    { fromMHz: 70.2375, toMHz: 70.2875, power: "100W" },
    { fromMHz: 144, toMHz: 145.806, power: "300W" },
    { fromMHz: 145.806, toMHz: 146, power: "300W" },
    { fromMHz: 430, toMHz: 435, power: "300W" },
    { fromMHz: 435, toMHz: 438, power: "300W" },
    { fromMHz: 438, toMHz: 440, power: "300W" },
    { fromMHz: 1240, toMHz: 1260, power: "50W" },
    { fromMHz: 1260, toMHz: 1270, power: "50W" },
    { fromMHz: 1270, toMHz: 1300, power: "300W" },
    { fromMHz: 2300, toMHz: 2400, power: "Sob pedido" },
    { fromMHz: 2400, toMHz: 2450, power: "Sob pedido" },
    { fromMHz: 5650, toMHz: 5668, power: "Sob pedido" },
    { fromMHz: 5668, toMHz: 5670, power: "Sob pedido" },
    { fromMHz: 5670, toMHz: 5830, power: "Sob pedido" },
    { fromMHz: 5830, toMHz: 5850, power: "Sob pedido" },
    { fromMHz: 10000, toMHz: 10370, power: "300W" },
    { fromMHz: 10370, toMHz: 10450, power: "Sob pedido" },
    { fromMHz: 10450, toMHz: 10500, power: "300W" },
    { fromMHz: 24000, toMHz: 24050, power: "50W" },
    { fromMHz: 24050, toMHz: 24250, power: "50W" },
    { fromMHz: 47000, toMHz: 47200, power: "50W" },
    { fromMHz: 75500, toMHz: 76000, power: "50W" },
    { fromMHz: 76000, toMHz: 77500, power: "50W" },
    { fromMHz: 77500, toMHz: 78000, power: "50W" },
    { fromMHz: 78000, toMHz: 81000, power: "50W" },
    { fromMHz: 122250, toMHz: 123000, power: "50W" },
    { fromMHz: 134000, toMHz: 136000, power: "50W" },
    { fromMHz: 136000, toMHz: 141000, power: "50W" },
    { fromMHz: 241000, toMHz: 248000, power: "50W" },
    { fromMHz: 248000, toMHz: 250000, power: "50W" },
];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function percentPos(value: number, min: number, max: number) {
    if (max <= min) return 0;
    return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

function strip(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function matchesQuery(text: string, q: string) {
    return strip(text).includes(strip(q));
}

function toMHz(kHz: number) {
    return kHz / 1000;
}

function modeColor(mode: string) {
    const m = mode.toLowerCase();
    if (m.includes("beacon")) return "bg-amber-500/80";
    if (m.includes("weak")) return "bg-purple-500/80";
    if (m.includes("cw")) return "bg-emerald-500/80";
    if (m.includes("narrow")) return "bg-indigo-500/80";
    return "bg-sky-500/80";
}

// Pastel colors for each spectrum band
const bandColors: Record<string, { bg: string; bgHover: string; icon: string; iconText: string; accent: string; border: string; dot: string }> = {
    LF: { bg: "bg-violet-300 dark:bg-violet-400/70", bgHover: "bg-violet-400 dark:bg-violet-300", icon: "bg-violet-100 dark:bg-violet-900/50", iconText: "text-violet-600 dark:text-violet-400", accent: "via-violet-400", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-400 dark:bg-violet-400" },
    MF: { bg: "bg-fuchsia-300 dark:bg-fuchsia-400/70", bgHover: "bg-fuchsia-400 dark:bg-fuchsia-300", icon: "bg-fuchsia-100 dark:bg-fuchsia-900/50", iconText: "text-fuchsia-600 dark:text-fuchsia-400", accent: "via-fuchsia-400", border: "border-fuchsia-200 dark:border-fuchsia-800", dot: "bg-fuchsia-400 dark:bg-fuchsia-400" },
    HF: { bg: "bg-sky-300 dark:bg-sky-400/70", bgHover: "bg-sky-400 dark:bg-sky-300", icon: "bg-sky-100 dark:bg-sky-900/50", iconText: "text-sky-600 dark:text-sky-400", accent: "via-sky-400", border: "border-sky-200 dark:border-sky-800", dot: "bg-sky-400 dark:bg-sky-400" },
    VHF: { bg: "bg-teal-300 dark:bg-teal-400/70", bgHover: "bg-teal-400 dark:bg-teal-300", icon: "bg-teal-100 dark:bg-teal-900/50", iconText: "text-teal-600 dark:text-teal-400", accent: "via-teal-400", border: "border-teal-200 dark:border-teal-800", dot: "bg-teal-400 dark:bg-teal-400" },
    UHF: { bg: "bg-amber-300 dark:bg-amber-400/70", bgHover: "bg-amber-400 dark:bg-amber-300", icon: "bg-amber-100 dark:bg-amber-900/50", iconText: "text-amber-600 dark:text-amber-400", accent: "via-amber-400", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-400 dark:bg-amber-400" },
    SHF: { bg: "bg-rose-300 dark:bg-rose-400/70", bgHover: "bg-rose-400 dark:bg-rose-300", icon: "bg-rose-100 dark:bg-rose-900/50", iconText: "text-rose-600 dark:text-rose-400", accent: "via-rose-400", border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-400 dark:bg-rose-400" },
};

function getBandColor(bandId: string) {
    return bandColors[bandId] || bandColors.HF;
}

function powerValue(power: string) {
    const n = parseFloat(power.replace(",", "."));
    return isNaN(n) ? null : n;
}

function powerColor(power: string) {
    const n = powerValue(power);
    if (n === null) return "bg-yellow-500/80";
    if (n >= 1000) return "bg-red-500/80";
    if (n >= 300) return "bg-orange-500/80";
    if (n >= 200) return "bg-rose-500/80";
    if (n >= 150) return "bg-pink-500/80";
    if (n >= 100) return "bg-sky-500/80";
    if (n >= 50) return "bg-teal-500/80";
    if (n >= 25) return "bg-emerald-500/80";
    if (n >= 10) return "bg-green-500/80";
    return "bg-lime-500/80";
}

function fmtRangeMHz(a: number, b: number) {
    const fa = a % 1 === 0 ? a.toFixed(0) : a.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    const fb = b % 1 === 0 ? b.toFixed(0) : b.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    return `${fa}–${fb} MHz`;
}

export default function QNAFPortugalHamBands() {
    const [view, setView] = useState<"spectrum" | "named" | "iaru" | "power">("spectrum");
    const [query, setQuery] = useState("");
    // Track hovered segment: "bandId-segmentIndex"
    const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

    const filteredSpectrum = useMemo(() => {
        if (!query) return spectrumBands;
        return spectrumBands.map((band) => ({ ...band, segments: band.segments.filter((s) => matchesQuery(`${band.title} ${s.label}`, query)) })).filter((band) => band.segments.length > 0);
    }, [query]);

    const filteredNamed = useMemo(() => {
        if (!query) return namedBands;
        return namedBands.filter((b) => matchesQuery(`${b.name} ${b.rangeLabel}`, query));
    }, [query]);

    const filteredIARU = useMemo(() => {
        if (!query) return IARU_R1;
        return IARU_R1.map((b) => ({ ...b, segments: b.segments.filter((s) => matchesQuery(`${b.label} ${s.mode} ${(s.notes || []).join(" ")}`, query)) })).filter((b) => b.segments.length > 0);
    }, [query]);

    const filteredPower1 = useMemo(() => {
        if (!query) return powerCat1;
        return powerCat1.filter((p) => matchesQuery(`${p.power} ${p.fromMHz} ${p.toMHz}`, query));
    }, [query]);

    const filteredPower2 = useMemo(() => {
        if (!query) return powerCat2;
        return powerCat2.filter((p) => matchesQuery(`${p.power} ${p.fromMHz} ${p.toMHz}`, query));
    }, [query]);

    const renderPowerBars = (powerList: PowerEntry[]) => (
        <div className="space-y-4">
            {filteredSpectrum.map((band) => (
                <div key={band.id} className="rounded-xl border border-ship-cove-200 dark:border-ship-cove-800 bg-ship-cove-50/50 dark:bg-ship-cove-900/30 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm">
                        <span className="font-semibold text-ship-cove-900 dark:text-ship-cove-100">{band.title}</span>
                        <span className="text-xs font-mono text-ship-cove-500 dark:text-ship-cove-400">{band.rangeLabel}</span>
                    </div>
                    <div className="space-y-3">
                        {band.segments.map((seg, idx) => {
                            const pOver = powerList
                                .map((p) => ({
                                    start: Math.max(seg.startMHz, p.fromMHz),
                                    end: Math.min(seg.endMHz, p.toMHz),
                                    label: p.power,
                                }))
                                .filter((x) => x.end > x.start)
                                .sort((a, b) => a.start - b.start);
                            return (
                                <div key={idx}>
                                    <div className="mb-1 text-xs text-ship-cove-600 dark:text-ship-cove-400">{seg.label}</div>
                                    <div className="relative h-12 rounded-xl bg-ship-cove-100 dark:bg-ship-cove-900/50 overflow-hidden">
                                        <div className="absolute inset-0">
                                            <div className="absolute left-2 top-1 text-[10px] font-mono text-ship-cove-500 dark:text-ship-cove-400">{seg.startMHz.toLocaleString("pt-PT", { maximumFractionDigits: 3 })} MHz</div>
                                            <div className="absolute right-2 bottom-1 text-[10px] font-mono text-ship-cove-500 dark:text-ship-cove-400">{seg.endMHz.toLocaleString("pt-PT", { maximumFractionDigits: 3 })} MHz</div>
                                        </div>
                                        {pOver.map((o, j) => {
                                            const left = percentPos(o.start, seg.startMHz, seg.endMHz);
                                            const width = percentPos(o.end, seg.startMHz, seg.endMHz) - left;
                                            return (
                                                <div key={j} className={`absolute h-full rounded-lg border border-white/40 shadow-sm transition ${powerColor(o.label)}`} style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }} title={`${o.label} • ${o.start.toFixed(3)}–${o.end.toFixed(3)} MHz`}>
                                                    <div className="flex h-full items-center justify-center px-2">
                                                        <span className="text-[11px] font-medium text-white drop-shadow-sm truncate">{o.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            <div className="flex flex-wrap items-center gap-3 text-xs mt-4 p-3 rounded-lg bg-ship-cove-50 dark:bg-ship-cove-900/30">
                <span className="font-medium text-ship-cove-700 dark:text-ship-cove-300">Legenda:</span>
                {[
                    "1500W",
                    "300W",
                    "200W",
                    "150W",
                    "100W",
                    "50W",
                    "25W",
                    "10W",
                    "1W",
                    "Sob pedido",
                ].map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5 text-ship-cove-600 dark:text-ship-cove-400">
                        <span className={`h-2.5 w-4 rounded ${powerColor(p)}`}></span>
                        {p}
                    </span>
                ))}
            </div>
        </div>
    );

    // Calculate stats
    const totalSpectrumBands = spectrumBands.length;
    const totalSegments = spectrumBands.reduce((sum, b) => sum + b.segments.length, 0);
    const totalIARUBands = IARU_R1.length;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Hero Header */}
            <StandardPageHeader
                icon={<Waves className="h-7 w-7" />}
                title="Frequências de Amador"
                description="Plano de bandas QNAF, IARU Região 1 e potências máximas para radioamadores em Portugal"
                stats={[
                    {
                        icon: <Radio className="h-4 w-4" />,
                        value: totalSpectrumBands,
                        label: "bandas",
                    },
                    {
                        icon: <Antenna className="h-4 w-4" />,
                        value: totalSegments,
                        label: "segmentos",
                        variant: "success",
                    },
                    {
                        icon: <Zap className="h-4 w-4" />,
                        value: totalIARUBands,
                        label: "IARU",
                    },
                ]}
                floatingIcons={[
                    <Radio key="radio" className="h-12 w-12 text-white" />,
                    <Antenna key="antenna" className="h-10 w-10 text-white" />,
                ]}
            />

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="w-full sm:w-auto">
                    <TabsList className="grid grid-cols-4 w-full sm:w-auto bg-ship-cove-100 dark:bg-ship-cove-800/50">
                        <TabsTrigger value="spectrum" className="text-xs sm:text-sm">QNAF</TabsTrigger>
                        <TabsTrigger value="named" className="text-xs sm:text-sm">Bandas</TabsTrigger>
                        <TabsTrigger value="iaru" className="text-xs sm:text-sm">IARU</TabsTrigger>
                        <TabsTrigger value="power" className="text-xs sm:text-sm">Potências</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ship-cove-400 pointer-events-none" />
                    <Input
                        placeholder="Procurar… (ex.: 144, CW, 1500W)"
                        className="w-full sm:w-72 pl-10 pr-10 h-10 rounded-lg border-ship-cove-200 dark:border-ship-cove-800 bg-white dark:bg-ship-cove-950/50"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Pesquisar"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-500 hover:bg-ship-cove-200 dark:hover:bg-ship-cove-700 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                <TabsContent value="spectrum" className="space-y-5">
                    {filteredSpectrum.map((band) => {
                        const min = Math.min(...band.segments.map((s) => s.startMHz));
                        const max = Math.max(...band.segments.map((s) => s.endMHz));
                        const colors = getBandColor(band.id);
                        return (
                            <div key={band.id} className={`relative overflow-hidden rounded-xl border ${colors.border} bg-white dark:bg-ship-cove-950/50 shadow-sm`}>
                                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent ${colors.accent} to-transparent`} />
                                <div className="p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.icon}`}>
                                            <Radio className={`h-5 w-5 ${colors.iconText}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-ship-cove-900 dark:text-ship-cove-100">{band.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center rounded-md ${colors.icon} ${colors.iconText} px-2 py-0.5 text-xs font-medium`}>{band.rangeLabel}</span>
                                                <span className="text-xs text-ship-cove-500 dark:text-ship-cove-400">{band.segments.length} subfaixa{band.segments.length > 1 ? 's' : ''} QNAF</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visualization bar */}
                                    <div className="relative h-14 rounded-xl bg-ship-cove-100 dark:bg-ship-cove-900/50 overflow-hidden mb-4">
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute left-2 top-1 text-[10px] font-mono text-ship-cove-500 dark:text-ship-cove-400">{min.toLocaleString("pt-PT", { maximumFractionDigits: 3 })} MHz</div>
                                            <div className="absolute right-2 bottom-1 text-[10px] font-mono text-ship-cove-500 dark:text-ship-cove-400">{max.toLocaleString("pt-PT", { maximumFractionDigits: 3 })} MHz</div>
                                        </div>
                                        {band.segments.map((seg, idx) => {
                                            const segmentId = `${band.id}-${idx}`;
                                            const isHovered = hoveredSegment === segmentId;
                                            const left = percentPos(seg.startMHz, min, max);
                                            const width = percentPos(seg.endMHz, min, max) - left;
                                            // Only show label if segment is wide enough (> 8%)
                                            const showLabel = width > 8;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`absolute h-full rounded-lg border shadow-sm transition-all duration-200 cursor-pointer ${
                                                        isHovered
                                                            ? `${colors.bgHover} border-white scale-y-110 z-20 ring-2 ring-white/50`
                                                            : `${colors.bg} border-white/40`
                                                    }`}
                                                    style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                                                    title={`${seg.label}\n${seg.startMHz.toLocaleString("pt-PT", { maximumFractionDigits: 4 })}–${seg.endMHz.toLocaleString("pt-PT", { maximumFractionDigits: 4 })} MHz`}
                                                    aria-label={seg.label}
                                                    onMouseEnter={() => setHoveredSegment(segmentId)}
                                                    onMouseLeave={() => setHoveredSegment(null)}
                                                >
                                                    {showLabel && (
                                                        <div className="flex h-full items-center justify-center px-1">
                                                            <span className={`text-[10px] font-medium drop-shadow-sm truncate ${isHovered ? 'text-white' : 'text-ship-cove-900 dark:text-white'}`}>{seg.label}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Segment list */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {band.segments.map((seg, idx) => {
                                            const segmentId = `${band.id}-${idx}`;
                                            const isHovered = hoveredSegment === segmentId;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                                                        isHovered
                                                            ? `${colors.icon} ring-2 ring-offset-1 ${colors.border}`
                                                            : 'bg-ship-cove-50 dark:bg-ship-cove-900/30 hover:bg-ship-cove-100 dark:hover:bg-ship-cove-900/50'
                                                    }`}
                                                    onMouseEnter={() => setHoveredSegment(segmentId)}
                                                    onMouseLeave={() => setHoveredSegment(null)}
                                                >
                                                    <div className={`h-3 w-3 rounded-sm shrink-0 transition-transform duration-200 ${colors.dot} ${isHovered ? 'scale-125' : ''}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-sm font-medium truncate ${isHovered ? colors.iconText : 'text-ship-cove-900 dark:text-ship-cove-100'}`}>{seg.label}</div>
                                                        <div className="text-xs font-mono text-ship-cove-500 dark:text-ship-cove-400">
                                                            {seg.startMHz.toLocaleString("pt-PT", { maximumFractionDigits: 4 })}–{seg.endMHz.toLocaleString("pt-PT", { maximumFractionDigits: 4 })} MHz
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredSpectrum.length === 0 && <p className="text-sm text-ship-cove-500 dark:text-ship-cove-400">Sem resultados para &quot;{query}&quot;.</p>}
                </TabsContent>

                <TabsContent value="named">
                    <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-white dark:bg-ship-cove-950/50 shadow-sm">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-500 to-transparent opacity-60" />
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
                                    <Antenna className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-ship-cove-900 dark:text-ship-cove-100">Nomes das bandas</h3>
                                    <p className="text-sm text-ship-cove-500 dark:text-ship-cove-400">Designações comuns das bandas de radioamador</p>
                                </div>
                            </div>
                            <div className="w-full overflow-x-auto rounded-xl border border-ship-cove-200 dark:border-ship-cove-800">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-ship-cove-50 dark:bg-ship-cove-900/50">
                                            <TableHead className="w-[180px] font-semibold text-ship-cove-700 dark:text-ship-cove-300">Banda</TableHead>
                                            <TableHead className="font-semibold text-ship-cove-700 dark:text-ship-cove-300">Intervalo (texto)</TableHead>
                                            <TableHead className="w-[220px] font-semibold text-ship-cove-700 dark:text-ship-cove-300">Intervalo (MHz)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredNamed.slice().sort((a, b) => (a.startMHz ?? Infinity) - (b.startMHz ?? Infinity)).map((b, idx) => (
                                            <TableRow key={idx} className="hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/30">
                                                <TableCell className="font-medium text-ship-cove-900 dark:text-ship-cove-100">{b.name}</TableCell>
                                                <TableCell className="text-ship-cove-700 dark:text-ship-cove-300">{b.rangeLabel}</TableCell>
                                                <TableCell className="font-mono text-sm text-ship-cove-500 dark:text-ship-cove-400">{b.startMHz !== undefined && b.endMHz !== undefined ? `${b.startMHz.toLocaleString("pt-PT", { maximumFractionDigits: 3 })}–${b.endMHz.toLocaleString("pt-PT", { maximumFractionDigits: 3 })} MHz` : "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredNamed.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-sm text-ship-cove-500 dark:text-ship-cove-400">Sem resultados para &quot;{query}&quot;.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="iaru" className="space-y-5">
                    {filteredIARU.map((band, i) => {
                        const min = band.minKHz;
                        const max = band.maxKHz;
                        return (
                            <div key={band.label + i} className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-white dark:bg-ship-cove-950/50 shadow-sm">
                                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" />
                                <div className="p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                                            <Waves className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-ship-cove-900 dark:text-ship-cove-100">{band.label}</h3>
                                            <p className="text-sm text-ship-cove-500 dark:text-ship-cove-400">Plano IARU R1 — {toMHz(min).toLocaleString("pt-PT", { maximumFractionDigits: 4 })}–{toMHz(max).toLocaleString("pt-PT", { maximumFractionDigits: 4 })} MHz</p>
                                        </div>
                                    </div>
                                    <div className="relative h-12 rounded-xl bg-ship-cove-100 dark:bg-ship-cove-900/50 overflow-hidden">
                                        <div className="absolute inset-0">
                                            <div className="absolute left-2 top-1 text-[10px] font-mono text-ship-cove-500 dark:text-ship-cove-400">{toMHz(min).toLocaleString("pt-PT", { maximumFractionDigits: 3 })} MHz</div>
                                            <div className="absolute right-2 bottom-1 text-[10px] font-mono text-ship-cove-500 dark:text-ship-cove-400">{toMHz(max).toLocaleString("pt-PT", { maximumFractionDigits: 3 })} MHz</div>
                                        </div>
                                        {band.segments.map((s, idx) => {
                                            const left = percentPos(s.fromKHz, min, max);
                                            const width = percentPos(s.toKHz, min, max) - left;
                                            return (
                                                <div key={idx} className={`absolute h-full rounded-lg border border-white/40 shadow-sm transition ${modeColor(s.mode)}`} style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }} title={`${(s.fromKHz / 1000).toFixed(3)}–${(s.toKHz / 1000).toFixed(3)} MHz • ${s.mode}${s.maxBWHz ? ` • ≤${s.maxBWHz} Hz` : ""}${s.notes && s.notes.length ? ` • ${s.notes.join("; ")}` : ""}`}></div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1.5 text-xs text-ship-cove-600 dark:text-ship-cove-400">
                                            <span className="h-2.5 w-4 rounded bg-emerald-500/80"></span>CW
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs text-ship-cove-600 dark:text-ship-cove-400">
                                            <span className="h-2.5 w-4 rounded bg-indigo-500/80"></span>Narrow band
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs text-ship-cove-600 dark:text-ship-cove-400">
                                            <span className="h-2.5 w-4 rounded bg-sky-500/80"></span>All modes
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs text-ship-cove-600 dark:text-ship-cove-400">
                                            <span className="h-2.5 w-4 rounded bg-amber-500/80"></span>Beacons
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs text-ship-cove-600 dark:text-ship-cove-400">
                                            <span className="h-2.5 w-4 rounded bg-purple-500/80"></span>Weak-signal
                                        </span>
                                    </div>
                                    <div className="mt-4 w-full overflow-x-auto rounded-xl border border-ship-cove-200 dark:border-ship-cove-800">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-ship-cove-50 dark:bg-ship-cove-900/50">
                                                    <TableHead className="font-semibold text-ship-cove-700 dark:text-ship-cove-300">Intervalo (kHz)</TableHead>
                                                    <TableHead className="font-semibold text-ship-cove-700 dark:text-ship-cove-300">Modo recomendado</TableHead>
                                                    <TableHead className="font-semibold text-ship-cove-700 dark:text-ship-cove-300">Larg. máx. (Hz)</TableHead>
                                                    <TableHead className="font-semibold text-ship-cove-700 dark:text-ship-cove-300">Notas</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {band.segments.map((s, idx) => (
                                                    <TableRow key={idx} className="hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/30">
                                                        <TableCell className="font-mono text-sm text-ship-cove-700 dark:text-ship-cove-300">{s.fromKHz}–{s.toKHz}</TableCell>
                                                        <TableCell className="text-ship-cove-700 dark:text-ship-cove-300">{s.mode}</TableCell>
                                                        <TableCell className="font-mono text-sm text-ship-cove-500 dark:text-ship-cove-400">{s.maxBWHz ? s.maxBWHz.toLocaleString("pt-PT") : "—"}</TableCell>
                                                        <TableCell className="text-sm text-ship-cove-500 dark:text-ship-cove-400">{s.notes && s.notes.length ? s.notes.join("; ") : "—"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredIARU.length === 0 && <p className="text-sm text-ship-cove-500 dark:text-ship-cove-400">Sem resultados para &quot;{query}&quot;.</p>}
                </TabsContent>

                <TabsContent value="power">
                    <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-white dark:bg-ship-cove-950/50 shadow-sm">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60" />
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
                                    <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-ship-cove-900 dark:text-ship-cove-100">Potências máximas permitidas (Portugal)</h3>
                                    <p className="text-sm text-ship-cove-500 dark:text-ship-cove-400">Anexo 6 QNAF — Limites de potência por banda e categoria</p>
                                </div>
                            </div>
                            <Tabs defaultValue="cat1" className="w-full">
                                <TabsList className="bg-ship-cove-100 dark:bg-ship-cove-800/50 mb-4">
                                    <TabsTrigger value="cat1">Categoria 1</TabsTrigger>
                                    <TabsTrigger value="cat2">Categoria 2</TabsTrigger>
                                </TabsList>
                                <TabsContent value="cat1">
                                    {renderPowerBars(filteredPower1)}
                                    <div className="w-full overflow-x-auto rounded-xl border border-ship-cove-200 dark:border-ship-cove-800 mt-6">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-ship-cove-50 dark:bg-ship-cove-900/50">
                                                    <TableHead className="font-semibold text-ship-cove-700 dark:text-ship-cove-300">Intervalo (MHz)</TableHead>
                                                    <TableHead className="font-semibold text-ship-cove-700 dark:text-ship-cove-300">Potência máx.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredPower1.slice().sort((a, b) => a.fromMHz - b.fromMHz).map((p, idx) => (
                                                    <TableRow key={idx} className="hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/30">
                                                        <TableCell className="font-mono text-sm text-ship-cove-700 dark:text-ship-cove-300">{fmtRangeMHz(p.fromMHz, p.toMHz)}</TableCell>
                                                        <TableCell className="font-semibold text-ship-cove-900 dark:text-ship-cove-100">{p.power}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {filteredPower1.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="text-sm text-ship-cove-500 dark:text-ship-cove-400">Sem resultados para &quot;{query}&quot;.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                                <TabsContent value="cat2">
                                    {renderPowerBars(filteredPower2)}
                                    <div className="w-full overflow-x-auto rounded-xl border border-ship-cove-200 dark:border-ship-cove-800 mt-6">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-ship-cove-50 dark:bg-ship-cove-900/50">
                                                    <TableHead className="font-semibold text-ship-cove-700 dark:text-ship-cove-300">Intervalo (MHz)</TableHead>
                                                    <TableHead className="font-semibold text-ship-cove-700 dark:text-ship-cove-300">Potência máx.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredPower2.slice().sort((a, b) => a.fromMHz - b.fromMHz).map((p, idx) => (
                                                    <TableRow key={idx} className="hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/30">
                                                        <TableCell className="font-mono text-sm text-ship-cove-700 dark:text-ship-cove-300">{fmtRangeMHz(p.fromMHz, p.toMHz)}</TableCell>
                                                        <TableCell className="font-semibold text-ship-cove-900 dark:text-ship-cove-100">{p.power}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {filteredPower2.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="text-sm text-ship-cove-500 dark:text-ship-cove-400">Sem resultados para &quot;{query}&quot;.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Disclaimer */}
            <div className="mt-8 flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                    Esta visualização é meramente informativa. Verifique sempre o QNAF/ANACOM, o plano IARU e as condições da sua licença antes de operar.
                </p>
            </div>
        </div>
    );
}
