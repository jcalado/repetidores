'use client';

import { StandardPageHeader } from "@/components/ui/PageHeader"
import { Radio, Ruler } from "lucide-react"
import { AntennaCalculator } from "@/components/antenna/AntennaCalculator"

export default function AntennaPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <StandardPageHeader
        icon={<Radio className="h-7 w-7" />}
        title="Calculadora de Antenas"
        description="Calcule comprimentos de antenas para diferentes frequências"
        floatingIcons={[
          <Radio key="radio" className="h-12 w-12 text-white" />,
          <Ruler key="ruler" className="h-10 w-10 text-white" />,
        ]}
      />

      <AntennaCalculator />
    </main>
  )
}
