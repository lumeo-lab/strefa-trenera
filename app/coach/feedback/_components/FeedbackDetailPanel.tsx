'use client'

import type { RefObject } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { FEELING_LABELS } from '@/lib/constants'
import { formatDate, hasParsedContent, parseFeedbackTranscript, timeAgo } from '@/lib/utils'
import type { FeedbackWithJoins } from './FeedbackClient'

export function FeedbackDetailPanel({
  fb,
  isReplying,
  replyText,
  submitting,
  markingRead,
  onMarkRead,
  onReplyStart,
  onReplyChange,
  onReplySubmit,
  onReplyCancel,
  legendOpen,
  onLegendToggle,
  legendRef,
  statusMessage,
  totalLoaded,
}: {
  fb: FeedbackWithJoins | null
  isReplying: boolean
  replyText: string
  submitting: boolean
  markingRead: boolean
  onMarkRead: () => void
  onReplyStart: () => void
  onReplyChange: (text: string) => void
  onReplySubmit: () => void
  onReplyCancel: () => void
  legendOpen: boolean
  onLegendToggle: () => void
  legendRef: RefObject<HTMLDivElement | null>
  statusMessage: { tone: 'success' | 'error'; text: string } | null
  totalLoaded: number
}) {
  if (!fb) {
    return (
      <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-base)' }}>
        <div className="flex items-center justify-center h-full">
          <EmptyState
            icon="📥"
            title="Wybierz feedback z listy"
            description="Kliknij na feedback po lewej, aby zobaczyć szczegóły i odpowiedzieć."
          />
        </div>
      </div>
    )
  }

  const athlete = fb.athletes
  const session = fb.training_sessions
  const parsed = parseFeedbackTranscript(fb.transcript ?? '')
  const hasContent = hasParsedContent(parsed)
  const signalDot = fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'

  const hasText = !!(parsed.feeling || parsed.rpe || parsed.pain || parsed.trainingType || parsed.distance || parsed.duration || parsed.intensity || parsed.notes)
  const sourceLabel = hasText && parsed.voice
    ? '📝🎤 Tekst + głos'
    : parsed.voice
      ? '🎤 Głos'
      : fb.source === 'auto'
        ? '⌚ Zegarek'
        : '✏️ Tekst'

  const watchData = fb.watch_data as { avgHR?: number; maxHR?: number; distance?: number } | null
  const watchDataPresent = !!(watchData?.avgHR || watchData?.maxHR || watchData?.distance)

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        {athlete && <Avatar initials={athlete.avatar || '?'} size="md" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm" aria-hidden="true">{signalDot}</span>
            <span className="font-semibold text-sm">{athlete?.name ?? 'Nieznany'}</span>
            {!fb.read && <Badge variant="orange">Nowy</Badge>}
            {fb.coach_reply && (
              <span className="text-xs" style={{ color: '#2ECC71' }}>✓ Odpowiedziano</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            <span>{sourceLabel}</span>
            {session && <><span>·</span><span>{session.title}</span></>}
            <span>·</span>
            <span>{formatDate(fb.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>·</span>
            <span>{timeAgo(fb.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!fb.read && (
            <Button variant="secondary" size="sm" onClick={onMarkRead} disabled={markingRead}>
              {markingRead ? '...' : 'Przeczytane'}
            </Button>
          )}
          <div ref={legendRef} className="relative">
            <button
              onClick={onLegendToggle}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              title="Legenda sygnałów"
            >
              ℹ️
            </button>
            {legendOpen && (
              <div
                className="absolute right-0 top-10 z-50 w-64 rounded-xl p-4 shadow-lg"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Legenda sygnałów</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><span>🟢</span><span>Dobrze / Świetnie</span><span style={{ color: 'var(--text-muted)' }}>😊 🤩</span></div>
                  <div className="flex items-center gap-2"><span>🟡</span><span>Średnio</span><span style={{ color: 'var(--text-muted)' }}>😐</span></div>
                  <div className="flex items-center gap-2"><span>🔴</span><span>Słabo / Fatalnie</span><span style={{ color: 'var(--text-muted)' }}>😕 😫</span></div>
                </div>
                <p className="text-xs mt-3 pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                  Sygnał ustawiany automatycznie na podstawie samopoczucia zawodnika.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body — two-column on xl+, single column on smaller */}
      <div className="flex-1 overflow-y-auto">
        {statusMessage && (
          <div className="px-6 pt-4">
            <StatusMessage tone={statusMessage.tone} text={statusMessage.text} />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 px-6 py-6">
          {/* ── Left column: feedback content (3/5) ── */}
          <div className="xl:col-span-3 space-y-5">
            {/* Parsed fields */}
            {hasContent && (
              <div className="rounded-xl p-4 space-y-2.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Dane feedbacku</div>
                {parsed.feeling && (
                  <FieldRow label="Samopoczucie">
                    <span>{parsed.feeling}</span>
                    <span className="ml-1" style={{ color: 'var(--text-muted)' }}>{FEELING_LABELS[parsed.feeling] ?? ''}</span>
                  </FieldRow>
                )}
                {parsed.rpe && <FieldRow label="RPE">{parsed.rpe}</FieldRow>}
                {parsed.trainingType && <FieldRow label="Typ treningu">{parsed.trainingType}</FieldRow>}
                {parsed.distance && <FieldRow label="Dystans">{parsed.distance}</FieldRow>}
                {parsed.duration && <FieldRow label="Czas">{parsed.duration}</FieldRow>}
                {parsed.intensity && <FieldRow label="Intensywność">{parsed.intensity}</FieldRow>}
                {parsed.pain && (
                  <FieldRow label="Ból / problem">
                    <span className="text-red-400">{parsed.pain}</span>
                  </FieldRow>
                )}
                {parsed.notes && (
                  <div className="pt-2.5 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Notatka</div>
                    <p className="text-sm italic" style={{ color: 'var(--text-primary)' }}>&ldquo;{parsed.notes}&rdquo;</p>
                  </div>
                )}
              </div>
            )}

            {/* Voice transcript */}
            {parsed.voice && (
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>🎤 Komentarz głosowy</div>
                <p className="text-sm italic">&ldquo;{parsed.voice}&rdquo;</p>
              </div>
            )}

            {/* Watch link */}
            {fb.watch_link && (
              <a
                href={fb.watch_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,92,27,0.08)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.2)' }}
                aria-label="Otwórz link do zegarka"
              >
                ⌚ <span className="underline truncate">{fb.watch_link}</span>
                <span className="shrink-0 ml-auto text-xs opacity-70">↗</span>
              </a>
            )}

            {/* Empty left column fallback */}
            {!hasContent && !parsed.voice && !fb.watch_link && (
              <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak dodatkowych danych w tym feedbacku.</p>
              </div>
            )}
          </div>

          {/* ── Right column: actions + metrics (2/5) ── */}
          <div className="xl:col-span-2 space-y-5">
            {/* Watch sensor data */}
            {watchDataPresent && (
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Dane z zegarka</div>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    watchData?.avgHR ? ['Tętno śr.', `${watchData.avgHR} bpm`] : null,
                    watchData?.maxHR ? ['Tętno max', `${watchData.maxHR} bpm`] : null,
                    watchData?.distance ? ['Dystans', `${watchData.distance} km`] : null,
                  ] as Array<[string, string] | null>)
                    .filter((x): x is [string, string] => x !== null)
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</span>
                        <span className="text-sm font-semibold">{v}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Coach reply (read-only) */}
            {fb.coach_reply && !isReplying && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                <div className="text-xs font-semibold mb-1.5" style={{ color: '#2ECC71' }}>Twoja odpowiedź</div>
                <p className="text-sm">{fb.coach_reply}</p>
              </div>
            )}

            {/* Reply form */}
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                {fb.coach_reply ? 'Odpowiedź' : 'Odpowiedz zawodnikowi'}
              </div>
              {isReplying ? (
                <div className="space-y-2">
                  {fb.coach_reply && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Edytujesz istniejącą odpowiedź.</p>
                  )}
                  <textarea
                    value={replyText}
                    onChange={(e) => onReplyChange(e.target.value)}
                    placeholder="Napisz odpowiedź do zawodnika..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={onReplySubmit} disabled={!replyText.trim() || submitting}>
                      {submitting ? 'Wysyłanie...' : 'Wyślij'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onReplyCancel}>Anuluj</Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={onReplyStart} className="w-full">
                  {fb.coach_reply ? '✏️ Edytuj odpowiedź' : '💬 Odpowiedz'}
                </Button>
              )}
            </div>

            {/* Limit 200 info */}
            {totalLoaded >= 200 && (
              <div className="text-center text-xs py-3 rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
                Wyświetlasz ostatnie 200 feedbacków.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="w-28 shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span>{children}</span>
    </div>
  )
}
