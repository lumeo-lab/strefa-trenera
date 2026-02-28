'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { athletes, sessions } from '@/lib/data'
import { intensityColor, sessionTypeLabel } from '@/lib/utils'

const ATHLETE_ID = 'a1'
const TODAY = '2026-02-28'

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dayLabel(dateStr: string): string {
  if (dateStr === TODAY) return 'Dziś'
  if (dateStr === shiftDate(TODAY, -1)) return 'Wczoraj'
  if (dateStr === shiftDate(TODAY, 1)) return 'Jutro'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function fullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

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

// ─── Feedback card displayed inside session card ───────────────────────────
function FeedbackCard({ feedback, onEdit }: { feedback: FeedbackData; onEdit: () => void }) {
  return (
    <div className="mb-4 rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold opacity-60">📝 Twój feedback</span>
        <button
          onClick={onEdit}
          className="text-xs px-2.5 py-1 rounded-lg cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}
        >✏️ Edytuj</button>
      </div>

      {feedback.source === 'voice' ? (
        <p className="text-sm italic opacity-80">🎤 "{feedback.voiceTranscript}"</p>
      ) : (
        <div className="space-y-1.5">
          {/* Samopoczucie + intensywność */}
          {(feedback.feeling || feedback.intensity) && (
            <div className="flex flex-wrap gap-3 text-sm">
              {feedback.feeling && (
                <span>{feedback.feeling} <span className="opacity-70">{FEELING_LABEL[feedback.feeling]}</span></span>
              )}
              {feedback.intensity && (
                <span className="opacity-60">· {feedback.intensity}</span>
              )}
            </div>
          )}
          {/* Dane liczbowe */}
          {(feedback.trainingType || feedback.distanceKm || feedback.durationMin) && (
            <div className="flex flex-wrap gap-3 text-xs opacity-70">
              {feedback.trainingType && <span>🏃 {feedback.trainingType}</span>}
              {feedback.distanceKm && <span>📏 {feedback.distanceKm} km</span>}
              {feedback.durationMin && <span>⏱️ {feedback.durationMin} min</span>}
            </div>
          )}
          {/* Notatka */}
          {feedback.notes && (
            <p className="text-xs italic opacity-70">"{feedback.notes}"</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function AthleteTodayPage() {
  const athlete = athletes.find(a => a.id === ATHLETE_ID)!
  const [selectedDate, setSelectedDate] = useState(TODAY)

  // Saved feedback (per day — in a real app this would be per session id)
  const [savedFeedback, setSavedFeedback] = useState<FeedbackData | null>(null)

  // Modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackTab, setFeedbackTab] = useState('text')

  // Text form draft
  const [feeling, setFeeling] = useState('')
  const [trainingType, setTrainingType] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [intensity, setIntensity] = useState('')
  const [notes, setNotes] = useState('')

  // Voice
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)

  const daySession = sessions.find(s => s.athleteId === ATHLETE_ID && s.date === selectedDate)
  const isPastOrToday = selectedDate <= TODAY

  function navigate(delta: number) {
    setSelectedDate(d => shiftDate(d, delta))
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
      // new feedback — reset form
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

  function handleRecord() {
    setRecording(true)
    setTimeout(() => { setRecording(false); setRecorded(true) }, 3000)
  }

  function submitVoice() {
    setSavedFeedback({
      source: 'voice',
      voiceTranscript: 'Trening poszedł świetnie, czuję się dobrze, nogi miałam trochę ciężkie na początku ale potem się rozkręciłam...',
    })
    setFeedbackOpen(false)
    setRecorded(false)
  }

  const textFormHasData = !!(feeling || trainingType || distanceKm || durationMin || intensity || notes.trim())

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* ── Header z nawigacją dni ── */}
      <div className="px-5 pt-12 pb-5 lg:px-8 lg:pt-8" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Cześć, {athlete.name.split(' ')[0]}! 👋</div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>←</button>
          <div className="text-center flex-1">
            <div className="text-xl font-bold">{dayLabel(selectedDate)}</div>
            {selectedDate !== TODAY && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fullDate(selectedDate)}</div>
            )}
          </div>
          <button onClick={() => navigate(1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>→</button>
        </div>
        {selectedDate !== TODAY && (
          <button onClick={() => { setSelectedDate(TODAY); setSavedFeedback(null) }}
            className="mt-3 w-full text-xs py-1.5 rounded-lg cursor-pointer"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
            Wróć do dziś
          </button>
        )}
      </div>

      {/* ── Karta treningu ── */}
      <div className="px-5 pt-5 lg:px-8 lg:pt-6 lg:max-w-2xl">
        {daySession ? (
          <div className={`p-5 rounded-2xl border ${intensityColor(daySession.type)}`}>
            {/* Nagłówek */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-60">
                  {sessionTypeLabel(daySession.type)}
                </div>
                <h2 className="text-xl font-bold">{daySession.title}</h2>
              </div>
              <div className="text-3xl">🏃</div>
            </div>

            {/* Opis */}
            <p className="text-sm opacity-80 mb-4">{daySession.description}</p>

            {/* ── FEEDBACK (pod opisem) ── */}
            {isPastOrToday && !daySession.completed && (
              savedFeedback
                ? <FeedbackCard feedback={savedFeedback} onEdit={() => openModal(true)} />
                : (
                  <button
                    onClick={() => openModal(false)}
                    className="w-full py-3 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95 cursor-pointer mb-4"
                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    📝 Dodaj feedback po treningu
                  </button>
                )
            )}

            {/* Parametry planu */}
            <div className="flex flex-wrap gap-4 text-sm font-semibold">
              {daySession.plannedDistance && <span>📏 {daySession.plannedDistance} km</span>}
              {daySession.plannedDuration && <span>⏱️ {daySession.plannedDuration} min</span>}
              {daySession.plannedPace && <span>⚡ {daySession.plannedPace}/km</span>}
            </div>

            {/* Wyniki wykonanego treningu */}
            {daySession.completed && (
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs font-semibold mb-2 opacity-60">✓ Wykonany</div>
                <div className="flex flex-wrap gap-4 text-sm">
                  {daySession.actualDistance && <span>📏 {daySession.actualDistance} km</span>}
                  {daySession.actualDuration && <span>⏱️ {daySession.actualDuration} min</span>}
                  {daySession.actualPace && <span>⚡ {daySession.actualPace}/km</span>}
                  {daySession.avgHR && <span>❤️ {daySession.avgHR} bpm</span>}
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
      </div>

      {/* ── Modal feedbacku ── */}
      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Feedback po treningu" size="sm">
        <Tabs
          tabs={[{ id: 'text', label: '📝 Formularz' }, { id: 'voice', label: '🎤 Głosowy' }]}
          active={feedbackTab}
          onChange={setFeedbackTab}
          className="mb-5"
        />

        {/* ── Zakładka: Formularz ── */}
        {feedbackTab === 'text' && (
          <div className="space-y-5">

            {/* Samopoczucie */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Samopoczucie
              </label>
              <div className="flex gap-1.5">
                {FEELINGS.map(f => (
                  <button
                    key={f.emoji}
                    onClick={() => setFeeling(feeling === f.emoji ? '' : f.emoji)}
                    className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: feeling === f.emoji ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                      border: feeling === f.emoji ? '1px solid rgba(255,92,27,0.5)' : '1px solid transparent',
                      color: feeling === f.emoji ? '#FF5C1B' : 'var(--text-muted)',
                    }}
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <span style={{ fontSize: '10px' }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rodzaj treningu */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Rodzaj treningu
              </label>
              <select
                value={trainingType}
                onChange={e => setTrainingType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm cursor-pointer"
                style={INPUT_STYLE}
              >
                <option value="">— wybierz —</option>
                {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Dystans + czas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Dystans (km)
                </label>
                <input
                  type="number"
                  value={distanceKm}
                  onChange={e => setDistanceKm(e.target.value)}
                  placeholder="np. 10.5"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Czas trwania (min)
                </label>
                <input
                  type="number"
                  value={durationMin}
                  onChange={e => setDurationMin(e.target.value)}
                  placeholder="np. 55"
                  min="0"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            {/* Jak ciężki był trening */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Jak ciężki był trening?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {INTENSITIES.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setIntensity(intensity === lvl ? '' : lvl)}
                    className="py-2 px-1 rounded-xl text-xs font-medium cursor-pointer transition-all text-center"
                    style={{
                      background: intensity === lvl ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                      border: intensity === lvl ? '1px solid rgba(255,92,27,0.5)' : '1px solid transparent',
                      color: intensity === lvl ? '#FF5C1B' : 'var(--text-muted)',
                    }}
                  >{lvl}</button>
                ))}
              </div>
            </div>

            {/* Własne notatki */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Własne notatki (opcjonalnie)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Jak poszedł trening? Co czułeś/aś? Cokolwiek chcesz przekazać trenerowi..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style={INPUT_STYLE}
              />
            </div>

            <Button className="w-full" onClick={submitText} disabled={!textFormHasData}>
              Zapisz feedback
            </Button>
          </div>
        )}

        {/* ── Zakładka: Głosowy ── */}
        {feedbackTab === 'voice' && (
          <div className="text-center py-6">
            {!recording && !recorded && (
              <>
                <div className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  Naciśnij przycisk i mów przez 15–30 sekund o tym jak poszedł trening
                </div>
                <button
                  onClick={handleRecord}
                  className="w-24 h-24 rounded-full text-4xl mx-auto flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #FF5C1B, #FF7A42)', boxShadow: '0 0 40px rgba(255,92,27,0.4)' }}
                >🎤</button>
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
                <div className="p-3 rounded-xl text-sm italic" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  "Trening poszedł świetnie, czuję się dobrze, nogi miałam trochę ciężkie na początku ale potem się rozkręciłam..."
                </div>
                <Button className="w-full" onClick={submitVoice}>Wyślij feedback</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
