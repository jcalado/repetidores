// Service Worker for Push Notifications
// This handles incoming push events and notification clicks

self.addEventListener('push', function (event) {
  if (!event.data) {
    console.warn('Push event received but no data')
    return
  }

  try {
    const data = event.data.json()

    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      tag: data.data?.tag || 'default',
      renotify: true,
      data: data.data || {},
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'open',
          title: 'Abrir',
        },
        {
          action: 'close',
          title: 'Fechar',
        },
      ],
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Radioamador.info', options)
    )
  } catch (error) {
    console.error('Error processing push event:', error)
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  // Open the URL from the notification data, or default to home
  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Handle subscription change (browser regenerated keys)
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then(function (subscription) {
        // Re-register with the server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        })
      })
  )
})
