'use client'
import { useState } from 'react'
import { use } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { athletes, sessions as allSessions, feedbacks, invoices } from '@/lib/data'
import {
  formatDate, formatCurrency, intensityColor, sessionTypeLabel,
  invoiceStatusColor, invoiceStatusLabel, signalColor, getWeekDays, toISODate, dayName, isToday, isPast,
} from '@/lib/utils'
import { Session, SessionType } from '@/lib/types'
import Link from 'next/link'

const TODAY = '2026-02-28'
const SESSION_TYPES: SessionType[] = ['easy', 'interval', 'tempo', 'long', 'rest', 'gym']

// ── Helpers ───────────────────────────────────────────────────────────────

function shiftMonth(m: string, d: number): string {
  const [y, mo] = m.split('-').map(Number)
  const dt = new Date(y, mo - 1 + d, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

function getMonthCalendar(monthStr: string): (string | null)[][] {
  const [y, mo] = monthStr.split('-').map(Number)
  const daysInMonth = new Date(y, mo, 0).getDate()
  const startDow = (new Date(y, mo - 1, 1).getDay() + 6) % 7
  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${monthStr}-${String(d).padStart(2, '0')}`)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

interface SessionDraft {
  title: string; type: SessionType; description: string
  plannedDistance: string; plannedDuration: string; plannedPace: string
}

const emptyDraft = (): SessionDraft => ({
  title: '', type: 'easy', description: '', plannedDistance: '', plannedDuration: '', plannedPace: '',
})

// ── Component ─────────────────────────────────────────────────────────────

export default function AthleteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState('plan')

  const athlete = athletes.find(a => a.id === id)
  if (!athlete) return <div className="p-6">Zawodnik nie znaleziony</div>

  const athleteFeedbacks = feedbacks.filter(f => f.athleteId === id).sort((a, b) => b.date.localeCompare(a.date))
  const athleteInvoices = invoices.filter(i => i.athleteId === id).sort((a, b) => b.date.localeCompare(a.date))

  // ── Local sessions state (supports add/edit/delete) ──
  const [sessions, setSessions] = useState<Session[]>(() =>
    allSessions.filter(s => s.athleteId === id)
  )

  // ── Feedback lookup by sessionId ──
  const feedbackBySession = Object.fromEntries(athleteFeedbacks.map(f => [f.sessionId, f]))

  // ── Plan view state ──
  const [planView, setPlanView] = useState<'week' | 'month'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState('2026-02')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // ── Session modal ──
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [draftDate, setDraftDate] = useState('')
  const [draft, setDraft] = useState<SessionDraft>(emptyDraft())

  // ── Expanded feedback rows ──
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  function toggleRow(sessionId: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId)
      return next
    })
  }

  // ── Notes state ──
  const [coachNotes, setCoachNotes] = useState(athlete.coachNotes)
  const [notesSaved, setNotesSaved] = useState(false)

  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'history', label: 'Historia' },
    { id: 'data', label: 'Dane' },
    { id: 'notes', label: 'Notatki' },
    { id: 'finance', label: 'Finanse' },
  ]

  const completedSessions = sessions.filter(s => s.completed && s.actualDistance)
  const totalKm = completedSessions.reduce((sum, s) => sum + (s.actualDistance || 0), 0)
  const totalPaid = athleteInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const monthsActive = Math.ceil((new Date(TODAY).getTime() - new Date(athlete.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))

  // ── Session modal handlers ──
  function openNewSession(date: string) {
    setDraftDate(date)
    setDraft(emptyDraft())
    setEditingSession(null)
    setSessionModalOpen(true)
  }

  function openEditSession(session: Session) {
    setDraftDate(session.date)
    setDraft({
      title: session.title,
      type: session.type,
      description: session.description || '',
      plannedDistance: session.plannedDistance?.toString() ?? '',
      plannedDuration: session.plannedDuration?.toString() ?? '',
      plannedPace: session.plannedPace ?? '',
    })
    setEditingSession(session)
    setSessionModalOpen(true)
  }

  function saveSession() {
    if (!draft.title.trim()) return
    if (editingSession) {
      setSessions(prev => prev.map(s => s.id === editingSession.id ? {
        ...s, ...draft,
        plannedDistance: draft.plannedDistance ? parseFloat(draft.plannedDistance) : undefined,
        plannedDuration: draft.plannedDuration ? parseInt(draft.plannedDuration) : undefined,
        plannedPace: draft.plannedPace || undefined,
      } : s))
    } else {
      const newSession: Session = {
        id: `new-${Date.now()}`,
        athleteId: id,
        date: draftDate,
        title: draft.title,
        type: draft.type,
        description: draft.description,
        plannedDistance: draft.plannedDistance ? parseFloat(draft.plannedDistance) : undefined,
        plannedDuration: draft.plannedDuration ? parseInt(draft.plannedDuration) : undefined,
        plannedPace: draft.plannedPace || undefined,
        completed: false,
      }
      setSessions(prev => [...prev, newSession])
    }
    setSessionModalOpen(false)
  }

  function deleteSession(sessionId: string) {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    setSessionModalOpen(false)
  }

  // ── Plan week data ──
  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])
  const weekSessions = sessions.filter(s => s.date >= weekStart && s.date <= weekEnd)

  // ── Plan month data ──
  const calendarWeeks = getMonthCalendar(selectedMonth)

  // ── Session modal footer ──
  const sessionFooter = (
    <div className="flex gap-3">
      {editingSession && (
        <button
          onClick={() => deleteSession(editingSession.id)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}
        >🗑 Usuń</button>
      )}
      <Button className="flex-1" onClick={saveSession} disabled={!draft.title.trim()}>
        {editingSession ? 'Zapisz zmiany' : 'Dodaj sesję'}
      </Button>
    </div>
  )

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }

  return (
    <div>
      <CoachTopbar
        title={athlete.name}
        subtitle={`${athlete.goal} · ${athlete.package}`}
        actions={
          <Link href="/coach/athletes" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← Zawodnicy
          </Link>
        }
      />

      <div className="p-6">
        {/* Profile header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-5">
            <Avatar initials={athlete.avatar} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{athlete.name}</h2>
                <Badge variant={athlete.package === 'Pro' ? 'orange' : athlete.package === 'Standard' ? 'blue' : 'gray'}>
                  {athlete.package} — {formatCurrency(athlete.packagePrice)}/mies.
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>🎯 {athlete.goal}</span>
                <span>📍 {athlete.city}</span>
                <span>🎂 {athlete.age} lat</span>
                <span>📅 Od {formatDate(athlete.joinDate, { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-2xl font-bold">{totalKm.toFixed(0)} km</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>łącznie</div>
            </div>
          </div>
        </Card>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* ── Plan ── */}
        {activeTab === 'plan' && (
          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setPlanView('week')}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                  style={{ background: planView === 'week' ? '#FF5C1B' : 'transparent', color: planView === 'week' ? 'white' : 'var(--text-muted)' }}
                >📅 Tydzień</button>
                <button
                  onClick={() => setPlanView('month')}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                  style={{ background: planView === 'month' ? '#FF5C1B' : 'transparent', color: planView === 'month' ? 'white' : 'var(--text-muted)' }}
                >📆 Miesiąc</button>
              </div>

              {/* Week/Month navigation */}
              {planView === 'week' ? (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>←</button>
                    <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Dziś</button>
                    <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→</button>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(weekStart, { day: 'numeric', month: 'short' })} — {formatDate(weekEnd, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedMonth(m => shiftMonth(m, -1))} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>←</button>
                    <button onClick={() => setSelectedMonth('2026-02')} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Dziś</button>
                    <button onClick={() => setSelectedMonth(m => shiftMonth(m, 1))} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→</button>
                  </div>
                  <span className="text-sm capitalize font-medium" style={{ color: 'var(--text-muted)' }}>
                    {monthLabel(selectedMonth)}
                  </span>
                </div>
              )}
            </div>

            {/* ── Widok tygodniowy — 7 kolumn ── */}
            {planView === 'week' && (
              <div className="grid grid-cols-7 gap-2" style={{ minHeight: '520px' }}>
                {weekDays.map(day => {
                  const dateStr = toISODate(day)
                  const daySessions = weekSessions.filter(s => s.date === dateStr)
                  const todayFlag = isToday(dateStr)
                  const pastFlag = isPast(dateStr)

                  return (
                    <div key={dateStr} className="flex flex-col rounded-2xl overflow-hidden"
                      style={{ border: todayFlag ? '2px solid rgba(255,92,27,0.5)' : '1px solid var(--border)', background: 'var(--bg-card)' }}>

                      {/* Nagłówek kolumny */}
                      <div className="py-3 px-2 text-center shrink-0"
                        style={{ background: todayFlag ? 'rgba(255,92,27,0.07)' : 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                        <div className="text-xs font-medium capitalize" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-muted)' }}>
                          {dayName(day, true)}
                        </div>
                        <div className="text-xl font-black leading-tight mt-0.5" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-primary)' }}>
                          {day.getDate()}
                        </div>
                        {todayFlag && <div className="text-xs font-semibold mt-0.5" style={{ color: '#FF5C1B' }}>Dziś</div>}
                      </div>

                      {/* Sesje */}
                      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                        {daySessions.length === 0 && (
                          <div className="h-full flex items-center justify-center py-4">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>wolny</span>
                          </div>
                        )}
                        {daySessions.map(session => (
                          <div
                            key={session.id}
                            onClick={() => openEditSession(session)}
                            className={`p-2 rounded-xl cursor-pointer transition-opacity hover:opacity-80 ${intensityColor(session.type)}`}
                          >
                            <div className="font-semibold text-xs leading-tight mb-1">{session.title}</div>
                            {session.description && (
                              <div className="text-xs opacity-60 leading-tight mb-1 line-clamp-2">{session.description}</div>
                            )}
                            <div className="flex flex-col gap-0.5 text-xs opacity-75">
                              {session.plannedDistance && <span>📏 {session.plannedDistance} km</span>}
                              {session.plannedDuration && <span>⏱ {session.plannedDuration} min</span>}
                              {session.plannedPace && <span>⚡ {session.plannedPace}/km</span>}
                            </div>
                            <div className="mt-1.5">
                              {session.completed
                                ? <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">✓</span>
                                : pastFlag
                                ? <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">✗</span>
                                : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Przycisk dodaj */}
                      <div className="p-1.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                          onClick={() => openNewSession(dateStr)}
                          className="w-full py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                        >+ dodaj</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Widok miesięczny ── */}
            {planView === 'month' && (
              <div>
                {/* Calendar grid */}
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {/* Day headers */}
                  <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(d => (
                      <div key={d} className="py-3 text-center text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Weeks */}
                  {calendarWeeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < calendarWeeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      {week.map((dateStr, di) => {
                        if (!dateStr) return (
                          <div key={di} className="min-h-36 p-2" style={{ background: 'var(--bg-base)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />
                        )
                        const daySessions = sessions.filter(s => s.date === dateStr)
                        const todayFlag = isToday(dateStr)
                        const isSelected = selectedDay === dateStr
                        const dayNum = parseInt(dateStr.split('-')[2])

                        return (
                          <div key={dateStr}
                            className="min-h-36 p-2 transition-colors"
                            style={{
                              background: isSelected ? 'rgba(255,92,27,0.06)' : 'var(--bg-card)',
                              borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                              outline: todayFlag ? '2px solid rgba(255,92,27,0.4)' : 'none',
                              outlineOffset: '-2px',
                            }}>
                            {/* Nagłówek dnia */}
                            <div className="flex items-center justify-between mb-1.5">
                              <button
                                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                                className="text-sm font-bold cursor-pointer w-6 h-6 rounded-full flex items-center justify-center"
                                style={{
                                  background: todayFlag ? '#FF5C1B' : 'transparent',
                                  color: todayFlag ? 'white' : isSelected ? '#FF5C1B' : 'var(--text-primary)',
                                }}
                              >{dayNum}</button>
                              <button
                                onClick={e => { e.stopPropagation(); openNewSession(dateStr) }}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer transition-colors"
                                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                                title="Dodaj sesję"
                              >+</button>
                            </div>
                            {/* Sesje — szczegóły */}
                            <div className="space-y-1">
                              {daySessions.slice(0, 3).map(s => (
                                <div
                                  key={s.id}
                                  onClick={() => openEditSession(s)}
                                  className={`px-1.5 py-1 rounded-lg cursor-pointer transition-opacity hover:opacity-80 ${intensityColor(s.type)}`}
                                >
                                  <div className="text-xs font-semibold leading-tight truncate">{s.title}</div>
                                  <div className="flex flex-wrap gap-x-2 mt-0.5" style={{ fontSize: '10px', opacity: 0.75 }}>
                                    {s.plannedDistance && <span>{s.plannedDistance}km</span>}
                                    {s.plannedDuration && <span>{s.plannedDuration}min</span>}
                                    {s.plannedPace && <span>{s.plannedPace}</span>}
                                  </div>
                                  {s.completed && <div className="text-green-400 mt-0.5" style={{ fontSize: '10px' }}>✓ wykonany</div>}
                                </div>
                              ))}
                              {daySessions.length > 3 && (
                                <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>+{daySessions.length - 3} więcej</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Selected day detail */}
                {selectedDay && (
                  <div className="mt-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-semibold">
                        {formatDate(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>
                      <button onClick={() => openNewSession(selectedDay)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer"
                        style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                        + Dodaj sesję
                      </button>
                    </div>
                    {sessions.filter(s => s.date === selectedDay).length === 0 ? (
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak sesji — wolny dzień</div>
                    ) : (
                      <div className="space-y-2">
                        {sessions.filter(s => s.date === selectedDay).map(session => (
                          <div key={session.id} className={`flex items-center gap-4 p-3 rounded-xl ${intensityColor(session.type)}`}>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{session.title}</div>
                              <div className="flex gap-4 text-xs opacity-70 mt-1">
                                {session.plannedDistance && <span>📏 {session.plannedDistance} km</span>}
                                {session.plannedDuration && <span>⏱️ {session.plannedDuration} min</span>}
                                {session.plannedPace && <span>⚡ {session.plannedPace}/km</span>}
                              </div>
                            </div>
                            <button onClick={() => openEditSession(session)} className="p-1.5 rounded-lg cursor-pointer text-sm" style={{ background: 'rgba(0,0,0,0.2)' }}>✏️</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Legenda typów treningu ── */}
            <div className="mt-5 flex flex-wrap gap-2 items-center pb-32">
              <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Legenda:</span>
              {SESSION_TYPES.filter(t => t !== 'rest').map(t => (
                <span key={t} className={`text-xs px-2.5 py-1 rounded-full font-medium ${intensityColor(t)}`}>
                  {sessionTypeLabel(t)}
                </span>
              ))}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${intensityColor('rest')}`}>
                {sessionTypeLabel('rest')}
              </span>
            </div>
          </div>
        )}

        {/* ── Historia ── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Łącznie sesji', value: sessions.filter(s => s.completed).length },
                { label: 'Łącznie km', value: `${totalKm.toFixed(0)} km` },
                { label: 'Feedbacków', value: athleteFeedbacks.length },
                { label: 'Ukończenie', value: `${Math.round((sessions.filter(s => s.completed).length / Math.max(sessions.length, 1)) * 100)}%` },
              ].map(stat => (
                <Card key={stat.label} className="p-4 text-center">
                  <div className="text-xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                </Card>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    {['Data', 'Sesja', 'Typ', 'Dystans', 'Tempo', 'HR', 'Status', 'Feedback'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((session) => {
                    const fb = feedbackBySession[session.id]
                    const isExpanded = expandedRows.has(session.id)
                    return (
                      <>
                        <tr key={session.id} style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--bg-subtle)' }}>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(session.date, { day: 'numeric', month: 'short' })}</td>
                          <td className="px-4 py-3 font-medium text-xs">{session.title}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${intensityColor(session.type)}`}>{sessionTypeLabel(session.type)}</span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {session.actualDistance ? `${session.actualDistance} km` : session.plannedDistance ? `(${session.plannedDistance} km)` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.actualPace || session.plannedPace || '—'}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.avgHR ? `${session.avgHR} bpm` : '—'}</td>
                          <td className="px-4 py-3">
                            {session.completed
                              ? <span className="text-xs text-green-400">✓ Wykonany</span>
                              : session.date < TODAY
                              ? <span className="text-xs text-red-400">✗ Pominięty</span>
                              : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Planowany</span>}
                          </td>
                          <td className="px-4 py-3">
                            {fb ? (
                              <button
                                onClick={() => toggleRow(session.id)}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg cursor-pointer transition-all"
                                style={{
                                  background: isExpanded ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                                  color: isExpanded ? '#FF5C1B' : 'var(--text-muted)',
                                }}
                                title="Pokaż feedback"
                              >
                                <span>💬</span>
                                <span>{isExpanded ? '▲' : '▼'}</span>
                              </button>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--bg-subtle)' }}>—</span>
                            )}
                          </td>
                        </tr>
                        {fb && isExpanded && (
                          <tr key={`${session.id}-fb`} style={{ borderBottom: '1px solid var(--bg-subtle)' }}>
                            <td colSpan={8} className="px-4 pb-4 pt-1">
                              <div className="rounded-xl p-4" style={{ background: 'var(--bg-subtle)', borderLeft: `3px solid ${fb.signal === 'green' ? '#2ECC71' : fb.signal === 'yellow' ? '#F39C12' : '#E74C3C'}` }}>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                                    {fb.source === 'voice' ? '🎤 Głosowy' : fb.source === 'text' ? '📝 Tekstowy' : '⌚ Auto'}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fb.signal === 'green' ? 'bg-green-500/10 text-green-400' : fb.signal === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {fb.signal === 'green' ? '● OK' : fb.signal === 'yellow' ? '● Uwaga' : '● Alert'}
                                  </span>
                                  <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{formatDate(fb.date, { day: 'numeric', month: 'short' })}</span>
                                </div>
                                <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{fb.aiSummary}</p>
                                {fb.transcript && (
                                  <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>„{fb.transcript}"</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Dane ── */}
        {activeTab === 'data' && (
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Dane osobowe</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Imię i nazwisko', athlete.name],
                  ['Email', athlete.email],
                  ['Telefon', athlete.phone],
                  ['Wiek', `${athlete.age} lat`],
                  ['Miasto', athlete.city],
                  ['Dołączył/a', formatDate(athlete.joinDate)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4">Rekordy osobiste</h3>
              <div className="space-y-2">
                {Object.entries(athlete.personalBests).map(([dist, time]) => (
                  <div key={dist} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{dist}</span>
                    <span className="font-semibold text-sm" style={{ color: '#FF5C1B' }}>{time}</span>
                  </div>
                ))}
                {Object.keys(athlete.personalBests).length === 0 && (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak rekordów</div>
                )}
              </div>
            </Card>

            <Card className="p-5 col-span-2">
              <h3 className="font-semibold mb-3">Ostatnie feedbacki</h3>
              <div className="space-y-2">
                {athleteFeedbacks.slice(0, 3).map(fb => (
                  <div key={fb.id} className={`p-3 rounded-xl border-l-2 text-sm ${signalColor(fb.signal)}`} style={{ background: 'var(--bg-subtle)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{formatDate(fb.date, { day: 'numeric', month: 'short' })}</div>
                    <div>{fb.aiSummary}</div>
                  </div>
                ))}
                {athleteFeedbacks.length === 0 && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak feedbacków</div>}
              </div>
            </Card>
          </div>
        )}

        {/* ── Notatki ── */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-3">Notatki trenera</h3>
                <textarea
                  value={coachNotes}
                  onChange={e => { setCoachNotes(e.target.value); setNotesSaved(false) }}
                  rows={10}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  placeholder="Dodaj notatki o zawodniku — obserwacje, plany, uwagi..."
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                />
                <div className="flex items-center justify-between mt-3">
                  {notesSaved && <span className="text-xs text-green-400">✓ Zapisano</span>}
                  <div className="ml-auto">
                    <Button onClick={() => setNotesSaved(true)}>Zapisz notatki</Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-3">Historia kontuzji</h3>
                {athlete.injuries.length === 0 ? (
                  <p className="text-sm text-green-400">Brak odnotowanych kontuzji ✓</p>
                ) : (
                  <div className="space-y-2">
                    {athlete.injuries.map(injury => (
                      <div key={injury} className="px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                        ⚠️ {injury}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-3">Cele i założenia</h3>
                <div className="px-3 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  🎯 {athlete.goal}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── Finanse ── */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Pakiet', value: `${athlete.package} — ${formatCurrency(athlete.packagePrice)}/mies.` },
                { label: 'Łącznie zapłacono', value: formatCurrency(totalPaid) },
                { label: 'Miesięcy aktywny/a', value: monthsActive },
              ].map(kpi => (
                <Card key={kpi.label} className="p-4">
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
                  <div className="text-xl font-bold">{kpi.value}</div>
                </Card>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    {['Nr faktury', 'Opis', 'Data', 'Kwota', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {athleteInvoices.map((inv, i) => (
                    <tr key={inv.id} style={{ borderBottom: i < athleteInvoices.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{inv.number}</td>
                      <td className="px-4 py-3 text-xs">{inv.description}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(inv.date, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(inv.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${invoiceStatusColor(inv.status)}`}>{invoiceStatusLabel(inv.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal sesji ── */}
      <Modal
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title={editingSession ? 'Edytuj sesję' : `Nowa sesja — ${draftDate ? formatDate(draftDate, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}`}
        size="md"
        footer={sessionFooter}
      >
        <div className="space-y-4">
          {/* Tytuł */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nazwa sesji *</label>
            <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="np. Bieg ciągły 10km"
              className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
          </div>

          {/* Typ */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Typ treningu</label>
            <div className="grid grid-cols-3 gap-2">
              {SESSION_TYPES.map(t => (
                <button key={t} onClick={() => setDraft(d => ({ ...d, type: t }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium cursor-pointer transition-all text-center ${intensityColor(t)}`}
                  style={{ opacity: draft.type === t ? 1 : 0.45, outline: draft.type === t ? '2px solid rgba(255,92,27,0.5)' : 'none' }}>
                  {sessionTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Dystans + czas + tempo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Dystans (km)</label>
              <input type="number" value={draft.plannedDistance} onChange={e => setDraft(d => ({ ...d, plannedDistance: e.target.value }))}
                placeholder="np. 10" min="0" step="0.1"
                className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
              <input type="number" value={draft.plannedDuration} onChange={e => setDraft(d => ({ ...d, plannedDuration: e.target.value }))}
                placeholder="np. 55" min="0"
                className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Tempo (/km)</label>
              <input value={draft.plannedPace} onChange={e => setDraft(d => ({ ...d, plannedPace: e.target.value }))}
                placeholder="np. 5:30"
                className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>

          {/* Opis */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Opis / instrukcje (opcjonalnie)</label>
            <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="Szczegółowe instrukcje dla zawodnika..."
              rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" style={inputStyle} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
