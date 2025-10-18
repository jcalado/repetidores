"use client"

import { useTranslations } from 'next-intl'
import HamRadioEventsCountdown from '@/components/HamRadioEventsCountdown'

export default function EventsPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-background">
      <HamRadioEventsCountdown />
    </div>
  )
}
