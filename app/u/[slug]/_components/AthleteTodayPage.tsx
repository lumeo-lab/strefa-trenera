'use client'

import { startTransition, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getWeekDays, intensityColor, sessionTypeLabel, toISODate } from '@/lib/utils'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'
import { PWAInstallBanner } from '@/components/ui/PWAInstallBanner'
import type { AthleteFeedbackByDay, AthleteTrainingSessionRow } from '@/lib/athlete-data'
import { dbRowToFeedback, FeedbackData, FeedbackModal } from './FeedbackModal'
import { FEELING_LABELS } from '@/lib/constants'
import { getSessionExecutionLabel, getSessionExecutionStatus, getSessionExecutionTone, isSessionCompleted, isSessionSkipped } from '@/lib/session-status'
import { markSessionCompletedByAthlete, markSessionSkippedByAthlete } from '@/lib/actions/sessions'
import { AthleteHeaderAvatar } from './AthleteHeaderAvatar'

interface Props {
  athlete: AthleteSession
  sessions: AthleteTrainingSessionRow[]
  feedbacks: AthleteFeedbackByDay
  today: string
  initialDate: string
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function dayLabel(dateStr: string, today: string): string {
  if (dateStr === today) return 'Dziś'
  if (dateStr === shiftDate(today, -1)) return 'Wczoraj'
  if (dateStr === shiftDate(today, 1)) return 'Jutro'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function fullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

const FEELING_LABEL = FEELING_LABELS

function TextFeedbackCard({ feedback, onEdit }: { feedback: FeedbackData; onEdit: () => void }) {
  const hasText = !!(feedback.feeling || feedback.rpe || feedback.painFlag || feedback.distanceKm || feedback.durationMin || feedback.notes)
  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">📝 Feedback</span>
        <button onClick={onEdit} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>✏️ Edytuj</button>
      </div>
      {hasText && (
        <div className="space-y-2">
          {(feedback.feeling || feedback.rpe) && (
            <div className="flex flex-wrap items-center gap-2">
              {feedback.feeling && <span className="text-sm font-medium">{feedback.feeling} {FEELING_LABEL[feedback.feeling]}</span>}
              {feedback.rpe && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>RPE {feedback.rpe}/10</span>}
            </div>
          )}
          {(feedback.distanceKm || feedback.durationMin) && (
            <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              {feedback.distanceKm && <span>📏 {feedback.distanceKm} km</span>}
              {feedback.durationMin && <span>⏱️ {feedback.durationMin} min</span>}
            </div>
          )}
          {feedback.painFlag && (
            <div className="text-sm" style={{ color: '#f59e0b' }}>
              ⚠️ {feedback.painNote ? `Ból/problem: ${feedback.painNote}` : 'Zgłoszono ból lub problem'}
            </div>
          )}
          {feedback.notes && <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>&ldquo;{feedback.notes}&rdquo;</p>}
        </div>
      )}
      {feedback.watchLink && (
        <a href={feedback.watchLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm mt-2"
          style={{ color: '#FF5C1B' }}>
          ⌚ <span className="underline truncate">{feedback.watchLink}</span>
        </a>
      )}
    </div>
  )
}

function VoiceFeedbackCard({ feedback, onEdit }: { feedback: FeedbackData; onEdit: () => void }) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">🎤 Komentarz głosowy</span>
        <button onClick={onEdit} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>✏️ Edytuj</button>
      </div>
      {feedback.voiceTranscript && (
        <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{feedback.voiceTranscript}</p>
      )}
    </div>
  )
}

// Navigation bounds: sessions are loaded for ±7 days from today
const NAV_RANGE_DAYS = 7

