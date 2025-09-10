"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onOpenChange]);

  return (
    <div aria-hidden={!open} style={{ display: open ? undefined : "none" }}>
      {children}
    </div>
  );
}

export function DrawerOverlay({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out",
        className
      )}
      onClick={onClick}
    />
  );
}

export function DrawerContent({ className, children, side = "right", open }: { className?: string; children: React.ReactNode; side?: "right" | "bottom"; open?: boolean }) {
  const sideClasses = side === "bottom"
    ? "inset-x-0 bottom-0 h-[85vh] sm:h-[70vh] rounded-t-xl"
    : "inset-y-0 right-0 w-[100vw] sm:w-[520px] md:w-[640px] lg:w-[760px]";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed z-50 bg-background shadow-2xl border",
        sideClasses,
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right",
        // On small screens, use bottom slide
        "sm:data-[state=open]:slide-in-from-right sm:data-[state=closed]:slide-out-to-right",
        "max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom",
        className
      )}
      data-state={open ? "open" : "closed"}
    >
      {children}
    </div>
  );
}

export function DrawerHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-4 sm:p-6 border-b", className)}>{children}</div>;
}

export function DrawerTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-semibold tracking-tight", className)}>{children}</h2>;
}

export function DrawerDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function DrawerBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-4 sm:p-6 overflow-auto h-full", className)}>{children}</div>;
}

export function DrawerFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-4 sm:p-6 border-t flex items-center justify-end gap-2", className)}>{children}</div>;
}

export function DrawerClose({ className, children, onClick }: { className?: string; children?: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={onClick}
    >
      {children ?? "Close"}
    </button>
  );
}

