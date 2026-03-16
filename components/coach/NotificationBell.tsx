'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUnreadNotifications, markNotificationsRead } from '@/lib/actions/notifications'
import { formatDate, getInitials } from '@/lib/utils'

type Notification = {
  id: string
  athlete_name: string
  source: string
  ai_summary: string
  created_at: string
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getUnreadNotifications().then(setNotifications)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleNotificationClick(id: string) {
    await markNotificationsRead([id])
    setNotifications(prev => prev.filter(n => n.id !== id))
    setOpen(false)
    router.push('/coach/feedback')
  }

  async function handleMarkAll() {
    const ids = notifications.map(n => n.id)
    await markNotificationsRead(ids)
    setNotifications([])
    setOpen(false)
  }

  const count = notifications.length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl transition-colors cursor-pointer"
        style={{ background: open ? 'var(--bg-hover)' : undefined, color: 'var(--text-muted)' }}
        title="Powiadomienia"
        aria-label="Powiadomienia"
      >
        🔔
        {count > 0 && (
          <span
            className="absolute flex items-center justify-center text-white font-bold rounded-full"
            style={{
              top: 4, right: 4,
              minWidth: 16, height: 16,
              fontSize: 9,
              background: '#FF5C1B',
              lineHeight: 1,
              padding: '0 3px',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            top: 'calc(100% + 8px)',
            width: 340,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Powiadomienia {count > 0 && <span style={{ color: '#FF5C1B' }}>({count})</span>}
            </span>
            {count > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                Oznacz wszystkie
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {count === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Brak nowych powiadomień
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id)}
                  className="w-full text-left flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--border)', background: 'rgba(255,92,27,0.04)' }}
                >
                  {/* Avatar */}
                  <div
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #FF5C1B, #CC3A00)' }}
                  >
                    {getInitials(n.athlete_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {n.athlete_name}
                      </span>
                      <span className="text-xs shrink-0">{n.source === 'voice' ? '🎤' : '📝'}</span>
                    </div>
                    {n.ai_summary && (
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {n.ai_summary}
                      </p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                      {formatDate(n.created_at.slice(0, 10))}
                    </p>
                  </div>
                  <div
                    className="shrink-0 w-2 h-2 rounded-full mt-1.5"
                    style={{ background: '#FF5C1B' }}
                  />
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <button
              onClick={() => { setOpen(false); router.push('/coach/feedback') }}
              className="w-full text-center text-sm py-3 cursor-pointer transition-colors hover:opacity-80"
              style={{ color: '#FF5C1B', fontWeight: 500 }}
            >
              Zobacz wszystkie feedbacki →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
