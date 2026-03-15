'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { intensityColor, sessionTypeLabel, getWeekDays, toISODate } from '@/lib/utils'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'
import { PWAInstallBanner } from '@/components/ui/PWAInstallBanner'
import { DbRow } from '@/lib/types'
import { FeedbackModal, FeedbackData, dbRowToFeedback } from './FeedbackModal'
import { FEELING_LABELS } from '@/lib/constants'

interface Props {
  athlete: AthleteSession
  sessions: DbRow[]
  feedbacks: Record<string, { text: DbRow | null; voice: DbRow | null }>
  today: string
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
  const hasText = !!(feedback.feeling || feedback.trainingType || feedback.distanceKm || feedback.durationMin || feedback.intensity || feedback.notes)
  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">📝 Feedback</span>
        <button onClick={onEdit} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>✏️ Edytuj</button>
      </div>
      {hasText && (
        <div className="space-y-2">
          {(feedback.feeling || feedback.intensity) && (
            <div className="flex flex-wrap items-center gap-2">
              {feedback.feeling && <span className="text-sm font-medium">{feedback.feeling} {FEELING_LABEL[feedback.feeling]}</span>}
              {feedback.intensity && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{feedback.intensity}</span>}
            </div>
          )}
          {(feedback.trainingType || feedback.distanceKm || feedback.durationMin) && (
            <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              {feedback.trainingType && <span>🏃 {feedback.trainingType}</span>}
              {feedback.distanceKm && <span>📏 {feedback.distanceKm} km</span>}
              {feedback.durationMin && <span>⏱️ {feedback.durationMin} min</span>}
            </div>
          )}
          {feedback.notes && <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>"{feedback.notes}"</p>}
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

export function AthleteTodayPage({ athlete, sessions, feedbacks, today }: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(today)
  const [optimisticTextFeedback, setOptimisticTextFeedback] = useState<FeedbackData | null>(null)
  const [optimisticVoiceFeedback, setOptimisticVoiceFeedback] = useState<FeedbackData | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'text' | 'voice'>('text')
  const [modalKey, setModalKey] = useState(0)
  const [modalInitialData, setModalInitialData] = useState<FeedbackData | null>(null)

  const daySession = sessions.find(s => s.date === selectedDate)
  const dayFeedbacks = feedbacks[selectedDate] ?? { text: null, voice: null }
  const textFeedback = dayFeedbacks.text
  const voiceFeedback = dayFeedbacks.voice
  const activeTextFeedback: FeedbackData | null = optimisticTextFeedback ?? (textFeedback ? dbRowToFeedback(textFeedback) : null)
  const activeVoiceFeedback: FeedbackData | null = optimisticVoiceFeedback ?? (voiceFeedback ? dbRowToFeedback(voiceFeedback) : null)
  const isPastOrToday = selectedDate <= today
  const weekDays = getWeekDays(0)
  const coachReply = textFeedback?.coach_reply || voiceFeedback?.coach_reply || null

  function resetDayState() {
    setOptimisticTextFeedback(null)
    setOptimisticVoiceFeedback(null)
  }

  function navigate(delta: number) {
    setSelectedDate(d => shiftDate(d, delta))
    resetDayState()
  }

  function selectDay(dateStr: string) {
    setSelectedDate(dateStr)
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

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5 lg:px-8 lg:pt-8" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Cześć, {athlete.name.split(' ')[0]}! 👋</div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>←</button>
          <div className="text-center flex-1">
            <div className="text-xl font-bold">{dayLabel(selectedDate, today)}</div>
            {selectedDate !== today && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fullDate(selectedDate)}</div>}
          </div>
          <button onClick={() => navigate(1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
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
          {daySession ? (
            <div className={`p-5 rounded-2xl border ${intensityColor(daySession.type)}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-60">
                    {sessionTypeLabel(daySession.type)}
                  </div>
                  <h2 className="text-xl font-bold">{daySession.title}</h2>
                </div>
                <div className="text-3xl shrink-0 ml-3">🏃</div>
              </div>
              <p className="text-sm opacity-80 mb-4">{daySession.description}</p>
              <div className="flex flex-wrap gap-4 text-sm font-semibold">
                {daySession.planned_distance && <span>📏 {daySession.planned_distance} km</span>}
                {daySession.planned_duration && <span>⏱️ {daySession.planned_duration} min</span>}
                {daySession.planned_pace && <span>⚡ {daySession.planned_pace}/km</span>}
              </div>
              {daySession.completed && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <div className="text-xs font-semibold mb-2 opacity-60">✓ Wyniki</div>
                  <div className="flex flex-wrap gap-4 text-sm font-medium">
                    {daySession.actual_distance && <span>📏 {daySession.actual_distance} km</span>}
                    {daySession.actual_duration && <span>⏱️ {daySession.actual_duration} min</span>}
                    {daySession.actual_pace && <span>⚡ {daySession.actual_pace}/km</span>}
                    {daySession.avg_hr && <span>❤️ {daySession.avg_hr} bpm</span>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-5xl mb-4">🎉</div>
              <div className="font-semibold text-lg mb-1">Wolny dzień</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak zaplanowanego treningu</div>
            </div>
          )}

          {isPastOrToday && (
            <div className="space-y-2">
              {/* Text feedback */}
              {activeTextFeedback ? (
                <TextFeedbackCard feedback={activeTextFeedback} onEdit={() => openModal('text', true)} />
              ) : (
                <button onClick={() => openModal('text', false)}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all active:scale-95"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#FF5C1B' }}>
                  📝 Dodaj feedback po treningu
                </button>
              )}

              {/* Voice feedback */}
              {activeVoiceFeedback ? (
                <VoiceFeedbackCard feedback={activeVoiceFeedback} onEdit={() => openModal('voice', true)} />
              ) : (
                <button onClick={() => openModal('voice', false)}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all active:scale-95"
                  style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                  🎤 Nagraj komentarz głosowy
                </button>
              )}

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
                      {ws?.completed
                        ? <span className="text-green-400 text-xs">✓</span>
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
        athleteId={athlete.id}
        coachId={athlete.coach_id}
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
