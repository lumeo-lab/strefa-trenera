'use client'
import { useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { athletes, messages as initialMessages } from '@/lib/data'
import { Message } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

export default function CoachChatPage() {
  const [selectedAthleteId, setSelectedAthleteId] = useState('a1')
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId)
  const threadMessages = messages.filter(m => m.senderId === selectedAthleteId || m.senderId === 'coach')

  function handleSend() {
    if (!input.trim()) return
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: 'coach',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    }
    setMessages(prev => [...prev, msg])
    setInput('')
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar - athlete list */}
      <div className="w-64 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="font-semibold text-sm">Czat</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Rozmowy z zawodnikami</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {athletes.map(athlete => {
            const isActive = athlete.id === selectedAthleteId
            return (
              <button
                key={athlete.id}
                onClick={() => setSelectedAthleteId(athlete.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
                style={{ background: isActive ? 'rgba(255,92,27,0.08)' : undefined, borderLeft: isActive ? '2px solid #FF5C1B' : '2px solid transparent' }}
              >
                <Avatar initials={athlete.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{athlete.name}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{athlete.goal}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}>
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
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Brak wiadomości. Napisz pierwszą!</div>
          )}
          {threadMessages.map(msg => {
            const isCoach = msg.senderId === 'coach'
            return (
              <div key={msg.id} className={`flex gap-3 ${isCoach ? 'flex-row-reverse' : ''}`}>
                <Avatar initials={isCoach ? 'TC' : (selectedAthlete?.avatar || '?')} size="sm" />
                <div className={`max-w-sm ${isCoach ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div
                    className="px-4 py-3 rounded-2xl text-sm"
                    style={{
                      background: isCoach ? '#FF5C1B' : 'var(--bg-elevated)',
                      color: isCoach ? 'white' : 'var(--text-primary)',
                      borderRadius: isCoach ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    }}
                  >
                    {msg.content}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(msg.timestamp)}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Napisz do ${selectedAthlete?.name}...`}
              className="flex-1 px-4 py-3 rounded-2xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
            />
            <Button onClick={handleSend} disabled={!input.trim()}>Wyślij</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
