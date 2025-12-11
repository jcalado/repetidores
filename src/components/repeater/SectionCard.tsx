import type { ComponentType, ReactNode } from "react";

interface SectionCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}

/**
 * Generic card wrapper for content sections with icon and title header.
 */
export function SectionCard({ icon: Icon, title, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b bg-muted/30">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="p-2 sm:p-3">{children}</div>
    </div>
  );
}
