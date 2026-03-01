'use client';

import dynamic from "next/dynamic"
import { Activity, Waves } from "lucide-react"
import { StandardPageHeader } from "@/components/ui/PageHeader"

const PropagationStatus = dynamic(
  () => import("@/components/propagation/PropagationStatus").then((mod) => ({ default: mod.PropagationStatus })),
  { ssr: false }
)

export default function PropagationClient() {
  return (
    <>
      <StandardPageHeader
        icon={<Activity className="h-7 w-7" />}
        title="Propagação"
        description="Condições em tempo real para Portugal"
        floatingIcons={[
          <Activity key="activity" className="h-12 w-12 text-white" />,
          <Waves key="waves" className="h-10 w-10 text-white" />,
        ]}
      />

      <PropagationStatus />
    </>
  )
}
