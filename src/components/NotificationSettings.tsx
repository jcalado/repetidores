'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import * as React from 'react'

export default function NotificationSettings() {
  const t = useTranslations('notifications')
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    permission,
    subscribe,
    unsubscribe,
    updateOptions,
  } = usePushNotifications()

  const [open, setOpen] = React.useState(false)
  const [topics, setTopics] = React.useState<string[]>(['events', 'status'])

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe({ topics: topics as ('events' | 'status' | 'repeaters')[] })
    }
  }

  const handleTopicChange = (topic: string, checked: boolean) => {
    const newTopics = checked
      ? [...topics, topic]
      : topics.filter((t) => t !== topic)
    setTopics(newTopics)

    if (isSubscribed) {
      updateOptions({ topics: newTopics as ('events' | 'status' | 'repeaters')[] })
    }
  }

  if (!isSupported) {
    return null // Don't show anything if not supported
  }

  // Simple button for non-subscribed state
  if (!isSubscribed && !open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        disabled={isLoading || permission === 'denied'}
        title={permission === 'denied' ? t('permissionDenied') : t('enable')}
        className="relative"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title={isSubscribed ? t('settings') : t('enable')}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <>
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500" />
            </>
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error display */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Permission denied warning */}
          {permission === 'denied' && (
            <div className="rounded-md bg-amber-100 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-200">
              {t('permissionDenied')}
            </div>
          )}

          {/* Topic selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="events" className="font-medium">
                  {t('topics.events')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('topics.eventsDesc')}</p>
              </div>
              <Switch
                id="events"
                checked={topics.includes('events')}
                onCheckedChange={(checked) => handleTopicChange('events', checked)}
                disabled={!isSubscribed && isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="status" className="font-medium">
                  {t('topics.status')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('topics.statusDesc')}</p>
              </div>
              <Switch
                id="status"
                checked={topics.includes('status')}
                onCheckedChange={(checked) => handleTopicChange('status', checked)}
                disabled={!isSubscribed && isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="repeaters" className="font-medium">
                  {t('topics.repeaters')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('topics.repeatersDesc')}</p>
              </div>
              <Switch
                id="repeaters"
                checked={topics.includes('repeaters')}
                onCheckedChange={(checked) => handleTopicChange('repeaters', checked)}
                disabled={!isSubscribed && isLoading}
              />
            </div>
          </div>

          {/* Subscribe/Unsubscribe button */}
          <Button
            onClick={handleToggle}
            disabled={isLoading || permission === 'denied'}
            variant={isSubscribed ? 'outline' : 'default'}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : isSubscribed ? (
              t('disable')
            ) : (
              t('enable')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
