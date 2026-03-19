'use client'

import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, hasParsedContent, parseFeedbackTranscript, signalColor, timeAgo } from '@/lib/utils'
import { FEELING_LABELS } from '@/lib/constants'
import type { FeedbackRow } from '@/lib/supabase/database.types'
import type { FeedbackSignal } from '@/lib/types'

export type FeedbackCardData = FeedbackRow & {
  athletes?: { id: string; name: string; avatar: string } | null
  training_sessions?: { id: string; title: string } | null
}

/** Build a short label from parsed feedback fields */
export function feedbackLabel(parsed: ReturnType<typeof parseFeedbackTranscript>): string {
  const parts: string[] = []
  if (parsed.feeling) parts.push(parsed.feeling)
  if (parsed.trainingType) parts.push(parsed.trainingType)
  if (!parts.length && parsed.voice) return 'Komentarz głosowy'
  if (!parts.length && parsed.notes) return 'Notatka'
  return parts.join(' · ') || 'Feedback'
}

export function FeedbackCard({
  fb, isExpanded, isReplying, replyText, submitting, markingRead, showAthleteName,
  onExpand, onMarkRead, onReplyStart, onReplyChange, onReplySubmit, onReplyCancel,
}: {
  fb: FeedbackCardData
  isExpanded: boolean
  isReplying: boolean
  replyText: string
  submitting: boolean
  markingRead: boolean
  showAthleteName: boolean
  onExpand: () => void
  onMarkRead: () => void
  onReplyStart: () => void
  onReplyChange: (text: string) => void
  onReplySubmit: () => void
  onReplyCancel: () => void
}) {
  const athlete = fb.athletes
  const session = fb.training_sessions
  const parsed = parseFeedbackTranscript(fb.transcript ?? '')
  const hasContent = hasParsedContent(parsed)
  const label = feedbackLabel(parsed)
  const signalDot = fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'

  // Better source label
  const hasText = !!(parsed.feeling || parsed.trainingType || parsed.distance || parsed.duration || parsed.intensity || parsed.notes)
  const sourceLabel = hasText && parsed.voice
    ? '📝🎤 Tekst + głos'
    : parsed.voice
      ? '🎤 Głos'
      : fb.source === 'auto'
        ? '⌚ Zegarek'
        : '✏️ Tekst'

  // Content preview for collapsed state
  const preview = !isExpanded ? (() => {
    if (parsed.notes) return parsed.notes.length > 80 ? parsed.notes.slice(0, 80) + '…' : parsed.notes
    if (parsed.voice) return parsed.voice.length > 80 ? parsed.voice.slice(0, 80) + '…' : parsed.voice
    return ''
  })() : ''

  // Stronger risk highlight
  const riskBorder = fb.signal === 'red'
    ? 'ring-1 ring-red-500/20'
    : fb.signal === 'yellow'
      ? 'ring-1 ring-yellow-500/15'
      : ''

  return (
    <Card className={`overflow-hidden border-l-4 ${signalColor(fb.signal as FeedbackSignal)} ${!fb.read ? 'ring-1 ring-white/5' : riskBorder}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {showAthleteName && athlete && <Avatar initials={athlete.avatar || '?'} size="sm" />}

          <div className="flex-1 min-w-0">
            {/* Header row: signal · type · reply status · freshness */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm">{signalDot}</span>
              {showAthleteName && athlete && <span className="font-semibold text-sm">{athlete.name}</span>}
              {!fb.read && <Badge variant="orange">Nowy</Badge>}
              <span className="text-sm">{label}</span>
              {fb.coach_reply && (
                <span className="text-xs" style={{ color: '#2ECC71' }}>✓ Odpowiedziano</span>
              )}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(fb.created_at)}</span>
            </div>
            {/* Meta row */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
              <span>{sourceLabel}</span>
              {session && <><span>·</span><span>{session.title}</span></>}
              <span>·</span>
              <span>{formatDate(fb.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            {/* Content preview (collapsed) */}
            {preview && (
              <p className="text-xs mt-1.5 truncate italic" style={{ color: 'var(--text-muted)' }}>
                &ldquo;{preview}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!fb.read && (
              <Button variant="secondary" size="sm" onClick={onMarkRead} disabled={markingRead}>
                {markingRead ? '...' : 'Przeczytane'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onExpand} aria-expanded={isExpanded}>
              {isExpanded ? '▲ Zwiń' : '▼ Rozwiń'}
            </Button>
          </div>
        </div>

        {/* Expanded */}
        {isExpanded && (
          <div className={`mt-4 space-y-4 ${showAthleteName ? 'pl-11' : ''}`}>
            {/* Parsed fields */}
            {hasContent && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-subtle)' }}>
                {parsed.feeling && (
                  <FieldRow label="Samopoczucie">
                    <span>{parsed.feeling}</span>
                    <span className="ml-1" style={{ color: 'var(--text-muted)' }}>{FEELING_LABELS[parsed.feeling] ?? ''}</span>
                  </FieldRow>
                )}
                {parsed.trainingType && <FieldRow label="Typ treningu">{parsed.trainingType}</FieldRow>}
                {parsed.distance && <FieldRow label="Dystans">{parsed.distance}</FieldRow>}
                {parsed.duration && <FieldRow label="Czas">{parsed.duration}</FieldRow>}
                {parsed.intensity && <FieldRow label="Intensywność">{parsed.intensity}</FieldRow>}
                {parsed.notes && (
                  <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-sm italic" style={{ color: 'var(--text-primary)' }}>&ldquo;{parsed.notes}&rdquo;</p>
                  </div>
                )}
              </div>
            )}

            {/* Voice transcript */}
            {parsed.voice && (
              <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
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
                className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,92,27,0.08)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.2)' }}
                aria-label="Otwórz link do zegarka"
              >
                ⌚ <span className="underline truncate">{fb.watch_link}</span>
                <span className="shrink-0 ml-auto text-xs opacity-70">↗</span>
              </a>
            )}

            {/* Watch sensor data */}
            {fb.watch_data && !!(fb.watch_data.avgHR || fb.watch_data.maxHR || fb.watch_data.distance) && (
              <div className="grid grid-cols-3 gap-2">
                {([
                  fb.watch_data.avgHR ? ['Tętno śr.', `${fb.watch_data.avgHR} bpm`] : null,
                  fb.watch_data.maxHR ? ['Tętno max', `${fb.watch_data.maxHR} bpm`] : null,
                  fb.watch_data.distance ? ['Dystans', `${fb.watch_data.distance} km`] : null,
                ] as Array<[string, string] | null>)
                  .filter((x): x is [string, string] => x !== null)
                  .map(([k, v]) => (
                    <div key={k} className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{k}</div>
                      <div className="text-sm font-semibold">{v}</div>
                    </div>
                  ))}
              </div>
            )}

            {/* Coach reply (read-only) */}
            {fb.coach_reply && !isReplying && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                <div className="text-xs font-semibold mb-1.5" style={{ color: '#2ECC71' }}>Twoja odpowiedź</div>
                <p className="text-sm">{fb.coach_reply}</p>
              </div>
            )}

            {/* Reply form */}
            {isReplying ? (
              <div className="space-y-2">
                {fb.coach_reply && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Edytujesz istniejącą odpowiedź. Zapisanie zastąpi poprzednią.</p>
                )}
                <textarea
                  value={replyText}
                  onChange={e => onReplyChange(e.target.value)}
                  placeholder="Napisz odpowiedź do zawodnika..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={onReplySubmit} disabled={!replyText || submitting}>
                    {submitting ? 'Wysyłanie...' : 'Wyślij'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onReplyCancel}>Anuluj</Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={onReplyStart}>
                {fb.coach_reply ? '✏️ Edytuj odpowiedź' : '💬 Odpowiedz'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * Lightweight inline feedback detail (used in HistoryTab / PlanTab).
 */
export function FeedbackDetail({ fb }: { fb: FeedbackCardData }) {
  const parsed = parseFeedbackTranscript(fb.transcript ?? '')
  const hasText = hasParsedContent(parsed)
  const label = feedbackLabel(parsed)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span>{fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'}</span>
        <span className="text-sm font-semibold">{label}</span>
        {fb.coach_reply && <span className="text-xs ml-1" style={{ color: '#2ECC71' }}>✓ Odpowiedziano</span>}
      </div>
      {hasText && (
        <div className="space-y-1.5 text-sm">
          {parsed.feeling && (
            <div className="flex items-center gap-2">
              <span>{parsed.feeling}</span>
              <span style={{ color: 'var(--text-muted)' }}>{FEELING_LABELS[parsed.feeling]}</span>
              {parsed.intensity && <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{parsed.intensity}</span>}
            </div>
          )}
          {(parsed.trainingType || parsed.distance || parsed.duration) && (
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              {parsed.trainingType && <span>🏃 {parsed.trainingType}</span>}
              {parsed.distance && <span>📏 {parsed.distance}</span>}
              {parsed.duration && <span>⏱ {parsed.duration}</span>}
            </div>
          )}
          {parsed.notes && <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>&quot;{parsed.notes}&quot;</p>}
        </div>
      )}
      {parsed.voice && (
        <p className="text-sm italic"
          style={{ color: 'var(--text-muted)', borderTop: hasText ? '1px solid var(--border)' : 'none', paddingTop: hasText ? '10px' : '0', marginTop: hasText ? '4px' : '0' }}>
          🎤 {parsed.voice}
        </p>
      )}
      {fb.coach_reply && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
          <div className="text-xs font-semibold mb-1" style={{ color: '#2ECC71' }}>💬 Twoja odpowiedź</div>
          <p>{fb.coach_reply}</p>
        </div>
      )}
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
