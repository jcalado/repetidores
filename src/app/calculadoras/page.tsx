"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator, Gauge, Cable, Waves, Zap, MapPin } from "lucide-react";

const calculators = [
  {
    id: "db",
    href: "/calculadoras/db",
    icon: Calculator,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "swr",
    href: "/calculadoras/swr",
    icon: Gauge,
    gradient: "from-orange-500 to-red-600",
  },
  {
    id: "coax",
    href: "/calculadoras/coax",
    icon: Cable,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "frequencia",
    href: "/calculadoras/frequencia",
    icon: Waves,
    gradient: "from-purple-500 to-violet-600",
  },
  {
    id: "power",
    href: "/calculadoras/power",
    icon: Zap,
    gradient: "from-yellow-500 to-orange-600",
  },
  {
    id: "distance",
    href: "/calculadoras/distance",
    icon: MapPin,
    gradient: "from-teal-500 to-emerald-600",
  },
];

export default function CalculadorasPage() {
  const t = useTranslations("calculadoras");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {t("title")}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {calculators.map((calc) => (
          <Link key={calc.id} href={calc.href}>
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${calc.gradient} text-white shadow-lg`}
                  >
                    <calc.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>{t(`${calc.id}.title`)}</CardTitle>
                    <CardDescription>{t(`${calc.id}.shortDesc`)}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
