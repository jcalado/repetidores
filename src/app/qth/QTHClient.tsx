'use client';

import dynamic from "next/dynamic"
import { MapPin, Grid3X3 } from "lucide-react"
import { StandardPageHeader } from "@/components/ui/PageHeader"

const QTHLocatorCalculator = dynamic(
  () => import("@/components/QTHLocatorCalculator"),
  { ssr: false }
)

export default function QTHClient() {
  return (
    <>
      <StandardPageHeader
        icon={<Grid3X3 className="h-7 w-7" />}
        title="Localizador QTH"
        description="Calcule o seu localizador Maidenhead a partir de coordenadas"
        floatingIcons={[
          <Grid3X3 key="grid" className="h-12 w-12 text-white" />,
          <MapPin key="pin" className="h-10 w-10 text-white" />,
        ]}
      />

      <QTHLocatorCalculator />
    </>
  )
}
