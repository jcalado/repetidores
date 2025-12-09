'use client'

import { useState, useEffect, useCallback } from 'react'

const API_BASE_URL = (() => {
  const source =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000'
      : process.env.PAYLOAD_API_BASE_URL || process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000'
  return source.replace(/\/$/, '')
})()

interface PushState {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  permission: NotificationPermission | null
}

interface SubscribeOptions {
  topics?: ('events' | 'status' | 'repeaters')[]
  location?: {
    latitude: number
    longitude: number
    radiusKm?: number
  }
  favoriteRepeaters?: string[]
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    error: null,
    permission: null,
  })

  // Check if push is supported and current subscription status
  useEffect(() => {
    async function checkSupport() {
      // Check browser support
      const supported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window

      if (!supported) {
        setState({
          isSupported: false,
          isSubscribed: false,
          isLoading: false,
          error: null,
          permission: null,
        })
        return
      }

      try {
        // Register service worker if not already registered
        const registration = await navigator.serviceWorker.register('/sw-push.js')
        await navigator.serviceWorker.ready

        // Check current subscription
        const subscription = await registration.pushManager.getSubscription()

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          isLoading: false,
          error: null,
          permission: Notification.permission,
        })
      } catch (error) {
        console.error('Error checking push support:', error)
        setState({
          isSupported: true,
          isSubscribed: false,
          isLoading: false,
          error: 'Failed to initialize push notifications',
          permission: Notification.permission,
        })
      }
    }

    checkSupport()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async (options: SubscribeOptions = {}) => {
    if (!state.isSupported) {
      throw new Error('Push notifications not supported')
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          permission,
          error: 'Notification permission denied',
        }))
        return false
      }

      // Get VAPID public key from server
      const vapidResponse = await fetch(`${API_BASE_URL}/api/push/vapid-public-key`)
      if (!vapidResponse.ok) {
        throw new Error('Push notifications not configured on server')
      }
      const { publicKey } = await vapidResponse.json()

      if (!publicKey) {
        throw new Error('VAPID public key not available')
      }

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as Uint8Array<ArrayBuffer>,
      })

      // Send subscription to server
      const response = await fetch(`${API_BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          topics: options.topics || ['events', 'status'],
          location: options.location,
          favoriteRepeaters: options.favoriteRepeaters,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        permission: 'granted',
      }))

      return true
    } catch (error) {
      console.error('Error subscribing to push:', error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe',
      }))
      return false
    }
  }, [state.isSupported])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe()

        // Remove from server
        await fetch(`${API_BASE_URL}/api/push/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }))

      return true
    } catch (error) {
      console.error('Error unsubscribing from push:', error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe',
      }))
      return false
    }
  }, [])

  // Update subscription options (topics, location, favorites)
  const updateOptions = useCallback(async (options: SubscribeOptions) => {
    if (!state.isSubscribed) {
      // If not subscribed, subscribe with the new options
      return subscribe(options)
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        throw new Error('No active subscription')
      }

      // Update options on server
      const response = await fetch(`${API_BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          ...options,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      setState((prev) => ({ ...prev, isLoading: false }))
      return true
    } catch (error) {
      console.error('Error updating push options:', error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update options',
      }))
      return false
    }
  }, [state.isSubscribed, subscribe])

  return {
    ...state,
    subscribe,
    unsubscribe,
    updateOptions,
  }
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
