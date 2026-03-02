'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { intensityColor, sessionTypeLabel, formatDate, getWeekDays, toISODate } from '@/lib/utils'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>

interface Props {
  athlete: AthleteSession
  sessions: DbRow[]
  recentFeedback: DbRow | null
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
  source: 'voice' | 'text'
  feeling?: string
  trainingType?: string
  distanceKm?: string
  durationMin?: string
  intensity?: string
  notes?: string
  voiceTranscript?: string
}

function FeedbackCard({ feedback, onEdit }: { feedback: FeedbackData; onEdit: () => void }) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">📝 Twój feedback</span>
        <button onClick={onEdit} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>✏️ Edytuj</button>
      </div>
      {feedback.source === 'voice' ? (
        <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>🎤 "{feedback.voiceTranscript}"</p>
      ) : (
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
    </div>
  )
}

export function AthleteTodayPage({ athlete, sessions, recentFeedback, today }: Props) {
  const [selectedDate, setSelectedDate] = useState(today)
  const [savedFeedback, setSavedFeedback] = useState<FeedbackData | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackTab, setFeedbackTab] = useState('text')

  const [feeling, setFeeling] = useState('')
  const [trainingType, setTrainingType] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [intensity, setIntensity] = useState('')
  const [notes, setNotes] = useState('')
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)

  const daySession = sessions.find(s => s.date === selectedDate)
  const isPastOrToday = selectedDate <= today
  const weekDays = getWeekDays(0)

  function navigate(delta: number) {
    setSelectedDate(d => shiftDate(d, delta))
    setSavedFeedback(null)
    setRecorded(false)
  }

  function selectDay(dateStr: string) {
    setSelectedDate(dateStr)
    setSavedFeedback(null)
    setRecorded(false)
  }

  function openModal(editing: boolean) {
    if (editing && savedFeedback?.source === 'text') {
      setFeeling(savedFeedback.feeling ?? '')
      setTrainingType(savedFeedback.trainingType ?? '')
      setDistanceKm(savedFeedback.distanceKm ?? '')
      setDurationMin(savedFeedback.durationMin ?? '')
      setIntensity(savedFeedback.intensity ?? '')
      setNotes(savedFeedback.notes ?? '')
      setFeedbackTab('text')
    } else if (editing && savedFeedback?.source === 'voice') {
      setFeedbackTab('voice')
      setRecorded(true)
    } else {
      setFeeling(''); setTrainingType(''); setDistanceKm('')
      setDurationMin(''); setIntensity(''); setNotes('')
      setRecorded(false)
      setFeedbackTab('text')
    }
    setFeedbackOpen(true)
  }

  function submitText() {
    setSavedFeedback({ source: 'text', feeling, trainingType, distanceKm, durationMin, intensity, notes })
    setFeedbackOpen(false)
  }

  function submitVoice() {
    setSavedFeedback({ source: 'voice', voiceTranscript: 'Trening poszedł świetnie...' })
    setFeedbackOpen(false)
    setRecorded(false)
  }

  function handleRecord() {
    setRecording(true)
    setTimeout(() => { setRecording(false); setRecorded(true) }, 3000)
  }

  const textFormHasData = !!(feeling || trainingType || distanceKm || durationMin || intensity || notes.trim())

  const modalFooter =
    feedbackTab === 'text' ? (
      <Button className="w-full" onClick={submitText} disabled={!textFormHasData}>Zapisz feedback</Button>
    ) : feedbackTab === 'voice' && recorded ? (
      <Button className="w-full" onClick={submitVoice}>Wyślij feedback głosowy</Button>
    ) : null

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

          {isPastOrToday && daySession && !daySession.completed && (
            savedFeedback ? (
              <FeedbackCard feedback={savedFeedback} onEdit={() => openModal(true)} />
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
          {/* Week mini-calendar */}
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

          {/* Last coach reply */}
          {recentFeedback?.coach_reply && (
            <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>💬 Odpowiedź trenera</div>
              <p className="text-sm">{recentFeedback.coach_reply}</p>
              {recentFeedback.date && (
                <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(recentFeedback.date, { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Feedback po treningu" size="sm" footer={modalFooter}>
        <Tabs
          tabs={[{ id: 'text', label: '📝 Formularz' }, { id: 'voice', label: '🎤 Głosowy' }]}
          active={feedbackTab}
          onChange={setFeedbackTab}
          className="mb-5"
        />

        {feedbackTab === 'text' && (
          <div className="space-y-5">
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
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Rodzaj treningu</label>
              <select value={trainingType} onChange={e => setTrainingType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm cursor-pointer" style={INPUT_STYLE}>
                <option value="">— wybierz —</option>
                {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
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
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Własne notatki (opcjonalnie)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Jak poszedł trening?" rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" style={INPUT_STYLE} />
            </div>
          </div>
        )}

        {feedbackTab === 'voice' && (
          <div className="text-center py-6">
            {!recording && !recorded && (
              <>
                <div className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  Naciśnij przycisk i mów przez 15–30 sekund
                </div>
                <button onClick={handleRecord}
                  className="w-24 h-24 rounded-full text-4xl mx-auto flex items-center justify-center cursor-pointer active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #FF5C1B, #FF7A42)', boxShadow: '0 0 40px rgba(255,92,27,0.4)' }}>
                  🎤
                </button>
                <div className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>Naciśnij aby nagrać</div>
              </>
            )}
            {recording && (
              <div className="space-y-4">
                <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center animate-pulse"
                  style={{ background: 'rgba(231,76,60,0.2)', border: '2px solid #E74C3C' }}>
                  <span className="text-4xl">🔴</span>
                </div>
                <div className="text-sm" style={{ color: '#E74C3C' }}>Nagrywam... mów swobodnie</div>
              </div>
            )}
            {recorded && (
              <div className="space-y-4">
                <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: 'rgba(46,204,113,0.1)', border: '2px solid #2ECC71' }}>
                  <span className="text-4xl">✓</span>
                </div>
                <div className="text-sm text-green-400">Nagranie gotowe!</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <AthleteBottomNav slug={athlete.slug} />
    </div>
  )
}
