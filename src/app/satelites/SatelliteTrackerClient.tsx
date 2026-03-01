'use client';

import { useState } from "react"
import dynamic from "next/dynamic"
import { Satellite, Radio } from "lucide-react"
import { StandardPageHeader } from "@/components/ui/PageHeader"

const SatelliteTracker = dynamic(
  () => import("@/components/satelites/SatelliteTracker").then((mod) => ({ default: mod.SatelliteTracker })),
  { ssr: false }
)

export default function SatelliteTrackerClient() {
  const [satelliteCount, setSatelliteCount] = useState(0)

  return (
    <>
      <StandardPageHeader
        icon={<Satellite className="h-7 w-7" />}
        title="Satélites"
        description="Rastreio de satélites de radioamador em tempo real com previsão de passagens"
        stats={satelliteCount > 0 ? [
          { icon: <Satellite className="h-4 w-4" />, value: satelliteCount, label: "satélites" },
        ] : undefined}
        floatingIcons={[
          <Satellite key="satellite" className="h-12 w-12 text-white" />,
          <Radio key="radio" className="h-10 w-10 text-white" />,
        ]}
      />

      <SatelliteTracker onSatelliteCount={setSatelliteCount} />
    </>
  )
}
