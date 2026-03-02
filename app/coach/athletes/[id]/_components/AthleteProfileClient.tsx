'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  formatDate, formatCurrency, intensityColor, sessionTypeLabel,
  invoiceStatusColor, invoiceStatusLabel, signalColor, getWeekDays, toISODate, dayName, isToday, isPast,
} from '@/lib/utils'
import { SessionType } from '@/lib/types'
import { createSession, updateSession, deleteSession as deleteSessionAction } from '@/lib/actions/sessions'
import { updateAthlete } from '@/lib/actions/athletes'
import Link from 'next/link'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>

interface Props {
  athlete: DbRow
  sessions: DbRow[]
  feedbacks: DbRow[]
  invoices: DbRow[]
}

// ── Component ─────────────────────────────────────────────────────────────

export function AthleteProfileClient({ athlete, sessions: initialSessions, feedbacks: athleteFeedbacks, invoices: athleteInvoices }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('plan')
  const [saving, setSaving] = useState(false)

  // ── Feedback lookup by sessionId ──
  const feedbackBySession = Object.fromEntries(
    athleteFeedbacks.map(f => [f.session_id, f])
  )

  // ── Plan view state ──
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)
  const [planView, setPlanView] = useState<'week' | 'month'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // ── Session modal ──
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
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
  const [coachNotes, setCoachNotes] = useState(athlete.coach_notes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)

  // ── Invite link ──
  const [linkCopied, setLinkCopied] = useState(false)
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/u/${athlete.slug}?t=${athlete.invite_token}`
    : `/u/${athlete.slug}?t=${athlete.invite_token}`

  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'history', label: 'Historia' },
    { id: 'data', label: 'Dane' },
    { id: 'notes', label: 'Notatki' },
    { id: 'finance', label: 'Finanse' },
  ]

  const completedSessions = initialSessions.filter(s => s.completed && s.actual_distance)
  const totalKm = completedSessions.reduce((sum, s) => sum + (s.actual_distance || 0), 0)
  const totalPaid = athleteInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)

  // ── Session modal handlers ──
  function openNewSession(date: string) {
    setDraftDate(date)
    setDraft(emptyDraft())
    setEditingSessionId(null)
    setSessionModalOpen(true)
  }

  function openEditSession(session: DbRow) {
    setDraftDate(session.date)
    setDraft({
      title: session.title,
      type: session.type as SessionType,
      description: session.description || '',
      plannedDistance: session.planned_distance?.toString() ?? '',
      plannedDuration: session.planned_duration?.toString() ?? '',
      plannedPace: session.planned_pace ?? '',
    })
    setEditingSessionId(session.id)
    setSessionModalOpen(true)
  }

  async function saveSession() {
    if (!draft.title.trim() || saving) return
    setSaving(true)

    const fd = new FormData()
    fd.set('athlete_id', athlete.id)
    fd.set('date', draftDate)
    fd.set('type', draft.type)
    fd.set('title', draft.title)
    fd.set('description', draft.description)
    if (draft.plannedDistance) fd.set('planned_distance', draft.plannedDistance)
    if (draft.plannedDuration) fd.set('planned_duration', draft.plannedDuration)
    if (draft.plannedPace) fd.set('planned_pace', draft.plannedPace)

    if (editingSessionId) {
      fd.set('id', editingSessionId)
      fd.set('athlete_id', athlete.id)
      await updateSession(null, fd)
    } else {
      await createSession(null, fd)
    }

    setSessionModalOpen(false)
    setSaving(false)
    startTransition(() => router.refresh())
  }

  async function handleDeleteSession() {
    if (!editingSessionId || saving) return
    setSaving(true)
    await deleteSessionAction(editingSessionId, athlete.id)
    setSessionModalOpen(false)
    setSaving(false)
    startTransition(() => router.refresh())
  }

  async function saveNotes() {
    const fd = new FormData()
    fd.set('id', athlete.id)
    fd.set('coach_notes', coachNotes)
    await updateAthlete(null, fd)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
    startTransition(() => router.refresh())
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  // ── Plan week data ──
  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])
  const weekSessions = initialSessions.filter(s => s.date >= weekStart && s.date <= weekEnd)

  // ── Plan month data ──
  const calendarWeeks = getMonthCalendar(selectedMonth)

  // ── Session modal footer ──
  const sessionFooter = (
    <div className="flex gap-3">
      {editingSessionId && (
        <button
          onClick={handleDeleteSession}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}
        >🗑 Usuń</button>
      )}
      <Button className="flex-1" onClick={saveSession} disabled={!draft.title.trim() || saving}>
        {saving ? 'Zapisywanie...' : editingSessionId ? 'Zapisz zmiany' : 'Dodaj sesję'}
      </Button>
    </div>
  )

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }

  return (
    <div>
      <CoachTopbar
        title={athlete.name}
        subtitle={`${athlete.goal || ''} · ${athlete.package}`}
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
                  {athlete.package} — {formatCurrency(athlete.package_price)}/mies.
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
                {athlete.goal && <span>🎯 {athlete.goal}</span>}
                {athlete.city && <span>📍 {athlete.city}</span>}
                {athlete.age && <span>🎂 {athlete.age} lat</span>}
                <span>📅 Od {formatDate(athlete.join_date, { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-2xl font-bold">{totalKm.toFixed(0)} km</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>łącznie</div>
            </div>
          </div>

          {/* Invite link */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>🔗 Link zaproszenia dla zawodnika</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl text-xs font-mono truncate" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                /u/{athlete.slug}?t={athlete.invite_token}
              </code>
              <button
                onClick={copyInviteLink}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                style={{ background: linkCopied ? 'rgba(46,204,113,0.15)' : 'rgba(255,92,27,0.1)', color: linkCopied ? '#2ECC71' : '#FF5C1B' }}
              >
                {linkCopied ? '✓ Skopiowano' : '📋 Kopiuj'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Cześć! Oto Twój panel treningowy: ${inviteUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}
              >
                WhatsApp
              </a>
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
                    <button onClick={() => setSelectedMonth(currentMonth)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Dziś</button>
                    <button onClick={() => setSelectedMonth(m => shiftMonth(m, 1))} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→</button>
                  </div>
                  <span className="text-sm capitalize font-medium" style={{ color: 'var(--text-muted)' }}>
                    {monthLabel(selectedMonth)}
                  </span>
                </div>
              )}
            </div>

            {/* ── Widok tygodniowy ── */}
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
                      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                        {daySessions.length === 0 && (
                          <div className="h-full flex items-center justify-center py-4">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>wolny</span>
                          </div>
                        )}
                        {daySessions.map(session => (
                          <div key={session.id} onClick={() => openEditSession(session)}
                            className={`p-2 rounded-xl cursor-pointer transition-opacity hover:opacity-80 ${intensityColor(session.type)}`}>
                            <div className="font-semibold text-xs leading-tight mb-1">{session.title}</div>
                            {session.description && <div className="text-xs opacity-60 leading-tight mb-1 line-clamp-2">{session.description}</div>}
                            <div className="flex flex-col gap-0.5 text-xs opacity-75">
                              {session.planned_distance && <span>📏 {session.planned_distance} km</span>}
                              {session.planned_duration && <span>⏱ {session.planned_duration} min</span>}
                              {session.planned_pace && <span>⚡ {session.planned_pace}/km</span>}
                            </div>
                            <div className="mt-1.5">
                              {session.completed
                                ? <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">✓</span>
                                : pastFlag ? <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">✗</span>
                                : null}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-1.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                        <button onClick={() => openNewSession(dateStr)}
                          className="w-full py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>+ dodaj</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Widok miesięczny ── */}
            {planView === 'month' && (
              <div>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(d => (
                      <div key={d} className="py-3 text-center text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{d}</div>
                    ))}
                  </div>
                  {calendarWeeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < calendarWeeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      {week.map((dateStr, di) => {
                        if (!dateStr) return (
                          <div key={di} className="min-h-36 p-2" style={{ background: 'var(--bg-base)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />
                        )
                        const daySessions = initialSessions.filter(s => s.date === dateStr)
                        const todayFlag = isToday(dateStr)
                        const isSelected = selectedDay === dateStr
                        const dayNum = parseInt(dateStr.split('-')[2])
                        return (
                          <div key={dateStr} className="min-h-36 p-2 transition-colors"
                            style={{
                              background: isSelected ? 'rgba(255,92,27,0.06)' : 'var(--bg-card)',
                              borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                              outline: todayFlag ? '2px solid rgba(255,92,27,0.4)' : 'none',
                              outlineOffset: '-2px',
                            }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <button onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                                className="text-sm font-bold cursor-pointer w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: todayFlag ? '#FF5C1B' : 'transparent', color: todayFlag ? 'white' : isSelected ? '#FF5C1B' : 'var(--text-primary)' }}>
                                {dayNum}
                              </button>
                              <button onClick={e => { e.stopPropagation(); openNewSession(dateStr) }}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer"
                                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>+</button>
                            </div>
                            <div className="space-y-1">
                              {daySessions.slice(0, 3).map(s => (
                                <div key={s.id} onClick={() => openEditSession(s)}
                                  className={`px-1.5 py-1 rounded-lg cursor-pointer hover:opacity-80 ${intensityColor(s.type)}`}>
                                  <div className="text-xs font-semibold leading-tight truncate">{s.title}</div>
                                  <div className="flex flex-wrap gap-x-2 mt-0.5" style={{ fontSize: '10px', opacity: 0.75 }}>
                                    {s.planned_distance && <span>{s.planned_distance}km</span>}
                                    {s.planned_duration && <span>{s.planned_duration}min</span>}
                                  </div>
                                  {s.completed && <div className="text-green-400 mt-0.5" style={{ fontSize: '10px' }}>✓ wykonany</div>}
                                </div>
                              ))}
                              {daySessions.length > 3 && <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>+{daySessions.length - 3} więcej</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
                {selectedDay && (
                  <div className="mt-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-semibold">{formatDate(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                      <button onClick={() => openNewSession(selectedDay)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer"
                        style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>+ Dodaj sesję</button>
                    </div>
                    {initialSessions.filter(s => s.date === selectedDay).length === 0 ? (
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak sesji — wolny dzień</div>
                    ) : (
                      <div className="space-y-2">
                        {initialSessions.filter(s => s.date === selectedDay).map(session => (
                          <div key={session.id} className={`flex items-center gap-4 p-3 rounded-xl ${intensityColor(session.type)}`}>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{session.title}</div>
                              <div className="flex gap-4 text-xs opacity-70 mt-1">
                                {session.planned_distance && <span>📏 {session.planned_distance} km</span>}
                                {session.planned_duration && <span>⏱️ {session.planned_duration} min</span>}
                                {session.planned_pace && <span>⚡ {session.planned_pace}/km</span>}
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

            {/* Legenda */}
            <div className="mt-5 flex flex-wrap gap-2 items-center pb-32">
              <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Legenda:</span>
              {SESSION_TYPES.filter(t => t !== 'rest').map(t => (
                <span key={t} className={`text-xs px-2.5 py-1 rounded-full font-medium ${intensityColor(t)}`}>{sessionTypeLabel(t)}</span>
              ))}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${intensityColor('rest')}`}>{sessionTypeLabel('rest')}</span>
            </div>
          </div>
        )}

        {/* ── Historia ── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Łącznie sesji', value: initialSessions.filter(s => s.completed).length },
                { label: 'Łącznie km', value: `${totalKm.toFixed(0)} km` },
                { label: 'Feedbacków', value: athleteFeedbacks.length },
                { label: 'Ukończenie', value: `${Math.round((initialSessions.filter(s => s.completed).length / Math.max(initialSessions.length, 1)) * 100)}%` },
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
                  {[...initialSessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map(session => {
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
                            {session.actual_distance ? `${session.actual_distance} km` : session.planned_distance ? `(${session.planned_distance} km)` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.actual_pace || session.planned_pace || '—'}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.avg_hr ? `${session.avg_hr} bpm` : '—'}</td>
                          <td className="px-4 py-3">
                            {session.completed
                              ? <span className="text-xs text-green-400">✓ Wykonany</span>
                              : session.date < today
                              ? <span className="text-xs text-red-400">✗ Pominięty</span>
                              : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Planowany</span>}
                          </td>
                          <td className="px-4 py-3">
                            {fb ? (
                              <button onClick={() => toggleRow(session.id)}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg cursor-pointer"
                                style={{ background: isExpanded ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)', color: isExpanded ? '#FF5C1B' : 'var(--text-muted)' }}>
                                <span>💬</span><span>{isExpanded ? '▲' : '▼'}</span>
                              </button>
                            ) : <span className="text-xs" style={{ color: 'var(--border)' }}>—</span>}
                          </td>
                        </tr>
                        {isExpanded && fb && (
                          <tr key={`fb-${session.id}`}>
                            <td colSpan={8} className="px-4 pb-3">
                              <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`w-2 h-2 rounded-full inline-block ${signalColor(fb.signal)}`} style={{ background: fb.signal === 'green' ? '#22c55e' : fb.signal === 'yellow' ? '#facc15' : '#ef4444' }} />
                                  <span className="text-xs font-semibold">{fb.ai_summary}</span>
                                  {fb.coach_reply && <span className="text-xs ml-2 text-green-400">✓ Odpowiedziano</span>}
                                </div>
                                {fb.transcript && <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>"{fb.transcript}"</p>}
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
                  ['Email', athlete.email],
                  ['Telefon', athlete.phone],
                  ['Wiek', athlete.age ? `${athlete.age} lat` : null],
                  ['Miasto', athlete.city],
                  ['Cel', athlete.goal],
                  ['Pakiet', athlete.package],
                  ['Cena', formatCurrency(athlete.package_price) + '/mies.'],
                  ['Dołączył/a', formatDate(athlete.join_date, { day: 'numeric', month: 'long', year: 'numeric' })],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-medium">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Rekordy życiowe</h3>
              {Object.entries(athlete.personal_bests || {}).length === 0 ? (
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak rekordów</div>
              ) : (
                <div className="space-y-3 text-sm">
                  {Object.entries(athlete.personal_bests || {}).map(([dist, time]) => (
                    <div key={dist} className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>{dist}</span>
                      <span className="font-mono font-medium">{time as string}</span>
                    </div>
                  ))}
                </div>
              )}
              {athlete.injuries && athlete.injuries.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Kontuzje/historia</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(athlete.injuries as string[]).map(inj => (
                      <span key={inj} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{inj}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── Notatki ── */}
        {activeTab === 'notes' && (
          <div>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Notatki trenera</h3>
                <button
                  onClick={saveNotes}
                  className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                  style={{ background: notesSaved ? 'rgba(46,204,113,0.15)' : 'rgba(255,92,27,0.1)', color: notesSaved ? '#2ECC71' : '#FF5C1B' }}
                >
                  {notesSaved ? '✓ Zapisano' : 'Zapisz'}
                </button>
              </div>
              <textarea
                value={coachNotes}
                onChange={e => setCoachNotes(e.target.value)}
                placeholder="Zapisz obserwacje, uwagi, przemyślenia o zawodniku..."
                rows={12}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={inputStyle}
              />
            </Card>
          </div>
        )}

        {/* ── Finanse ── */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Opłacono łącznie', value: formatCurrency(totalPaid), color: 'text-green-400' },
                { label: 'Oczekujące', value: formatCurrency(athleteInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)), color: 'text-yellow-400' },
                { label: 'Przeterminowane', value: formatCurrency(athleteInvoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)), color: 'text-red-400' },
              ].map(kpi => (
                <Card key={kpi.label} className="p-4 text-center">
                  <div className={`text-xl font-bold mb-1 ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
                </Card>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    {['Nr faktury', 'Opis', 'Data', 'Termin', 'Kwota', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {athleteInvoices.map((inv, i) => (
                    <tr key={inv.id} style={{ borderBottom: i < athleteInvoices.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{inv.number}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{inv.description || '—'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(inv.date, { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: inv.status === 'overdue' ? '#E74C3C' : 'var(--text-muted)' }}>{formatDate(inv.due_date, { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(inv.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${invoiceStatusColor(inv.status)}`}>{invoiceStatusLabel(inv.status)}</span>
                      </td>
                    </tr>
                  ))}
                  {athleteInvoices.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Brak faktur</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Session Modal ── */}
      <Modal
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title={editingSessionId ? 'Edytuj sesję' : 'Nowa sesja treningowa'}
        footer={sessionFooter}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Data</label>
            <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Typ treningu</label>
            <div className="flex flex-wrap gap-2">
              {SESSION_TYPES.map(t => (
                <button key={t} onClick={() => setDraft(d => ({ ...d, type: t }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${intensityColor(t)}`}
                  style={{ opacity: draft.type === t ? 1 : 0.4, outline: draft.type === t ? '2px solid currentColor' : 'none', outlineOffset: '1px' }}>
                  {sessionTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Nazwa sesji *</label>
            <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="np. Rozbieganie 10 km"
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Opis / instrukcje</label>
            <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="Szczegóły treningu..." rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Dystans (km)</label>
              <input type="number" value={draft.plannedDistance} onChange={e => setDraft(d => ({ ...d, plannedDistance: e.target.value }))}
                placeholder="np. 10" min="0" step="0.1"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
              <input type="number" value={draft.plannedDuration} onChange={e => setDraft(d => ({ ...d, plannedDuration: e.target.value }))}
                placeholder="np. 60" min="0"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Tempo (/km)</label>
              <input value={draft.plannedPace} onChange={e => setDraft(d => ({ ...d, plannedPace: e.target.value }))}
                placeholder="np. 5:30"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
