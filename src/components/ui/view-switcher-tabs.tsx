"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import * as React from "react";

export type ViewSwitcherItem = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** When set, the trigger navigates to this route (route mode, e.g. /repetidores ↔ /repetidores/mapa). */
  href?: string;
  /** Hide the text label below the `sm` breakpoint (icon-only on mobile). */
  hideLabelOnMobile?: boolean;
};

// Matches the /repetidores ViewSwitcher pill triggers exactly.
const TRIGGER_CLASS =
  "relative z-10 rounded-full px-3.5 h-9 border border-transparent bg-transparent text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-transparent data-[state=active]:text-foreground transition-colors";

/**
 * Animated sliding-pill tab list — the /repetidores ↔ /repetidores/mapa switcher style.
 *
 * Render it INSIDE a `<Tabs value=...>` so the active pill tracks the Tabs value:
 * - controlled state tabs: `<Tabs value={view} onValueChange={...}>` + omit `href` per item.
 * - route tabs: `<Tabs value={view}>` + set `href` per item (navigates via <Link>).
 */
export function ViewSwitcherTabsList({
  value,
  items,
  className,
  ariaLabel,
}: {
  value: string;
  items: ViewSwitcherItem[];
  className?: string;
  ariaLabel?: string;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const triggerRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const [pill, setPill] = React.useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  React.useEffect(() => {
    const measure = () => {
      const list = listRef.current;
      const active = triggerRefs.current[value];
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
    Object.values(triggerRefs.current).forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [value, items]);

  return (
    <TabsList
      ref={listRef}
      aria-label={ariaLabel}
      className={`relative bg-muted p-1 h-auto gap-1 rounded-full ${className ?? ""}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1 bottom-1 rounded-full bg-card border border-azulejo-200 shadow-sm transition-[transform,width,opacity] duration-300 ease-out ${
          pill.ready ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: `${pill.width}px`, transform: `translateX(${pill.left}px)`, left: 0 }}
      />
      {items.map((item) => {
        const label = item.hideLabelOnMobile ? (
          <span className="hidden sm:inline">{item.label}</span>
        ) : (
          item.label
        );
        if (item.href) {
          return (
            <TabsTrigger key={item.value} value={item.value} asChild className={TRIGGER_CLASS}>
              <Link
                ref={(el) => {
                  triggerRefs.current[item.value] = el;
                }}
                href={item.href}
              >
                {item.icon}
                {label}
              </Link>
            </TabsTrigger>
          );
        }
        return (
          <TabsTrigger
            key={item.value}
            value={item.value}
            ref={(el) => {
              triggerRefs.current[item.value] = el;
            }}
            className={TRIGGER_CLASS}
          >
            {item.icon}
            {label}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
