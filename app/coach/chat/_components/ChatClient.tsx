'use client'

import { useState, startTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'
import { sendMessage } from '@/lib/actions/messages'
import { usePushSubscription } from '@/lib/usePushSubscription'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChatClient({ athletes, messages, coachId, coachName }: { athletes: any[]; messages: any[]; coachId: string; coachName: string }) {
  const router = useRouter()
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id ?? '')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  usePushSubscription(coachId, 'coach')

  // Poll for new messages every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => router.refresh())
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  const threadMessages = messages.filter(m => m.athlete_id === selectedAthleteId)
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages.length])

  async function handleSend() {
    if (!input.trim() || !selectedAthleteId || sending) return
    setSending(true)
    const fd = new FormData()
    fd.set('athlete_id', selectedAthleteId)
    fd.set('content', input.trim())
    fd.set('coach_name', coachName)
    await sendMessage(null, fd)
    setInput('')
    setSending(false)
    startTransition(() => router.refresh())
  }

  if (athletes.length === 0) {
    return (
      <div>
        <CoachTopbar title="Czat" subtitle="Rozmowy z zawodnikami" />
        <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--text-muted)' }}>
          Brak zawodników. Dodaj zawodnika, aby rozpocząć czat.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Athlete list */}
      <div className="w-64 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="font-semibold text-sm">Czat</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Rozmowy z zawodnikami</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {athletes.map(athlete => {
            const isActive = athlete.id === selectedAthleteId
            const lastMsg = messages.filter(m => m.athlete_id === athlete.id).at(-1)
            return (
              <button key={athlete.id} onClick={() => setSelectedAthleteId(athlete.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
                style={{ background: isActive ? 'rgba(255,92,27,0.08)' : undefined, borderLeft: isActive ? '2px solid #FF5C1B' : '2px solid transparent' }}>
                <Avatar initials={athlete.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{athlete.name}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {lastMsg ? lastMsg.content.slice(0, 30) + (lastMsg.content.length > 30 ? '...' : '') : athlete.goal || 'Brak wiadomości'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}>
          {selectedAthlete && (
            <>
              <Avatar initials={selectedAthlete.avatar} size="sm" />
              <div>
                <div className="font-semibold text-sm">{selectedAthlete.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedAthlete.package} · {selectedAthlete.goal}</div>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {threadMessages.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              Brak wiadomości. Napisz pierwszą!
            </div>
          )}
          {threadMessages.map(msg => {
            const isCoach = msg.sender_type === 'coach'
            return (
              <div key={msg.id} className={`flex gap-3 ${isCoach ? 'flex-row-reverse' : ''}`}>
                <Avatar initials={isCoach ? (coachName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?') : (selectedAthlete?.avatar || '?')} size="sm" />
                <div className={`max-w-sm ${isCoach ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className="px-4 py-3 rounded-2xl text-sm"
                    style={{
                      background: isCoach ? '#FF5C1B' : 'var(--bg-elevated)',
                      color: isCoach ? 'white' : 'var(--text-primary)',
                      borderRadius: isCoach ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
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
        <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Napisz do ${selectedAthlete?.name ?? 'zawodnika'}...`}
              className="flex-1 px-4 py-3 rounded-2xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
            />
            <Button onClick={handleSend} disabled={!input.trim() || sending}>
              {sending ? '...' : 'Wyślij'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
