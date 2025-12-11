"use client";

import { FileText } from "lucide-react";
import { SectionCard } from "./SectionCard";

interface NotesSectionProps {
  notes?: string;
}

/**
 * Notes section displaying repeater notes.
 * Returns null if no notes are available.
 */
export function NotesSection({ notes }: NotesSectionProps) {
  if (!notes) {
    return null;
  }

  return (
    <SectionCard icon={FileText} title="Notas">
      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
        {notes}
      </p>
    </SectionCard>
  );
}
