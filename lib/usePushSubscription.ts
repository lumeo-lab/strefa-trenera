'use client'

import { useState, useCallback } from 'react'

export function usePushSubscription(userId: string, userType: 'coach' | 'athlete') {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && typeof Notification !== 'undefined') {
      return Notification.permission
    }
    return 'default'
  })

  const subscribe = useCallback(async () => {
    if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') return

      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, userId, userType }),
      })
    } catch {
      // Silent — push not supported or denied
    }
  }, [userId, userType])

  return { permission, subscribe }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
