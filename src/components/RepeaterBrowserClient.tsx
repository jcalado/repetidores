"use client"

import * as React from "react"
import RepeaterBrowser from "@/components/RepeaterBrowser"
import { Repeater } from "@/app/columns"
import { fetchRepeaters } from "@/lib/repeaters"

type Props = {
  data: Repeater[]
}

export default function RepeaterBrowserClient({ data: initialData }: Props) {
  const [repeaters, setRepeaters] = React.useState<Repeater[]>(initialData)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  const [activeTab, setActiveTab] = React.useState("table")
  const [initialRepeater, setInitialRepeater] = React.useState<string | null>(null)

  // Refresh repeaters from API
  const refreshRepeaters = React.useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsRefreshing(true)
    setFetchError(null)
    try {
      const data = await fetchRepeaters()
      setRepeaters(data)
    } catch (err) {
      console.error('Failed to refresh repeaters:', err)
      setFetchError('Failed to refresh repeaters')
      // Keep showing current data
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Fetch fresh data on mount
  React.useEffect(() => {
    refreshRepeaters(false)
  }, [refreshRepeaters])

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

  // Handle URL search params for deep linking to specific repeater
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const repeaterParam = params.get("repeater")
    if (repeaterParam) {
      setInitialRepeater(repeaterParam.toUpperCase())
    }
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Update URL hash
    const hash = tab === "table" ? "tabela" : "mapa"
    window.history.replaceState(null, "", `#${hash}`)
  }

  // Clear the initial repeater after it's been used
  const handleRepeaterOpened = React.useCallback(() => {
    setInitialRepeater(null)
    // Clear the URL parameter without refreshing
    const url = new URL(window.location.href)
    url.searchParams.delete("repeater")
    window.history.replaceState(null, "", url.pathname + url.hash)
  }, [])

  return (
    <>
      <RepeaterBrowser
        data={repeaters}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        initialRepeaterCallsign={initialRepeater}
        onInitialRepeaterOpened={handleRepeaterOpened}
        isRefreshing={isRefreshing}
        onRefresh={() => refreshRepeaters(true)}
      />
      {fetchError && (
        <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">{fetchError}</div>
      )}
    </>
  )
}
