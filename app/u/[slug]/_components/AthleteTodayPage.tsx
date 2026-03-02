'use client'

import { useState, useRef, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { intensityColor, sessionTypeLabel, formatDate, getWeekDays, toISODate } from '@/lib/utils'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'
import { createFeedback, updateFeedback } from '@/lib/actions/feedback'
import { PWAInstallBanner } from '@/components/ui/PWAInstallBanner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>

interface Props {
  athlete: AthleteSession
  sessions: DbRow[]
  feedbacks: Record<string, DbRow>
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

const FEELINGS = [
  { emoji: '😫', label: 'Fatalnie' },
  { emoji: '😕', label: 'Słabo' },
  { emoji: '😐', label: 'Średnio' },
  { emoji: '😊', label: 'Dobrze' },
  { emoji: '🤩', label: 'Świetnie' },
]
const FEELING_LABEL: Record<string, string> = Object.fromEntries(FEELINGS.map(f => [f.emoji, f.label]))
const INTENSITIES = ['Bardzo lekki', 'Lekki', 'Umiarkowany', 'Ciężki', 'Bardzo ciężki', 'Maksymalny']
const TRAINING_TYPES = ['Easy / Rozbieganie', 'Interwały', 'Tempo', 'Long Run', 'Siłownia', 'Crosstraining', 'Inny']
const INPUT_STYLE = { background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }

interface FeedbackData {
  feeling?: string
  trainingType?: string
  distanceKm?: string
  durationMin?: string
  intensity?: string
  notes?: string
  voiceTranscript?: string
}

function parseTranscript(t: string): FeedbackData {
  const r: FeedbackData = {}
  for (const part of t.split(' | ')) {
    if (part.startsWith('Samopoczucie: ')) r.feeling = part.slice(14)
    else if (part.startsWith('Typ: ')) r.trainingType = part.slice(5)
    else if (part.startsWith('Dystans: ')) r.distanceKm = part.slice(9).replace(' km', '')
    else if (part.startsWith('Czas: ')) r.durationMin = part.slice(6).replace(' min', '')
    else if (part.startsWith('Intensywność: ')) r.intensity = part.slice(14)
    else if (part.startsWith('Notatka: ')) r.notes = part.slice(9)
  }
  return r
}

function dbRowToFeedback(fb: DbRow): FeedbackData {
  // ai_analysis = voice transcript (new); fallback: transcript for old voice-only rows
  const voice = fb.ai_analysis || (fb.source === 'voice' ? fb.transcript : '') || ''
  const textSummary = fb.source !== 'voice' ? (fb.transcript ?? '') : ''
  return { ...parseTranscript(textSummary), voiceTranscript: voice || undefined }
}

function FeedbackCard({ feedback, onEdit }: { feedback: FeedbackData; onEdit: () => void }) {
  const hasText = !!(feedback.feeling || feedback.trainingType || feedback.distanceKm || feedback.durationMin || feedback.intensity || feedback.notes)
  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">📝 Twój feedback</span>
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
      {feedback.voiceTranscript && (
        <p className="text-sm italic"
          style={{ color: 'var(--text-muted)', marginTop: hasText ? '10px' : '0', paddingTop: hasText ? '10px' : '0', borderTop: hasText ? '1px solid var(--border)' : 'none' }}>
          🎤 {feedback.voiceTranscript}
        </p>
      )}
    </div>
  )
}

export function AthleteTodayPage({ athlete, sessions, feedbacks, today }: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(today)
  const [optimisticFeedback, setOptimisticFeedback] = useState<FeedbackData | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [feeling, setFeeling] = useState('')
  const [trainingType, setTrainingType] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [intensity, setIntensity] = useState('')
  const [notes, setNotes] = useState('')
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const daySession = sessions.find(s => s.date === selectedDate)
  const dayFeedback = feedbacks[selectedDate] ?? null
  const activeFeedback: FeedbackData | null = optimisticFeedback ?? (dayFeedback ? dbRowToFeedback(dayFeedback) : null)
  const isPastOrToday = selectedDate <= today
  const weekDays = getWeekDays(0)

  function navigate(delta: number) {
    setSelectedDate(d => shiftDate(d, delta))
    setOptimisticFeedback(null)
    setRecorded(false)
    setVoiceTranscript('')
  }

  function selectDay(dateStr: string) {
    setSelectedDate(dateStr)
    setOptimisticFeedback(null)
    setRecorded(false)
    setVoiceTranscript('')
  }

  function openModal(editing: boolean) {
    if (editing && dayFeedback) {
      const fd = dbRowToFeedback(dayFeedback)
      setFeeling(fd.feeling ?? '')
      setTrainingType(fd.trainingType ?? '')
      setDistanceKm(fd.distanceKm ?? '')
      setDurationMin(fd.durationMin ?? '')
      setIntensity(fd.intensity ?? '')
      setNotes(fd.notes ?? '')
      setVoiceTranscript(fd.voiceTranscript ?? '')
      setRecorded(!!(fd.voiceTranscript))
    } else {
      setFeeling(''); setTrainingType(''); setDistanceKm('')
      setDurationMin(''); setIntensity(''); setNotes('')
      setVoiceTranscript('')
      setRecorded(false)
    }
    setFeedbackOpen(true)
  }

  async function submitFeedback() {
    if (submitting) return
    setSubmitting(true)
    const fd = new FormData()
    fd.set('athlete_id', athlete.id)
    fd.set('coach_id', athlete.coach_id)
    fd.set('slug', athlete.slug)
    fd.set('date', selectedDate)
    fd.set('feeling', feeling)
    fd.set('training_type', trainingType)
    fd.set('distance_km', distanceKm)
    fd.set('duration_min', durationMin)
    fd.set('intensity', intensity)
    fd.set('notes', notes)
    fd.set('voice_transcript', voiceTranscript)
    if (daySession?.id) fd.set('session_id', daySession.id)

    let result
    if (dayFeedback?.id) {
      fd.set('id', dayFeedback.id)
      result = await updateFeedback(fd)
    } else {
      result = await createFeedback(fd)
    }
    setSubmitting(false)
    if (result?.error) { alert('Błąd zapisu: ' + result.error); return }

    setOptimisticFeedback({ feeling, trainingType, distanceKm, durationMin, intensity, notes, voiceTranscript: voiceTranscript || undefined })
    setFeedbackOpen(false)
    setRecorded(false)
    setVoiceTranscript('')
    startTransition(() => router.refresh())
  }

  async function handleRecord() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      alert('Brak dostępu do mikrofonu. Zezwól na dostęp w ustawieniach przeglądarki.')
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Twoja przeglądarka nie obsługuje nagrywania głosu. Użyj Chrome na Androidzie lub Safari na iOS.')
      return
    }
    const recognition = new SR()
    recognition.lang = 'pl-PL'
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition
    setVoiceTranscript('')
    setRecording(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(' ')
      setVoiceTranscript(text)
    }
    recognition.onend = () => { setRecording(false); setRecorded(true) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      setRecording(false)
      if (e.error !== 'aborted') alert('Błąd nagrywania. Sprawdź uprawnienia mikrofonu.')
    }
    try { recognition.start() } catch { setRecording(false); alert('Nie można uruchomić nagrywania.') }
  }

  function stopRecord() { recognitionRef.current?.stop() }

  const canSave = !!(feeling || trainingType || distanceKm || durationMin || intensity || notes.trim() || voiceTranscript.trim())

  const modalFooter = (
    <Button className="w-full" onClick={submitFeedback} disabled={!canSave || submitting}>
      {submitting ? 'Zapisywanie...' : 'Zapisz feedback'}
    </Button>
  )

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
            activeFeedback ? (
              <div className="space-y-2">
                <FeedbackCard feedback={activeFeedback} onEdit={() => openModal(true)} />
                {dayFeedback?.coach_reply && (
                  <div className="p-4 rounded-2xl" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: '#2ECC71' }}>💬 Odpowiedź trenera</div>
                    <p className="text-sm">{dayFeedback.coach_reply}</p>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => openModal(false)}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all active:scale-95"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#FF5C1B' }}>
                📝 Dodaj feedback po treningu
              </button>
            )
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

          {dayFeedback?.coach_reply && (
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: '#2ECC71' }}>💬 Odpowiedź trenera</div>
              <p className="text-sm">{dayFeedback.coach_reply}</p>
              {dayFeedback.date && (
                <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(dayFeedback.date, { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Feedback po treningu" size="sm" footer={modalFooter}>
        <div className="space-y-4">
          {/* Feeling */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Samopoczucie</label>
            <div className="flex gap-1.5">
              {FEELINGS.map(f => (
                <button key={f.emoji} onClick={() => setFeeling(feeling === f.emoji ? '' : f.emoji)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: feeling === f.emoji ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                    border: feeling === f.emoji ? '1px solid rgba(255,92,27,0.5)' : '1px solid transparent',
                    color: feeling === f.emoji ? '#FF5C1B' : 'var(--text-muted)',
                  }}>
                  <span className="text-2xl">{f.emoji}</span>
                  <span style={{ fontSize: '10px' }}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Training type */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Rodzaj treningu</label>
            <select value={trainingType} onChange={e => setTrainingType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm cursor-pointer" style={INPUT_STYLE}>
              <option value="">— wybierz —</option>
              {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Distance + duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Dystans (km)</label>
              <input type="number" value={distanceKm} onChange={e => setDistanceKm(e.target.value)}
                placeholder="np. 10.5" min="0" step="0.1"
                className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
              <input type="number" value={durationMin} onChange={e => setDurationMin(e.target.value)}
                placeholder="np. 55" min="0"
                className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Jak ciężki był trening?</label>
            <div className="grid grid-cols-3 gap-2">
              {INTENSITIES.map(lvl => (
                <button key={lvl} onClick={() => setIntensity(intensity === lvl ? '' : lvl)}
                  className="py-2 px-1 rounded-xl text-xs font-medium cursor-pointer transition-all text-center"
                  style={{
                    background: intensity === lvl ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                    border: intensity === lvl ? '1px solid rgba(255,92,27,0.5)' : '1px solid transparent',
                    color: intensity === lvl ? '#FF5C1B' : 'var(--text-muted)',
                  }}>{lvl}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Notatki (opcjonalnie)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Jak poszedł trening?" rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" style={INPUT_STYLE} />
          </div>

          {/* Voice section divider */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>🎤 Nagranie głosowe</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Voice: idle */}
          {!recording && !recorded && (
            <button onClick={handleRecord}
              className="w-full py-3 rounded-xl text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
              style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-mid)', color: 'var(--text-muted)' }}>
              🎤 Nagraj wiadomość głosową (opcjonalnie)
            </button>
          )}

          {/* Voice: recording */}
          {recording && (
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.3)' }}>
              <div className="flex items-center gap-2">
                <span className="animate-pulse text-sm">🔴</span>
                <span className="text-sm font-medium" style={{ color: '#E74C3C' }}>Nagrywam...</span>
                <button onClick={stopRecord}
                  className="ml-auto text-xs px-3 py-1 rounded-lg cursor-pointer font-medium"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
                  ⏹ Zatrzymaj
                </button>
              </div>
              {voiceTranscript && (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{voiceTranscript}</p>
              )}
            </div>
          )}

          {/* Voice: recorded — editable */}
          {recorded && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-green-400">✓ Nagranie gotowe — możesz poprawić tekst</span>
                <button onClick={() => { setRecorded(false); setVoiceTranscript('') }}
                  className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}>
                  🔄 Nagraj ponownie
                </button>
              </div>
              <textarea
                value={voiceTranscript}
                onChange={e => setVoiceTranscript(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style={INPUT_STYLE}
                placeholder="Transkrypcja nagrania..."
              />
            </div>
          )}
        </div>
      </Modal>

      <PWAInstallBanner />
      <AthleteBottomNav slug={athlete.slug} />
    </div>
  )
}
