"use client"

import * as React from "react"
import RepeaterBrowser from "@/components/RepeaterBrowser"
import { Repeater } from "@/app/columns"

type Props = {
  data: Repeater[]
}

export default function RepeaterBrowserClient({ data }: Props) {
  const [activeTab, setActiveTab] = React.useState("table")

  // Handle URL hash changes to sync with navigation
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) // Remove the '#'
      if (hash === "tabela") {
        setActiveTab("table")
      } else if (hash === "mapa") {
        setActiveTab("map")
      }
    }

    // Check initial hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Update URL hash
    const hash = tab === "table" ? "tabela" : "mapa"
    window.history.replaceState(null, "", `#${hash}`)
  }

  return (
    <RepeaterBrowser
      data={data}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  )
}
