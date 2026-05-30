'use client';

import { useState } from "react"
import dynamic from "next/dynamic"
import { Satellite } from "lucide-react"
import { StandardPageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent } from "@/components/ui/card"

const SatelliteTracker = dynamic(
  () => import("@/components/satelites/SatelliteTracker").then((mod) => ({ default: mod.SatelliteTracker })),
  { ssr: false }
)

export default function SatelliteTrackerClient() {
  const [satelliteCount, setSatelliteCount] = useState(0)

  return (
    <Card>
      <CardContent>
        <StandardPageHeader
          icon={<Satellite className="h-5 w-5" />}
          title="Satélites"
          description="Rastreio de satélites de radioamador em tempo real com previsão de passagens"
          stats={
            satelliteCount > 0
              ? [
                  {
                    icon: <Satellite className="h-4 w-4" />,
                    value: satelliteCount,
                    label: "satélites",
                  },
                ]
              : undefined
          }
        />

        <SatelliteTracker onSatelliteCount={setSatelliteCount} />
      </CardContent>
    </Card>
  )
}
