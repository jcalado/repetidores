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
            className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-4 transition-all duration-150 hover:border-azulejo-300 hover:bg-azulejo-50/50 dark:hover:border-azulejo-700 dark:hover:bg-azulejo-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors duration-150 group-hover:bg-azulejo-100 dark:group-hover:bg-azulejo-900/40">
              <calc.icon className="h-5 w-5 text-muted-foreground transition-colors duration-150 group-hover:text-azulejo-600 dark:group-hover:text-azulejo-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground group-hover:text-azulejo-700 dark:group-hover:text-azulejo-300 transition-colors duration-150 break-words">
                {t(`${calc.id}.title`)}
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {t(`${calc.id}.shortDesc`)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
