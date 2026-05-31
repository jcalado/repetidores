"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapIcon, TableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

export default function ViewSwitcher() {
  const t = useTranslations();
  const pathname = usePathname() ?? "";
  const view: "table" | "map" = pathname.includes("/repetidores/mapa") ? "map" : "table";

  const listRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLAnchorElement>(null);
  const mapRef = React.useRef<HTMLAnchorElement>(null);
  const [pill, setPill] = React.useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  React.useEffect(() => {
    const measure = () => {
      const list = listRef.current;
      const active = view === "table" ? tableRef.current : mapRef.current;
      if (!list || !active) return;
      const listRect = list.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      setPill({
        left: activeRect.left - listRect.left,
        width: activeRect.width,
        ready: true,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    if (tableRef.current) ro.observe(tableRef.current);
    if (mapRef.current) ro.observe(mapRef.current);
    return () => ro.disconnect();
  }, [view]);

  return (
    <Tabs value={view} className="mb-4">
      <TabsList ref={listRef} className="relative bg-transparent p-0 h-auto gap-1.5 rounded-none">
        <span
          aria-hidden
          className={`pointer-events-none absolute top-0 bottom-0 rounded-full bg-card border border-azulejo-200 shadow-sm transition-[transform,width,opacity] duration-300 ease-out ${
            pill.ready ? "opacity-100" : "opacity-0"
          }`}
          style={{
            width: `${pill.width}px`,
            transform: `translateX(${pill.left}px)`,
            left: 0,
          }}
        />
        <TabsTrigger
          value="table"
          asChild
          className="relative z-10 rounded-full px-3.5 h-9 border border-transparent bg-transparent text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-transparent data-[state=active]:text-foreground transition-colors"
        >
          <Link ref={tableRef} href="/repetidores">
            <TableIcon />
            {t("nav.table")}
          </Link>
        </TabsTrigger>
        <TabsTrigger
          value="map"
          asChild
          className="relative z-10 rounded-full px-3.5 h-9 border border-transparent bg-transparent text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-transparent data-[state=active]:text-foreground transition-colors"
        >
          <Link ref={mapRef} href="/repetidores/mapa">
            <MapIcon />
            {t("nav.map")}
          </Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
