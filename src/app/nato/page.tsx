'use client';

import { StandardPageHeader } from "@/components/ui/PageHeader"
import { Keyboard, Volume2 } from "lucide-react"
import { NATOAlphabetTrainer } from "@/components/nato/NATOAlphabetTrainer"

export default function NATOPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <StandardPageHeader
        icon={<Keyboard className="h-7 w-7" />}
        title="Alfabeto Fonético NATO"
        description="Aprenda o alfabeto usado em comunicações de rádio"
        floatingIcons={[
          <Keyboard key="keyboard" className="h-12 w-12 text-white" />,
          <Volume2 key="volume" className="h-10 w-10 text-white" />,
        ]}
      />

      <NATOAlphabetTrainer />
    </main>
  )
}
