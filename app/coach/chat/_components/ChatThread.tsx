'use client'

import type { RefObject } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import type { ChatAthlete, MessageWithSeparator } from './ChatClient'

export function ChatThread({
  selectedAthlete,
  messagesWithSeparators,
  messageCount,
  coachInitials,
  loading,
  loadError,
  permission,
  sendError,
  input,
  sending,
  onSend,
  onInputChange,
  onKeyDown,
  onSubscribe,
  onRetry,
  textareaRef,
  bottomRef,
}: {
  selectedAthlete: ChatAthlete | undefined
  messagesWithSeparators: MessageWithSeparator[]
  messageCount: number
  coachInitials: string
  loading: boolean
  loadError: boolean
  permission: NotificationPermission | 'unsupported'
  sendError: boolean
  input: string
  sending: boolean
  onSend: () => void
  onInputChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSubscribe: () => void
  onRetry: () => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
  bottomRef: RefObject<HTMLDivElement | null>
}) {
  return (
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
            <div className="flex items-center gap-2">
              <Link
                href={`/coach/athletes/${selectedAthlete.id}?tab=feedback`}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
              >
                Feedback
              </Link>
              <Link
                href={`/coach/athletes/${selectedAthlete.id}`}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
              >
                Profil
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Push notification prompt */}
      {permission === 'default' && (
        <div className="px-6 pt-3 shrink-0">
          <button onClick={onSubscribe}
            className="px-4 py-2.5 rounded-xl text-sm cursor-pointer w-full text-left transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,92,27,0.1)', border: '1px solid rgba(255,92,27,0.3)', color: '#FF5C1B' }}>
            🔔 Włącz powiadomienia o nowych wiadomościach
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
        {/* Limit 200 info */}
        {messageCount >= 200 && (
          <div className="text-center text-xs py-2 rounded-xl mb-2" style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
            Wyświetlono ostatnie 200 wiadomości
          </div>
        )}

        {loading && messageCount === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: '#FF5C1B' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Wczytywanie rozmowy...</span>
          </div>
        )}
        {loadError && (
          <EmptyState
            title="Nie udało się wczytać rozmowy"
            description="Sprawdź połączenie i spróbuj ponownie."
            actionLabel="Spróbuj ponownie"
            onAction={onRetry}
          />
        )}
        {!loading && !loadError && messageCount === 0 && (
          <EmptyState
            title="Ta rozmowa jest jeszcze pusta"
            description="Wyślij pierwszą wiadomość, a wątek zacznie się budować tutaj."
          />
        )}
        {!loading && !loadError && messageCount === 0 && (
          <div ref={bottomRef} />
        )}
        {messageCount > 0 && messagesWithSeparators.map(item => {
          if (item.type === 'separator') {
            return (
              <div key={item.key} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
            )
          }
          const msg = item.msg
          const isCoach = msg.sender_type === 'coach'
          const isOptimistic = msg._optimistic
          return (
            <div key={msg.id} className={`flex gap-3 ${isCoach ? 'flex-row-reverse' : ''}`} style={{ opacity: isOptimistic ? 0.6 : 1 }}>
              <Avatar initials={isCoach ? coachInitials : (selectedAthlete?.avatar || '?')} size="sm" />
              <div className={`flex flex-col gap-1 ${isCoach ? 'items-end' : 'items-start'}`} style={{ maxWidth: '65%' }}>
                <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: isCoach ? '#FF5C1B' : 'var(--bg-elevated)',
                    color: isCoach ? 'white' : 'var(--text-primary)',
                    borderRadius: isCoach ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}>
                  {msg.content}
                </div>
                <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                  {isOptimistic ? 'Wysyłanie...' : formatDate(msg.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        {messageCount > 0 && <div ref={bottomRef} />}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        {sendError && (
          <div className="text-xs mb-2 px-1 flex items-center gap-2" style={{ color: '#E74C3C' }}>
            <span>Nie udało się wysłać wiadomości.</span>
            <button onClick={onSend} className="underline cursor-pointer hover:opacity-80">Spróbuj ponownie</button>
          </div>
        )}
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { onInputChange(e.target.value) }}
            onKeyDown={onKeyDown}
            placeholder={`Napisz do ${selectedAthlete?.name ?? 'zawodnika'}…`}
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl text-sm resize-none overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', maxHeight: 120 }}
          />
          <Button onClick={onSend} disabled={!input.trim() || sending}>
            {sending ? '…' : 'Wyślij'}
          </Button>
        </div>
        <div className="text-xs mt-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
          Enter — wyślij · Shift+Enter — nowa linia
        </div>
      </div>
    </div>
  )
}
