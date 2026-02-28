'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { athletes, sessions, feedbacks as allFeedbacks } from '@/lib/data'
import { formatDate, intensityColor } from '@/lib/utils'
import Link from 'next/link'

const ATHLETE_ID = 'a1'

export default function AthleteTodayPage() {
  const athlete = athletes.find(a => a.id === ATHLETE_ID)!
  const todaySession = sessions.find(s => s.athleteId === ATHLETE_ID && s.date === '2026-02-28' && !s.completed)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackTab, setFeedbackTab] = useState('voice')
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [textFeedback, setTextFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

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

  const recentFeedback = allFeedbacks.filter(f => f.athleteId === ATHLETE_ID && f.coachReply).slice(0, 1)[0]

  const statsData = [
    ['🏃', 'Treningów', sessions.filter(s => s.athleteId === ATHLETE_ID && s.completed).length],
    ['📏', 'km łącznie', sessions.filter(s => s.athleteId === ATHLETE_ID && s.actualDistance).reduce((sum, s) => sum + (s.actualDistance || 0), 0).toFixed(0)],
    ['💬', 'Feedbacków', allFeedbacks.filter(f => f.athleteId === ATHLETE_ID).length],
  ] as const

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6 lg:px-8 lg:pt-8" style={{ background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-base) 100%)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sobota, 28 lutego 2026</div>
        <h1 className="text-2xl font-bold mb-1">Cześć, {athlete.name.split(' ')[0]}! 👋</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cel: {athlete.goal}</p>
      </div>

      {/* Desktop: 2-column grid. Mobile: stacked */}
      <div className="px-5 lg:px-8 lg:py-6">
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">

          {/* Left column */}
          <div className="space-y-4">
            {/* Today's session */}
            {todaySession ? (
              <div className={`p-5 rounded-2xl border ${intensityColor(todaySession.type)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Trening na dziś</div>
                    <h2 className="text-xl font-bold">{todaySession.title}</h2>
                  </div>
                  <div className="text-3xl">🏃</div>
                </div>
                <p className="text-sm opacity-80 mb-4">{todaySession.description}</p>
                <div className="flex gap-4 text-sm font-semibold mb-5">
                  {todaySession.plannedDistance && <span>📏 {todaySession.plannedDistance} km</span>}
                  {todaySession.plannedDuration && <span>⏱️ {todaySession.plannedDuration} min</span>}
                  {todaySession.plannedPace && <span>⚡ {todaySession.plannedPace}/km</span>}
                </div>
                {!submitted ? (
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    🎤 Daj feedback po treningu
                  </button>
                ) : (
                  <div className="text-center py-3 rounded-2xl text-sm font-medium text-green-400" style={{ background: 'rgba(46,204,113,0.1)' }}>
                    ✓ Feedback wysłany! Trener go zobaczy.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-4xl mb-3">🎉</div>
                <div className="font-semibold mb-1">Dziś wolne!</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Zaplanowany odpoczynek</div>
              </div>
            )}

            {/* This week preview */}
            <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Ten tydzień</div>
                <Link href="/athlete/plan" className="text-xs" style={{ color: '#FF5C1B' }}>Zobacz plan →</Link>
              </div>
              <div className="flex gap-2">
                {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day, i) => {
                  const dayDate = new Date('2026-02-23')
                  dayDate.setDate(dayDate.getDate() + i)
                  const dateStr = dayDate.toISOString().split('T')[0]
                  const daySession = sessions.find(s => s.athleteId === ATHLETE_ID && s.date === dateStr)
                  const isToday = dateStr === '2026-02-28'
                  return (
                    <div key={day} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl ${isToday ? 'ring-1 ring-orange-500' : ''}`} style={{ background: 'var(--bg-subtle)' }}>
                      <div className="text-xs" style={{ color: isToday ? '#FF5C1B' : 'var(--text-muted)' }}>{day}</div>
                      <div className="w-2 h-2 rounded-full" style={{
                        background: daySession ? (daySession.completed ? '#2ECC71' : isToday ? '#FF5C1B' : 'var(--text-muted)') : 'transparent'
                      }} />
                      <div className="text-xs font-bold" style={{ color: isToday ? '#FF5C1B' : 'var(--text-primary)' }}>{dayDate.getDate()}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Coach reply */}
            {recentFeedback && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>💬 Odpowiedź trenera</div>
                <p className="text-sm">{recentFeedback.coachReply}</p>
                <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>do feedbacku z {formatDate(recentFeedback.date, { day: 'numeric', month: 'short' })}</div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {statsData.map(([icon, label, value]) => (
                <div key={label} className="p-3 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-lg font-bold">{value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Desktop-only: quick links */}
            <div className="hidden lg:block p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Szybkie linki</div>
              <div className="space-y-2">
                <Link href="/athlete/plan" className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
                  <span>📅</span><span className="text-sm">Plan tygodniowy</span>
                </Link>
                <Link href="/athlete/history" className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
                  <span>📈</span><span className="text-sm">Historia treningów</span>
                </Link>
                <Link href="/athlete/chat" className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
                  <span>💬</span><span className="text-sm">Czat z trenerem</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
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
                <button onClick={handleRecord}
                  className="w-24 h-24 rounded-full text-4xl mx-auto flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #FF5C1B, #FF7A42)', boxShadow: '0 0 40px rgba(255,92,27,0.4)' }}>
                  🎤
                </button>
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
