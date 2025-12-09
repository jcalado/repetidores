'use client'

import { MapPin, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import * as React from 'react'
import { useUserLocation } from '@/contexts/UserLocationContext'

const STORAGE_KEY = 'location-tip-dismissed'

export default function LocationTip() {
  const t = useTranslations('locationTip')
  const { userLocation } = useUserLocation()
  const [isDismissed, setIsDismissed] = React.useState(true) // Start hidden to avoid flash

  React.useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    setIsDismissed(dismissed === 'true')
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsDismissed(true)
  }

  // Don't show if user already has location set or has dismissed
  if (userLocation || isDismissed) {
    return null
  }

  return (
    <div className="mb-4 relative overflow-hidden rounded-xl border border-ship-cove-200 bg-gradient-to-r from-ship-cove-50 to-blue-50 dark:border-ship-cove-800/50 dark:from-ship-cove-950/40 dark:to-blue-950/30">
      <div className="p-4 pr-12">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-900/50">
              <MapPin className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-ship-cove-900 dark:text-ship-cove-200">
              {t('title')}
            </h4>
            <p className="mt-1 text-sm text-ship-cove-700/80 dark:text-ship-cove-300/80 leading-relaxed">
              {t('description')}
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-md text-ship-cove-400 hover:text-ship-cove-600 hover:bg-ship-cove-100 dark:text-ship-cove-500 dark:hover:text-ship-cove-300 dark:hover:bg-ship-cove-900/50 transition-colors"
        title={t('dismiss')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
