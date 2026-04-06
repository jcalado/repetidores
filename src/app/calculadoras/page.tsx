"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { StandardPageHeader } from "@/components/ui/PageHeader";
import { Calculator, Gauge, Cable, Waves, Zap, MapPin, Eye } from "lucide-react";

const calculators = [
  { id: "db", href: "/calculadoras/db", icon: Calculator },
  { id: "swr", href: "/calculadoras/swr", icon: Gauge },
  { id: "coax", href: "/calculadoras/coax", icon: Cable },
  { id: "frequencia", href: "/calculadoras/frequencia", icon: Waves },
  { id: "power", href: "/calculadoras/power", icon: Zap },
  { id: "distance", href: "/calculadoras/distance", icon: MapPin },
  { id: "los", href: "/calculadoras/los", icon: Eye },
];

export default function CalculadorasPage() {
  const t = useTranslations("calculadoras");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <StandardPageHeader
        icon={<Calculator className="h-7 w-7" />}
        title={t("title")}
        description={t("subtitle")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {calculators.map((calc) => (
          <Link
            key={calc.id}
            href={calc.href}
            className="group flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-4 py-4 transition-all duration-150 hover:border-ship-cove-300 hover:bg-ship-cove-50/50 dark:hover:border-ship-cove-700 dark:hover:bg-ship-cove-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ship-cove-500"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors duration-150 group-hover:bg-ship-cove-100 dark:group-hover:bg-ship-cove-900/40">
              <calc.icon className="h-5 w-5 text-slate-500 dark:text-slate-400 transition-colors duration-150 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-ship-cove-700 dark:group-hover:text-ship-cove-300 transition-colors duration-150 break-words">
                {t(`${calc.id}.title`)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                {t(`${calc.id}.shortDesc`)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