export function AthleteTodayPage({ athlete, sessions, feedbacks, today, initialDate }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const minDate = shiftDate(today, -NAV_RANGE_DAYS)
  const maxDate = shiftDate(today, NAV_RANGE_DAYS)
  const [optimisticTextFeedback, setOptimisticTextFeedback] = useState<FeedbackData | null>(null)
  const [optimisticVoiceFeedback, setOptimisticVoiceFeedback] = useState<FeedbackData | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'text' | 'voice'>('text')
  const [modalKey, setModalKey] = useState(0)
  const [modalInitialData, setModalInitialData] = useState<FeedbackData | null>(null)
  const [statusSubmitting, setStatusSubmitting] = useState<'completed' | 'skipped' | null>(null)
  const [optimisticSessionStatus, setOptimisticSessionStatus] = useState<'planned' | 'completed' | 'skipped' | 'detected' | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [skipFlowOpen, setSkipFlowOpen] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [skipNote, setSkipNote] = useState('')
  const [completedToast, setCompletedToast] = useState(false)

  const daySession = sessions.find(s => s.date === selectedDate)
  const tomorrowDate = shiftDate(selectedDate, 1)
  const tomorrowSession = sessions.find(s => s.date === tomorrowDate)
  const dayFeedbacks = feedbacks[selectedDate] ?? { text: null, voice: null }
  const textFeedback = dayFeedbacks.text
  const voiceFeedback = dayFeedbacks.voice
  const activeTextFeedback: FeedbackData | null = optimisticTextFeedback ?? (textFeedback ? dbRowToFeedback(textFeedback) : null)
  const activeVoiceFeedback: FeedbackData | null = optimisticVoiceFeedback ?? (voiceFeedback ? dbRowToFeedback(voiceFeedback) : null)
  const isPastOrToday = selectedDate <= today
  const weekDays = getWeekDays(0)
  const coachReply = textFeedback?.coach_reply || voiceFeedback?.coach_reply || null
  const sessionStatus = daySession ? (optimisticSessionStatus ?? getSessionExecutionStatus(daySession)) : null
  const sessionTone = daySession ? getSessionExecutionTone({ ...daySession, status: sessionStatus ?? undefined }) : 'muted'

  useEffect(() => {
    setSelectedDate(initialDate)
    resetDayState()
  }, [initialDate])

  function updateDateInUrl(dateStr: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (dateStr === today) {
      params.delete('d')
    } else {
      params.set('d', dateStr)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function resetDayState() {
    setOptimisticTextFeedback(null)
    setOptimisticVoiceFeedback(null)
    setOptimisticSessionStatus(null)
    setStatusError(null)
    setSkipFlowOpen(false)
    setCompletedToast(false)
  }

  const canGoBack = selectedDate > minDate
  const canGoForward = selectedDate < maxDate

  function navigate(delta: number) {
    const nextDate = shiftDate(selectedDate, delta)
    if (nextDate < minDate || nextDate > maxDate) return
    setSelectedDate(nextDate)
    updateDateInUrl(nextDate)
    resetDayState()
  }

  function selectDay(dateStr: string) {
    setSelectedDate(dateStr)
    updateDateInUrl(dateStr)
    resetDayState()
  }

  function openModal(type: 'text' | 'voice', editing: boolean) {
    setFeedbackType(type)
    let initial: FeedbackData | null = null
    if (editing) {
      const fb = type === 'text' ? textFeedback : voiceFeedback
      if (fb) {
        initial = dbRowToFeedback(fb)
      }
    }
    setModalInitialData(initial)
    setModalKey(k => k + 1)
    setFeedbackOpen(true)
  }

  function handleSubmitted(feedbackData: FeedbackData, type: 'text' | 'voice') {
    if (type === 'text') {
      setOptimisticTextFeedback(feedbackData)
    } else {
      setOptimisticVoiceFeedback(feedbackData)
    }
    setFeedbackOpen(false)
    startTransition(() => router.refresh())
  }

  async function handleMarkCompleted() {
    if (!daySession || statusSubmitting) return
    setStatusSubmitting('completed')
    setStatusError(null)
    const result = await markSessionCompletedByAthlete(athlete.slug, daySession.id)
    setStatusSubmitting(null)
    if (result && 'error' in result) {
      setStatusError(result.error ?? 'Nie udało się oznaczyć treningu jako wykonanego.')
      return
    }
    setOptimisticSessionStatus('completed')
    setCompletedToast(true)
    setTimeout(() => setCompletedToast(false), 3000)
    openModal('text', !!textFeedback)
    startTransition(() => router.refresh())
  }

  function openSkipFlow() {
    setSkipFlowOpen(true)
    setSkipReason('')
    setSkipNote('')
  }

  async function handleConfirmSkip() {
    if (!daySession || statusSubmitting) return
    setStatusSubmitting('skipped')
    setStatusError(null)
    const reason = [skipReason, skipNote.trim()].filter(Boolean).join(': ')
    const result = await markSessionSkippedByAthlete(athlete.slug, daySession.id, reason || undefined)
    setStatusSubmitting(null)
    if (result && 'error' in result) {
      setStatusError(result.error ?? 'Nie udało się oznaczyć treningu jako pominiętego.')
      return
    }
    setOptimisticSessionStatus('skipped')
    setSkipFlowOpen(false)
    startTransition(() => router.refresh())
  }

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5 lg:px-8 lg:pt-8" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Cześć, {athlete.name.split(' ')[0]}! 👋</div>
          <AthleteHeaderAvatar slug={athlete.slug} name={athlete.name} avatar={athlete.avatar} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate(-1)} disabled={!canGoBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-default"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>←</button>
          <div className="text-center flex-1">
            <div className="text-xl font-bold">{dayLabel(selectedDate, today)}</div>
            {selectedDate !== today && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fullDate(selectedDate)}</div>}
          </div>
          <button onClick={() => navigate(1)} disabled={!canGoForward}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-default"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>→</button>
        </div>
        {selectedDate !== today && (
          <button onClick={() => selectDay(today)}
            className="mt-3 w-full text-xs py-1.5 rounded-lg cursor-pointer"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
            Wróć do dziś
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 lg:px-8 lg:py-6 lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">
        <div className="space-y-3">
          {/* Day state banner */}
          {daySession ? (
            <>
              <div className="px-1 mb-1">
                <div className="text-sm font-semibold" style={{
                  color: sessionStatus === 'completed' ? '#2ECC71'
                    : sessionStatus === 'skipped' ? '#f59e0b'
                    : sessionStatus === 'detected' ? '#60a5fa'
                    : '#FF5C1B',
                }}>
                  {sessionStatus === 'completed'
                    ? (activeTextFeedback ? '✓ Trening ukończony' : '✓ Trening ukończony — dodaj feedback')
                    : sessionStatus === 'skipped' ? '— Trening pominięty'
                    : sessionStatus === 'detected' ? '📡 Wykryto aktywność'
                    : isPastOrToday ? 'Masz trening — oznacz wykonanie' : 'Zaplanowany trening'}
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${intensityColor(daySession.type)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-60">
                      {sessionTypeLabel(daySession.type)}
                    </div>
                    <h2 className="text-xl font-bold">{daySession.title}</h2>
                  </div>
                  {sessionStatus === 'completed' && <span className="text-2xl shrink-0 ml-3">✓</span>}
                  {sessionStatus === 'skipped' && <span className="text-2xl shrink-0 ml-3 opacity-50">—</span>}
                  {(!sessionStatus || sessionStatus === 'planned') && <span className="text-3xl shrink-0 ml-3">🏃</span>}
                </div>
                {daySession.description && <p className="text-sm opacity-80 mb-4">{daySession.description}</p>}

                {/* Plan */}
                <div className="flex flex-wrap gap-4 text-sm font-semibold">
                  {daySession.planned_distance && <span>📏 {daySession.planned_distance} km</span>}
                  {daySession.planned_duration && <span>⏱️ {daySession.planned_duration} min</span>}
                  {daySession.planned_pace && <span>⚡ {daySession.planned_pace}/km</span>}
                </div>

                {/* Actuals if completed */}
                {sessionStatus === 'completed' && (daySession.actual_distance || daySession.actual_duration || daySession.actual_pace || daySession.avg_hr) && (
                  <div className="mt-3 pt-3 flex flex-wrap gap-4 text-sm font-medium" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <span className="text-xs opacity-60 w-full">Wykonanie:</span>
                    {daySession.actual_distance && <span>📏 {daySession.actual_distance} km</span>}
                    {daySession.actual_duration && <span>⏱️ {daySession.actual_duration} min</span>}
                    {daySession.actual_pace && <span>⚡ {daySession.actual_pace}/km</span>}
                    {daySession.avg_hr && <span>❤️ {daySession.avg_hr} bpm</span>}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-4xl mb-3">😌</div>
              <div className="font-semibold text-lg mb-1">Dzień regeneracji</div>
              <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Brak zaplanowanego treningu — odpoczywaj!</div>
              {tomorrowSession && (
                <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Jutro: </span>
                  <span className="font-medium">{tomorrowSession.title}</span>
                  {tomorrowSession.planned_distance && (
                    <span style={{ color: 'var(--text-muted)' }}> · {tomorrowSession.planned_distance} km</span>
                  )}
                </div>
              )}
            </div>
          )}

          {isPastOrToday && (
            <div className="space-y-2">
              {/* Completed toast */}
              {completedToast && (
                <div className="px-4 py-2.5 rounded-2xl text-sm font-medium" style={{ background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ECC71' }}>
                  ✓ Trening oznaczony jako wykonany
                </div>
              )}

              {daySession && sessionStatus === 'planned' && !skipFlowOpen && (
                <div className="space-y-2">
                  <button
                    onClick={handleMarkCompleted}
                    disabled={statusSubmitting !== null}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: '#FF5C1B', color: '#fff', border: '1px solid rgba(255,92,27,0.6)' }}
                  >
                    {statusSubmitting === 'completed' ? 'Zapisywanie...' : '✓ Wykonałem trening'}
                  </button>
                  <button
                    onClick={openSkipFlow}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all active:scale-95"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  >
                    — Nie zrobiłem
                  </button>
                  {statusError && (
                    <div className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                      {statusError}
                    </div>
                  )}
                </div>
              )}

              {/* Skip flow — reason selection */}
              {daySession && sessionStatus === 'planned' && skipFlowOpen && (
                <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="text-sm font-semibold">Dlaczego nie zrobiłeś treningu?</div>
                  <div className="flex flex-wrap gap-2">
                    {['Brak czasu', 'Zmęczenie', 'Choroba', 'Kontuzja', 'Inne'].map(r => (
                      <button key={r} onClick={() => setSkipReason(skipReason === r ? '' : r)}
                        className="px-3 py-2 rounded-xl text-sm cursor-pointer transition-all"
                        style={{
                          background: skipReason === r ? 'rgba(255,92,27,0.12)' : 'var(--bg-subtle)',
                          border: skipReason === r ? '1px solid rgba(255,92,27,0.4)' : '1px solid transparent',
                          color: skipReason === r ? '#FF5C1B' : 'var(--text-muted)',
                        }}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={skipNote}
                    onChange={e => setSkipNote(e.target.value)}
                    placeholder="Dodatkowa notatka (opcjonalnie)"
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setSkipFlowOpen(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-medium cursor-pointer"
                      style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: 'none' }}>
                      Anuluj
                    </button>
                    <button onClick={handleConfirmSkip}
                      disabled={statusSubmitting !== null}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                      style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>
                      {statusSubmitting === 'skipped' ? 'Zapisywanie...' : 'Potwierdź pominięcie'}
                    </button>
                  </div>
                  {statusError && (
                    <div className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                      {statusError}
                    </div>
                  )}
                </div>
              )}

              {daySession && sessionStatus === 'skipped' && (
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div className="text-sm font-semibold mb-1" style={{ color: '#f59e0b' }}>Trening oznaczony jako pominięty</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Jeśli jednak go wykonałeś, możesz zmienić status i dodać feedback.
                  </div>
                  <button
                    onClick={handleMarkCompleted}
                    disabled={statusSubmitting !== null}
                    className="mt-3 w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: '#FF5C1B', color: '#fff', border: '1px solid rgba(255,92,27,0.6)' }}
                  >
                    {statusSubmitting === 'completed' ? 'Zapisywanie...' : 'Zmień na wykonany'}
                  </button>
                </div>
              )}

              {daySession && sessionStatus === 'detected' && (
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <div className="text-sm font-semibold mb-1" style={{ color: '#60a5fa' }}>Wykryliśmy aktywność</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Potwierdź wykonanie treningu, żeby dodać feedback i zsynchronizować historię.
                  </div>
                  <button
                    onClick={handleMarkCompleted}
                    disabled={statusSubmitting !== null}
                    className="mt-3 w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: '#FF5C1B', color: '#fff', border: '1px solid rgba(255,92,27,0.6)' }}
                  >
                    {statusSubmitting === 'completed' ? 'Zapisywanie...' : 'Potwierdź wykonanie'}
                  </button>
                </div>
              )}

              {/* Text feedback */}
              {daySession && sessionStatus === 'completed' && activeTextFeedback ? (
                <TextFeedbackCard feedback={activeTextFeedback} onEdit={() => openModal('text', true)} />
              ) : daySession && sessionStatus === 'completed' ? (
                <button onClick={() => openModal('text', false)}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all active:scale-95"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#FF5C1B' }}>
                  📝 Dodaj feedback po treningu
                </button>
              ) : null}

              {/* Voice feedback */}
              {daySession && sessionStatus === 'completed' && activeVoiceFeedback ? (
                <VoiceFeedbackCard feedback={activeVoiceFeedback} onEdit={() => openModal('voice', true)} />
              ) : daySession && sessionStatus === 'completed' ? (
                <button onClick={() => openModal('voice', false)}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all active:scale-95"
                  style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                  🎤 Nagraj komentarz głosowy
                </button>
              ) : null}

              {/* Coach reply */}
              {coachReply && (
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: '#2ECC71' }}>💬 Odpowiedź trenera</div>
                  <p className="text-sm">{coachReply}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Ten tydzień</div>
            <div className="space-y-1">
              {weekDays.map(day => {
                const dateStr = toISODate(day)
                const ws = sessions.find(s => s.date === dateStr)
                const isSelected = dateStr === selectedDate
                const isTod = dateStr === today
                return (
                  <button key={dateStr} onClick={() => selectDay(dateStr)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left cursor-pointer"
                    style={{
                      background: isSelected ? 'rgba(255,92,27,0.1)' : 'transparent',
                      border: isSelected ? '1px solid rgba(255,92,27,0.3)' : '1px solid transparent',
                    }}>
                    <div className="w-9 shrink-0 text-center">
                      <div className="text-xs" style={{ color: isSelected ? '#FF5C1B' : 'var(--text-muted)' }}>
                        {day.toLocaleDateString('pl-PL', { weekday: 'short' })}
                      </div>
                      <div className="font-bold text-sm" style={{ color: isSelected ? '#FF5C1B' : 'var(--text-primary)' }}>
                        {day.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {ws ? (
                        <div className="text-xs truncate" style={{ color: isSelected ? '#FF5C1B' : 'var(--text-primary)' }}>{ws.title}</div>
                      ) : (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Odpoczynek</div>
                      )}
                    </div>
                    <div className="shrink-0 ml-1">
                      {ws && isSessionCompleted(ws)
                        ? <span className="text-green-400 text-xs">✓</span>
                        : ws && isSessionSkipped(ws)
                        ? <span className="text-xs" style={{ color: '#f59e0b' }}>—</span>
                        : ws ? <div className="w-1.5 h-1.5 rounded-full" style={{ background: isTod ? '#FF5C1B' : 'var(--text-muted)' }} />
                        : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {coachReply && (
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: '#2ECC71' }}>💬 Odpowiedź trenera</div>
              <p className="text-sm">{coachReply}</p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        key={modalKey}
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        feedbackType={feedbackType}
        sessionId={daySession?.id ?? null}
        slug={athlete.slug}
        date={selectedDate}
        existingTextFeedback={textFeedback}
        existingVoiceFeedback={voiceFeedback}
        initialData={modalInitialData}
        onSubmitted={handleSubmitted}
      />

      <PWAInstallBanner />
      <AthleteBottomNav slug={athlete.slug} />
    </div>
  )
}
