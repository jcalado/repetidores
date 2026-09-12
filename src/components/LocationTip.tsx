'use client'

import { Loader2, MapPin, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import * as React from 'react'
import LocationPickerDialog from '@/components/LocationPickerDialog'
import { Button } from '@/components/ui/button'
import { useUserLocation } from '@/contexts/UserLocationContext'

const STORAGE_KEY = 'location-tip-dismissed'

export default function LocationTip() {
  const t = useTranslations('locationTip')
  const tLocation = useTranslations('location')
  const { userLocation, isLocating, error, requestLocation, setLocation } =
    useUserLocation()
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
    <div className="mb-4 relative overflow-hidden rounded-xl border border-azulejo-200 bg-azulejo-50 dark:border-azulejo-800/50 dark:bg-azulejo-950/40">
      <div className="p-4 pr-14">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-azulejo-100 dark:bg-azulejo-900/50">
              <MapPin className="h-5 w-5 text-azulejo-600 dark:text-azulejo-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-azulejo-900 dark:text-azulejo-200">
              {t('title')}
            </h4>
            <p className="mt-1 text-sm text-azulejo-700/80 dark:text-azulejo-300/80 leading-relaxed">
              {t('description')}
            </p>
            {error ? (
              <p
                role="status"
                aria-live="polite"
                className="mt-2 text-sm text-destructive"
              >
                {t('errorGeneric')}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => requestLocation()}
                disabled={isLocating}
                className="min-h-11 px-4 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    {tLocation('locating')}
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    {t('action')}
                  </>
                )}
              </Button>
              <div className="[&>button]:min-h-11 [&>button]:px-4 [&>button]:motion-reduce:transition-none">
                <LocationPickerDialog onLocationSelect={setLocation} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-md text-azulejo-400 hover:text-azulejo-600 hover:bg-azulejo-100 dark:text-azulejo-500 dark:hover:text-azulejo-300 dark:hover:bg-azulejo-900/50 transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:ring-[3px] focus-visible:ring-azulejo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        title={t('dismiss')}
        aria-label={t('dismiss')}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
