"use client";

import { Tabs } from "@/components/ui/tabs";
import { ViewSwitcherTabsList } from "@/components/ui/view-switcher-tabs";
import { MapIcon, TableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export default function ViewSwitcher() {
  const t = useTranslations();
  const pathname = usePathname() ?? "";
  const view: "table" | "map" = pathname.includes("/repetidores/mapa") ? "map" : "table";

  return (
    <Tabs value={view} className="mb-4">
      <ViewSwitcherTabsList
        value={view}
        ariaLabel={t("nav.table") + " / " + t("nav.map")}
        items={[
          { value: "table", label: t("nav.table"), icon: <TableIcon />, href: "/repetidores" },
          { value: "map", label: t("nav.map"), icon: <MapIcon />, href: "/repetidores/mapa" },
        ]}
      />
    </Tabs>
  );
}
