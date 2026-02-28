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

export default function AthleteTodayPage() {
  const athlete = athletes.find(a => a.id === ATHLETE_ID)!
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackTab, setFeedbackTab] = useState('voice')
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [textFeedback, setTextFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const daySession = sessions.find(s => s.athleteId === ATHLETE_ID && s.date === selectedDate)
  const isPast = selectedDate <= TODAY

  function navigate(delta: number) {
    setSelectedDate(d => shiftDate(d, delta))
    setFeedbackOpen(false)
    setRecorded(false)
    setTextFeedback('')
    setFeedbackTab('voice')
    setSubmitted(false)
  }

  function handleRecord() {
    setRecording(true)
    setTimeout(() => { setRecording(false); setRecorded(true) }, 3000)
  }

  function handleSubmit() {
    setSubmitted(true)
    setFeedbackOpen(false)
    setRecorded(false)
    setTextFeedback('')
    setFeedbackTab('voice')
  }

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header z nawigacją dni */}
      <div className="px-5 pt-12 pb-5 lg:px-8 lg:pt-8" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Cześć, {athlete.name.split(' ')[0]}! 👋</div>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          >←</button>
          <div className="text-center flex-1">
            <div className="text-xl font-bold">{dayLabel(selectedDate)}</div>
            {selectedDate !== TODAY && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fullDate(selectedDate)}</div>
            )}
          </div>
          <button
            onClick={() => navigate(1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          >→</button>
        </div>
        {selectedDate !== TODAY && (
          <button
            onClick={() => { setSelectedDate(TODAY); setSubmitted(false) }}
            className="mt-3 w-full text-xs py-1.5 rounded-lg cursor-pointer"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          >Wróć do dziś</button>
        )}
      </div>

      {/* Karta treningu */}
      <div className="px-5 pt-5 lg:px-8 lg:pt-6 lg:max-w-2xl">
        {daySession ? (
          <div className={`p-5 rounded-2xl border ${intensityColor(daySession.type)}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                  {sessionTypeLabel(daySession.type)}
                </div>
                <h2 className="text-xl font-bold">{daySession.title}</h2>
              </div>
              <div className="text-3xl">🏃</div>
            </div>

            <p className="text-sm opacity-80 mb-4">{daySession.description}</p>

            {/* Plan */}
            <div className="flex flex-wrap gap-4 text-sm font-semibold mb-4">
              {daySession.plannedDistance && <span>📏 {daySession.plannedDistance} km</span>}
              {daySession.plannedDuration && <span>⏱️ {daySession.plannedDuration} min</span>}
              {daySession.plannedPace && <span>⚡ {daySession.plannedPace}/km</span>}
            </div>

            {/* Wyniki (jeśli wykonany) */}
            {daySession.completed && (
              <div className="mb-5 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs font-semibold mb-2 opacity-70">✓ Wykonany</div>
                <div className="flex flex-wrap gap-4 text-sm">
                  {daySession.actualDistance && <span>📏 {daySession.actualDistance} km</span>}
                  {daySession.actualDuration && <span>⏱️ {daySession.actualDuration} min</span>}
                  {daySession.actualPace && <span>⚡ {daySession.actualPace}/km</span>}
                  {daySession.avgHR && <span>❤️ {daySession.avgHR} bpm</span>}
                </div>
              </div>
            )}

            {/* Feedback — tylko dla dni przeszłych/dziś, niewykonanych */}
            {isPast && !daySession.completed && (
              submitted ? (
                <div className="text-center py-3 rounded-2xl text-sm font-medium text-green-400" style={{ background: 'rgba(46,204,113,0.1)' }}>
                  ✓ Feedback wysłany! Trener go zobaczy.
                </div>
              ) : (
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95 cursor-pointer"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  🎤 Daj feedback po treningu
                </button>
              )
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

      {/* Feedback Modal */}
      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Feedback po treningu" size="sm">
        <Tabs
          tabs={[{ id: 'voice', label: '🎤 Głosowy' }, { id: 'text', label: '✏️ Tekst' }]}
          active={feedbackTab}
          onChange={setFeedbackTab}
          className="mb-4"
        />
        {feedbackTab === 'voice' && (
          <div className="text-center py-6">
            {!recording && !recorded && (
              <>
                <div className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Naciśnij przycisk i mów przez 15–30 sekund o tym jak poszedł trening</div>
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
                <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center animate-pulse" style={{ background: 'rgba(231,76,60,0.2)', border: '2px solid #E74C3C' }}>
                  <span className="text-4xl">🔴</span>
                </div>
                <div className="text-sm" style={{ color: '#E74C3C' }}>Nagrywam... mów swobodnie</div>
              </div>
            )}
            {recorded && (
              <div className="space-y-4">
                <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(46,204,113,0.1)', border: '2px solid #2ECC71' }}>
                  <span className="text-4xl">✓</span>
                </div>
                <div className="text-sm text-green-400">Nagranie gotowe!</div>
                <div className="p-3 rounded-xl text-sm italic" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  "Trening poszedł świetnie, czuję się dobrze, nogi miałam trochę ciężkie na początku ale potem się rozkręciłam..."
                </div>
                <Button className="w-full" onClick={handleSubmit}>Wyślij feedback</Button>
              </div>
            )}
          </div>
        )}
        {feedbackTab === 'text' && (
          <div className="space-y-4">
            <textarea
              value={textFeedback}
              onChange={e => setTextFeedback(e.target.value)}
              placeholder="Napisz jak poszedł dzisiejszy trening. Jak się czułeś/aś? Czy były jakieś problemy?"
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              autoFocus
            />
            <Button className="w-full" onClick={handleSubmit} disabled={!textFeedback.trim()}>Wyślij feedback</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
