'use client'

import { startTransition, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'
import { INPUT_STYLE } from '@/lib/styles'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'
import { markAthleteThreadRead, sendAthleteMessage } from '@/lib/actions/messages'
import { usePushSubscription } from '@/lib/usePushSubscription'
import type { AthleteMessageRow } from '@/lib/athlete-data'

interface Props {
  athlete: AthleteSession
  messages: AthleteMessageRow[]
  coachName: string
}

export function AthleteChatPage({ athlete, messages, coachName }: Props) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { permission, subscribe } = usePushSubscription(athlete.id, 'athlete', athlete.slug)

  // Poll for new messages every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => router.refresh())
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

    const hasUnreadFromCoach = messages.some(msg => msg.sender_type === 'coach' && !msg.read)
    if (!hasUnreadFromCoach) return

    const timeout = window.setTimeout(() => {
      void markAthleteThreadRead(athlete.slug)
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [messages, athlete.slug])

  const coachInitials = coachName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleSend() {
    if (!input.trim() || sending) return
    const content = input.trim()
    setSending(true)
    setSendError(false)
    setInput('')
    try {
      await sendAthleteMessage(athlete.slug, content)
      startTransition(() => router.refresh())
    } catch {
      setInput(content)
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b shrink-0" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Avatar initials={coachInitials} size="sm" />
          <div>
            <div className="font-semibold text-sm">{coachName}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Twój trener</div>
          </div>
        </div>
      </div>

      {/* Push notification prompt */}
      {permission === 'default' && (
        <button onClick={subscribe}
          className="mx-5 mt-3 px-4 py-2.5 rounded-xl text-sm text-left w-[calc(100%-40px)] cursor-pointer"
          style={{ background: 'rgba(255,92,27,0.1)', border: '1px solid rgba(255,92,27,0.3)', color: '#FF5C1B' }}>
          🔔 Włącz powiadomienia o nowych wiadomościach
        </button>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ paddingBottom: '90px' }}>
        {messages.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
            Brak wiadomości. Napisz do trenera!
          </div>
        )}
        {messages.map(msg => {
          const isAthlete = msg.sender_type === 'athlete'
          return (
            <div key={msg.id} className={`flex gap-3 ${isAthlete ? 'flex-row-reverse' : ''}`}>
              <Avatar initials={isAthlete ? athlete.avatar : coachInitials} size="sm" />
              <div className={`max-w-xs flex flex-col gap-1 ${isAthlete ? 'items-end' : 'items-start'}`}>
                <div className="px-4 py-3 rounded-2xl text-sm"
                  style={{
                    background: isAthlete ? '#FF5C1B' : 'var(--bg-elevated)',
                    color: isAthlete ? 'white' : 'var(--text-primary)',
                    borderRadius: isAthlete ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  }}>
                  {msg.content}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(msg.created_at)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-base)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', marginBottom: '64px' }}>
        {sendError && (
          <div className="text-xs mb-2 px-1" style={{ color: '#E74C3C' }}>
            Nie udało się wysłać wiadomości. Spróbuj ponownie.
          </div>
        )}
        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setSendError(false) }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={`Napisz do ${coachName}...`}
            className="flex-1 px-4 py-3 rounded-2xl text-sm"
            style={INPUT_STYLE}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sending}>
            {sending ? '...' : 'Wyślij'}
          </Button>
        </div>
      </div>

      <AthleteBottomNav slug={athlete.slug} />
    </div>
  )
}
