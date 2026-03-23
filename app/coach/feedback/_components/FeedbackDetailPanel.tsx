'use client'

import type { RefObject } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { FEELING_LABELS } from '@/lib/constants'
import { formatDate, timeAgo } from '@/lib/utils'
import {
  formatDuration,
  getActualsDisplay,
  getFeedbackDisplayData,
  getFeedbackSummaryChips,
  getSourceLabel,
  hasActuals,
  hasDisplayContent,
  REPLY_TEMPLATES,
} from '@/lib/feedback-helpers'
import { getPriorityColors, getPriorityLabel } from '@/lib/feedback-priority'
import type { FeedbackWithPriority } from './types'

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
  onNextUnread,
  legendOpen,
  onLegendToggle,
  legendRef,
  statusMessage,
}: {
  fb: FeedbackWithPriority | null
  isReplying: boolean
  replyText: string
  submitting: boolean
  markingRead: boolean
  onMarkRead: () => void
  onReplyStart: () => void
  onReplyChange: (text: string) => void
  onReplySubmit: () => void
  onReplyCancel: () => void
  onNextUnread?: () => void
  legendOpen: boolean
  onLegendToggle: () => void
  legendRef: RefObject<HTMLDivElement | null>
  statusMessage: { tone: 'success' | 'error'; text: string } | null
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
  const display = getFeedbackDisplayData(fb)
  const hasContent = hasDisplayContent(display)
  const sourceLabel = getSourceLabel(fb, display)
  const signalDot = fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'
  const { level: priorityLevel } = fb.priority
  const priorityLabel = getPriorityLabel(priorityLevel)
  const priorityColors = getPriorityColors(priorityLevel)

  // Unified actuals
  const actuals = getActualsDisplay(
    fb.strava_data,
    session ? {
      actual_distance: session.actual_distance,
      actual_duration: session.actual_duration,
      actual_pace: session.actual_pace,
      avg_hr: session.avg_hr,
      max_hr: session.max_hr,
    } : null,
    fb.watch_data,
  )
  const hasActualsData = hasActuals(actuals)
  const actualsSourceLabel = actuals.source === 'strava'
    ? '🔗 Dane ze Strava'
    : actuals.source === 'watch'
      ? '⌚ Dane z urządzenia'
      : '🏃 Dane z sesji treningowej'

  // Summary chips
  const summaryChips = getFeedbackSummaryChips(fb, !!fb.strava_data)

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-base)' }}>
      {/* ── Header ── */}
      <div
        className="px-6 py-3 border-b shrink-0 space-y-2"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        {/* Row 1: athlete + priority + status + actions */}
        <div className="flex items-center gap-3">
          {athlete && <Avatar initials={athlete.avatar || '?'} size="md" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm" aria-hidden="true">{signalDot}</span>
              {athlete ? (
                <Link
                  href={`/coach/athletes/${athlete.id}`}
                  className="font-semibold text-sm hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {athlete.name}
                </Link>
              ) : (
                <span className="font-semibold text-sm">Nieznany</span>
              )}
              {priorityLabel && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: priorityColors.bg, color: priorityColors.text }}
                >
                  {priorityLabel}
                </span>
              )}
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
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick actions: profile, chat */}
            {athlete && (
              <>
                <LinkButton href={`/coach/athletes/${athlete.id}`} title="Profil zawodnika">👤</LinkButton>
                <LinkButton href={`/coach/chat?athlete=${athlete.id}`} title="Czat">💬</LinkButton>
                <LinkButton href={`/coach/athletes/${athlete.id}?tab=plan`} title="Plan">📋</LinkButton>
              </>
            )}
            {onNextUnread && (
              <button
                onClick={onNextUnread}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                title="Następny nieprzeczytany (n)"
              >
                ⏭
              </button>
            )}
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
                aria-label="Legenda sygnałów"
                aria-expanded={legendOpen}
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

        {/* Row 2: Summary chips */}
        {summaryChips.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {summaryChips.map((chip) => (
              <span
                key={chip.label}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${chip.color}18`, color: chip.color }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <div role="status" aria-live="polite">
            {statusMessage && (
              <StatusMessage tone={statusMessage.tone} text={statusMessage.text} />
            )}
          </div>

          {/* Feedback content */}
          {hasContent && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--text-muted)' }}>Feedback zawodnika</div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-2">
                {display.feeling && (
                  <FieldRow label="Samopoczucie">
                    <span>{display.feeling}</span>
                    <span className="ml-1" style={{ color: 'var(--text-muted)' }}>{FEELING_LABELS[display.feeling] ?? ''}</span>
                  </FieldRow>
                )}
                {display.rpe && <FieldRow label="RPE">{display.rpe}</FieldRow>}
                {display.trainingType && <FieldRow label="Typ treningu">{display.trainingType}</FieldRow>}
                {display.distance && <FieldRow label="Dystans">{display.distance}</FieldRow>}
                {display.duration && <FieldRow label="Czas">{display.duration}</FieldRow>}
                {display.intensity && <FieldRow label="Intensywność">{display.intensity}</FieldRow>}
                {display.pain && (
                  <FieldRow label="Ból / problem">
                    <span className="text-red-400">{display.pain}</span>
                  </FieldRow>
                )}
              </div>
              {display.notes && (
                <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Notatka</div>
                  <p className="text-sm italic" style={{ color: 'var(--text-primary)' }}>&ldquo;{display.notes}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {/* Voice transcript */}
          {display.voice && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>🎤 Komentarz głosowy</div>
              <p className="text-sm italic">&ldquo;{display.voice}&rdquo;</p>
            </div>
          )}

          {/* Unified actuals */}
          {hasActualsData && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: actuals.source === 'strava' ? '1px solid rgba(252,82,0,0.3)' : '1px solid var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: actuals.source === 'strava' ? '#FC5200' : 'var(--text-muted)' }}>
                {actualsSourceLabel}
              </div>
              <div className="flex flex-wrap gap-3">
                {actuals.distance != null && <MetricChip icon="📏" label="Dystans" value={`${actuals.distance.toFixed(1)} km`} />}
                {actuals.duration != null && <MetricChip icon="🕐" label="Czas" value={formatDuration(actuals.duration)} />}
                {actuals.pace && <MetricChip icon="⏱" label="Tempo" value={`${actuals.pace} /km`} />}
                {actuals.avgHr != null && <MetricChip icon="❤️" label="Tętno śr." value={`${actuals.avgHr} bpm`} />}
                {actuals.maxHr != null && <MetricChip icon="💓" label="Tętno max" value={`${actuals.maxHr} bpm`} />}
                {actuals.elevation != null && <MetricChip icon="⛰️" label="Przewyższenie" value={`${Math.round(actuals.elevation)} m`} />}
              </div>
            </div>
          )}

          {/* Watch link */}
          {fb.watch_link && (
            <a
              href={fb.watch_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'rgba(255,92,27,0.08)', color: '#FF5C1B' }}
              aria-label="Otwórz link do zegarka"
            >
              ⌚ <span className="underline">Link do aktywności</span>
              <span className="text-xs opacity-70">↗</span>
            </a>
          )}

          {/* Empty feedback fallback */}
          {!hasContent && !display.voice && !hasActualsData && !fb.watch_link && (
            <div className="rounded-xl p-5 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak dodatkowych danych w tym feedbacku.</p>
            </div>
          )}

          {/* ── Reply section — inline, directly after content ── */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: fb.coach_reply && !isReplying ? '1px solid rgba(46,204,113,0.3)' : '1px solid var(--border)' }}>
            {/* Existing reply display */}
            {fb.coach_reply && !isReplying && (
              <>
                <div className="text-xs font-semibold mb-2" style={{ color: '#2ECC71' }}>✓ Odpowiedź trenera</div>
                <p className="text-sm mb-3">{fb.coach_reply}</p>
                <Button variant="secondary" size="sm" onClick={onReplyStart}>✏️ Edytuj odpowiedź</Button>
              </>
            )}

            {/* Reply form */}
            {isReplying ? (
              <div className="space-y-2">
                {fb.coach_reply && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Edytujesz istniejącą odpowiedź.</p>
                )}
                {/* Templates */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {REPLY_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => onReplyChange(t.text)}
                      className="text-[11px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => onReplyChange(e.target.value)}
                  placeholder="Napisz odpowiedź do zawodnika..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={onReplySubmit} disabled={!replyText.trim() || submitting}>
                    {submitting ? 'Wysyłanie...' : 'Wyślij'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onReplyCancel}>Anuluj</Button>
                </div>
              </div>
            ) : !fb.coach_reply ? (
              <>
                <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Odpowiedź trenera</div>
                <Button variant="secondary" size="sm" onClick={onReplyStart} className="w-full">
                  💬 Napisz odpowiedź
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LinkButton({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      title={title}
    >
      {children}
    </Link>
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

function MetricChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
      <span className="text-xs" aria-hidden="true">{icon}</span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
