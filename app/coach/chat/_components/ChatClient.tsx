'use client'

import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatDateTime, timeAgo } from '@/lib/utils'
import { markCoachThreadRead, sendMessage } from '@/lib/actions/messages'
import { usePushSubscription } from '@/lib/usePushSubscription'
import type { MessageRow } from '@/lib/supabase/database.types'

type ChatAthlete = {
  id: string
  name: string
  avatar: string
  goal: string
  package: string
  slug: string
}

type ThreadInfo = {
  athlete: ChatAthlete
  lastMessage: MessageRow | null
  unreadCount: number
}

export function ChatClient({ athletes, messages, coachId, coachName, initialAthleteId }: {
  athletes: ChatAthlete[]
  messages: MessageRow[]
  coachId: string
  coachName: string
  initialAthleteId?: string
}) {
  const router = useRouter()
  const [selectedAthleteId, setSelectedAthleteId] = useState(initialAthleteId ?? athletes[0]?.id ?? '')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { permission, subscribe } = usePushSubscription(coachId, 'coach')

  useEffect(() => {
    if (initialAthleteId) setSelectedAthleteId(initialAthleteId)
  }, [initialAthleteId])

  // Poll for new messages every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => router.refresh())
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  // Build thread list: sorted by unread first, then by last message time
  const threads: ThreadInfo[] = useMemo(() => {
    const byAthlete = new Map<string, MessageRow[]>()
    for (const m of messages) {
      if (!byAthlete.has(m.athlete_id)) byAthlete.set(m.athlete_id, [])
      byAthlete.get(m.athlete_id)!.push(m)
    }

    return athletes
      .map(athlete => {
        const msgs = byAthlete.get(athlete.id) ?? []
        const lastMessage = msgs.at(-1) ?? null
        const unreadCount = msgs.filter(m => m.sender_type === 'athlete' && !m.read).length
        return { athlete, lastMessage, unreadCount }
      })
      .sort((a, b) => {
        // Unread first
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1
        // Then by last message time (newest first)
        const aTime = a.lastMessage?.created_at ?? ''
        const bTime = b.lastMessage?.created_at ?? ''
        if (aTime > bTime) return -1
        if (aTime < bTime) return 1
        return a.athlete.name.localeCompare(b.athlete.name, 'pl')
      })
  }, [athletes, messages])

  // Filter threads by search
  const filteredThreads = useMemo(() => {
    if (!search.trim()) return threads
    const q = search.toLowerCase()
    return threads.filter(t => t.athlete.name.toLowerCase().includes(q))
  }, [threads, search])

  const totalUnread = useMemo(() => threads.reduce((s, t) => s + t.unreadCount, 0), [threads])

  const threadMessages = messages.filter(m => m.athlete_id === selectedAthleteId)
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages.length])

  useEffect(() => {
    if (!selectedAthleteId) return
    void markCoachThreadRead(selectedAthleteId)
  }, [selectedAthleteId])

  function selectAthlete(id: string) {
    setSelectedAthleteId(id)
    // Focus input when switching threads
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function handleSend() {
    if (!input.trim() || !selectedAthleteId || sending) return
    const content = input.trim()
    setSending(true)
    setInput('')
    try {
      const fd = new FormData()
      fd.set('athlete_id', selectedAthleteId)
      fd.set('content', content)
      fd.set('coach_name', coachName)
      await sendMessage(null, fd)
      startTransition(() => router.refresh())
    } catch {
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  const coachInitials = coachName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?'

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
    <div>
      <CoachTopbar title="Czat" subtitle={totalUnread > 0 ? `${totalUnread} nieprzeczytanych` : `${athletes.length} zawodników`} />

      <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>

        {/* ── Sidebar: thread list ── */}
        <div className="w-72 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          {/* Search */}
          <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj zawodnika..."
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Thread list */}
          <div className="overflow-y-auto flex-1">
            {filteredThreads.length === 0 && (
              <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                Brak wyników
              </div>
            )}
            {filteredThreads.map(({ athlete, lastMessage, unreadCount }) => {
              const isActive = athlete.id === selectedAthleteId
              return (
                <button key={athlete.id} onClick={() => selectAthlete(athlete.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer"
                  style={{
                    background: isActive ? 'rgba(255,92,27,0.08)' : undefined,
                    borderLeft: isActive ? '3px solid #FF5C1B' : '3px solid transparent',
                  }}>
                  <div className="relative shrink-0">
                    <Avatar initials={athlete.avatar} size="sm" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full"
                        style={{ minWidth: 18, height: 18, fontSize: 10, background: '#FF5C1B', padding: '0 4px' }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                        {athlete.name}
                      </span>
                      {lastMessage && (
                        <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {timeAgo(lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'font-semibold' : ''}`}
                      style={{ color: unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {lastMessage
                        ? `${lastMessage.sender_type === 'coach' ? 'Ty: ' : ''}${lastMessage.content.slice(0, 40)}${lastMessage.content.length > 40 ? '…' : ''}`
                        : 'Brak wiadomości'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-base)' }}>
          {/* Thread header */}
          <div className="flex items-center gap-3 px-6 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            {selectedAthlete && (
              <>
                <Avatar initials={selectedAthlete.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{selectedAthlete.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {selectedAthlete.package}{selectedAthlete.goal ? ` · ${selectedAthlete.goal}` : ''}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Push notification prompt */}
          {permission === 'default' && (
            <div className="px-6 pt-3 shrink-0">
              <button onClick={subscribe}
                className="px-4 py-2.5 rounded-xl text-sm cursor-pointer w-full text-left"
                style={{ background: 'rgba(255,92,27,0.1)', border: '1px solid rgba(255,92,27,0.3)', color: '#FF5C1B' }}>
                🔔 Włącz powiadomienia o nowych wiadomościach
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
            {threadMessages.length === 0 && (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                Brak wiadomości. Napisz pierwszą!
              </div>
            )}
            {threadMessages.map(msg => {
              const isCoach = msg.sender_type === 'coach'
              return (
                <div key={msg.id} className={`flex gap-3 ${isCoach ? 'flex-row-reverse' : ''}`}>
                  <Avatar initials={isCoach ? coachInitials : (selectedAthlete?.avatar || '?')} size="sm" />
                  <div className={`flex flex-col gap-1 ${isCoach ? 'items-end' : 'items-start'}`} style={{ maxWidth: '65%' }}>
                    <div className="px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: isCoach ? '#FF5C1B' : 'var(--bg-elevated)',
                        color: isCoach ? 'white' : 'var(--text-primary)',
                        borderRadius: isCoach ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}>
                      {msg.content}
                    </div>
                    <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>{formatDateTime(msg.created_at)}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={`Napisz do ${selectedAthlete?.name ?? 'zawodnika'}…`}
                className="flex-1 px-4 py-3 rounded-2xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              />
              <Button onClick={handleSend} disabled={!input.trim() || sending}>
                {sending ? '…' : 'Wyślij'}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
