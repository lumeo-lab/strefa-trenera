'use client'

import React, { startTransition, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  dayName, formatDate,
  getWeekDays, intensityColor, isToday, parseFeedbackTranscript, toISODate,
} from '@/lib/utils'
import { SessionType } from '@/lib/types'
import { duplicateWeekSessions, moveSessionDate } from '@/lib/actions/sessions'
import { applyWeekTemplate, saveWeekTemplate } from '@/lib/actions/sessions'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'
import { FeedbackDetail } from '@/components/coach/FeedbackCard'
import { Modal } from '@/components/ui/Modal'
import { SessionModal } from '../modals/SessionModal'
import type { CoachFeedbackRow, CoachTrainingSessionRow, FeedbackByDateMap } from '../types'

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

function getMonthBounds(monthStr: string): { from: string; to: string } {
  const [y, mo] = monthStr.split('-').map(Number)
  const lastDay = new Date(y, mo, 0).getDate()
  return {
    from: `${monthStr}-01`,
    to: `${monthStr}-${String(lastDay).padStart(2, '0')}`,
  }
}

interface PlanTabProps {
  athleteId: string
  sessions: CoachTrainingSessionRow[]
  feedbackByDate: FeedbackByDateMap
  today: string
  currentMonth: string
}

export function PlanTab({ athleteId, sessions, feedbackByDate, today, currentMonth }: PlanTabProps) {
  const router = useRouter()
  const { custom: customSessionTypes } = useCustomSessionTypes()

  const [planView, setPlanView] = useState<'week' | 'month'>('week')
  const [density, setDensity] = useState<'full' | 'compact'>('full')
  const [showFeedback, setShowFeedback] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [visibleSessions, setVisibleSessions] = useState<CoachTrainingSessionRow[]>(sessions)
  const [visibleFeedbackByDate, setVisibleFeedbackByDate] = useState<FeedbackByDateMap>(feedbackByDate)
  const [loadingRange, setLoadingRange] = useState(false)
  const [copyWeekConfirm, setCopyWeekConfirm] = useState(false)
  const [copyingWeek, setCopyingWeek] = useState(false)
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null)
  const [dragTargetDate, setDragTargetDate] = useState<string | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; created_at: string }>>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templateActionLoading, setTemplateActionLoading] = useState(false)

  // Session modal
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<CoachTrainingSessionRow | null>(null)
  const [newSessionDate, setNewSessionDate] = useState('')

  // Feedback detail modal
  const [feedbackModalData, setFeedbackModalData] = useState<CoachFeedbackRow | null>(null)

  function typeClass(type: string): string {
    if (customSessionTypes.find(t => t.key === type)) return ''
    return intensityColor(type as SessionType)
  }
  function typeStyle(type: string): React.CSSProperties {
    const c = customSessionTypes.find(t => t.key === type)
    return c?.color ? { background: c.color + '33', color: c.color } : {}
  }
  function completionStyle(session: CoachTrainingSessionRow): React.CSSProperties {
    if (session.completed) return { outline: '2px solid rgba(46,204,113,0.6)', outlineOffset: '-2px' }
    return {}
  }
  function feedbackToneStyle(feedback: CoachFeedbackRow): React.CSSProperties {
    if (feedback.signal === 'red') {
      return { background: 'rgba(239,68,68,0.12)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.22)' }
    }
    if (feedback.signal === 'yellow') {
      return { background: 'rgba(245,158,11,0.12)', color: '#D97706', border: '1px solid rgba(245,158,11,0.22)' }
    }
    return { background: 'rgba(34,197,94,0.12)', color: '#16A34A', border: '1px solid rgba(34,197,94,0.22)' }
  }
  function feedbackToneIcon(feedback: CoachFeedbackRow): string {
    const parsed = parseFeedbackTranscript(feedback.transcript ?? '')
    return parsed.feeling || '💬'
  }
  function openNewSession(date: string) {
    setStatusMessage(null)
    setNewSessionDate(date)
    setEditingSession(null)
    setSessionModalOpen(true)
  }

  function openEditSession(session: CoachTrainingSessionRow) {
    setStatusMessage(null)
    setEditingSession(session)
    setNewSessionDate('')
    setSessionModalOpen(true)
  }

  async function handleMoveSession(sessionId: string, targetDate: string) {
    const session = visibleSessions.find((item) => item.id === sessionId)
    if (!session || session.date === targetDate) {
      setDraggedSessionId(null)
      setDragTargetDate(null)
      return
    }

    setStatusMessage(null)
    const result = await moveSessionDate(sessionId, athleteId, targetDate)
    setDraggedSessionId(null)
    setDragTargetDate(null)

    if (result && 'error' in result) {
      setStatusMessage({ tone: 'error', text: result.error ?? 'Nie udało się przenieść sesji.' })
      return
    }

    setStatusMessage({ tone: 'success', text: 'Sesja została przeniesiona na nowy dzień.' })
    startTransition(() => router.refresh())
  }

  async function handleCopyWeek() {
    if (copyingWeek) return
    setCopyingWeek(true)
    setStatusMessage(null)
    const result = await duplicateWeekSessions(athleteId, weekStart, weekEnd, 7)
    if (result && 'error' in result) {
      setStatusMessage({ tone: 'error', text: result.error ?? 'Nie udało się skopiować tygodnia.' })
      setCopyWeekConfirm(false)
      setCopyingWeek(false)
      return
    }
    setStatusMessage({
      tone: 'success',
      text: `Skopiowano ${result?.count ?? 0} ${result?.count === 1 ? 'sesję' : result?.count && result.count < 5 ? 'sesje' : 'sesji'} na kolejny tydzień.`,
    })
    setCopyWeekConfirm(false)
    setCopyingWeek(false)
    startTransition(() => router.refresh())
  }

  async function loadTemplates() {
    setTemplatesLoading(true)
    try {
      const res = await fetch('/api/week-templates', { cache: 'no-store' })
      const data = (await res.json().catch(() => null)) as {
        error?: string
        items?: Array<{ id: string; name: string; created_at: string }>
      } | null

      if (!res.ok) {
        throw new Error(data?.error || 'Nie udało się pobrać szablonów.')
      }

      setTemplates(data?.items ?? [])
    } catch (error) {
      setStatusMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Nie udało się pobrać szablonów.' })
    } finally {
      setTemplatesLoading(false)
    }
  }

  async function handleOpenTemplates() {
    setTemplatesOpen(true)
    setStatusMessage(null)
    await loadTemplates()
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) {
      setStatusMessage({ tone: 'error', text: 'Podaj nazwę szablonu.' })
      return
    }
    setTemplateActionLoading(true)
    setStatusMessage(null)
    const result = await saveWeekTemplate(athleteId, weekStart, weekEnd, templateName)
    if (result && 'error' in result) {
      setStatusMessage({ tone: 'error', text: result.error ?? 'Nie udało się zapisać szablonu.' })
      setTemplateActionLoading(false)
      return
    }
    setTemplateName('')
    setSaveTemplateOpen(false)
    setTemplateActionLoading(false)
    setStatusMessage({ tone: 'success', text: 'Szablon tygodnia został zapisany.' })
    await loadTemplates()
  }

  async function handleApplyTemplate(templateId: string) {
    setTemplateActionLoading(true)
    setStatusMessage(null)
    const result = await applyWeekTemplate(athleteId, templateId, weekStart)
    if (result && 'error' in result) {
      setStatusMessage({ tone: 'error', text: result.error ?? 'Nie udało się zastosować szablonu.' })
      setTemplateActionLoading(false)
      return
    }
    setTemplatesOpen(false)
    setTemplateActionLoading(false)
    setStatusMessage({
      tone: 'success',
      text: `Dodano ${result?.count ?? 0} ${result?.count === 1 ? 'sesję' : result?.count && result.count < 5 ? 'sesje' : 'sesji'} z szablonu.`,
    })
    startTransition(() => router.refresh())
  }

  // Plan week data
  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])
  const weekSessions = visibleSessions.filter(s => s.date >= weekStart && s.date <= weekEnd)

  // Plan month data
  const calendarWeeks = getMonthCalendar(selectedMonth)
  const range = planView === 'week' ? { from: weekStart, to: weekEnd } : getMonthBounds(selectedMonth)

  useEffect(() => {
    setVisibleSessions(sessions)
    setVisibleFeedbackByDate(feedbackByDate)
  }, [sessions, feedbackByDate, athleteId])

  useEffect(() => {
    let cancelled = false

    async function loadRange() {
      if (!athleteId) return
      setLoadingRange(true)
      try {
        const params = new URLSearchParams({
          athleteId,
          from: range.from,
          to: range.to,
        })
        const res = await fetch(`/api/planner?${params.toString()}`, { cache: 'no-store' })
        const data = (await res.json().catch(() => null)) as {
          error?: string
          sessions?: CoachTrainingSessionRow[]
          feedbacks?: CoachFeedbackRow[]
        } | null

        if (!res.ok) {
          throw new Error(data?.error || 'Nie udało się pobrać danych planera.')
        }

        if (cancelled) return

        const nextFeedbackByDate: FeedbackByDateMap = {}
        for (const fb of data?.feedbacks ?? []) {
          if (!nextFeedbackByDate[fb.date]) nextFeedbackByDate[fb.date] = fb
        }

        setVisibleSessions(data?.sessions ?? [])
        setVisibleFeedbackByDate(nextFeedbackByDate)
      } catch (error) {
        if (cancelled) return
        setStatusMessage({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Nie udało się pobrać danych planera.',
        })
      } finally {
        if (!cancelled) setLoadingRange(false)
      }
    }

    void loadRange()

    return () => {
      cancelled = true
    }
  }, [athleteId, range.from, range.to])

  return (
    <>
      <div>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setDensity('full')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap"
                style={{ background: density === 'full' ? '#FF5C1B' : 'transparent', color: density === 'full' ? 'white' : 'var(--text-muted)' }}
              >
                Widok pełny
              </button>
              <button
                onClick={() => setDensity('compact')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap"
                style={{ background: density === 'compact' ? '#FF5C1B' : 'transparent', color: density === 'compact' ? 'white' : 'var(--text-muted)' }}
              >
                Widok skrócony
              </button>
            </div>
            <button
              onClick={() => setShowFeedback((value) => !value)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap inline-flex items-center gap-1.5"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <span>{showFeedback ? '🙈' : '💬'}</span>
              <span>{showFeedback ? 'Ukryj feedback' : 'Pokaż feedback'}</span>
            </button>
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
              {copyWeekConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Skopiować ten tydzień na kolejny?</span>
                  <button onClick={handleCopyWeek} disabled={copyingWeek} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'rgba(255,92,27,0.12)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.22)' }}>
                    {copyingWeek ? 'Kopiowanie...' : 'Potwierdź'}
                  </button>
                  <button onClick={() => setCopyWeekConfirm(false)} disabled={copyingWeek} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    Anuluj
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setCopyWeekConfirm(true)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    Skopiuj tydzień
                  </button>
                  <button onClick={() => setSaveTemplateOpen(true)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    Zapisz szablon
                  </button>
                  <button onClick={() => void handleOpenTemplates()} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    Użyj szablonu
                  </button>
                </>
              )}
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
        </div>

        {statusMessage && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              background: statusMessage.tone === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${statusMessage.tone === 'success' ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'}`,
              color: statusMessage.tone === 'success' ? '#16A34A' : '#DC2626',
            }}
          >
            {statusMessage.text}
          </div>
        )}

        {loadingRange && (
          <div className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Ładowanie danych planera...
          </div>
        )}

        {/* Week view */}
        {planView === 'week' && (
          <div className="grid grid-cols-7 gap-2 pb-20" style={{ minHeight: '260px' }}>
            {weekDays.map(day => {
              const dateStr = toISODate(day)
              const daySessions = weekSessions.filter(s => s.date === dateStr)
              const todayFlag = isToday(dateStr)

              return (
                <div key={dateStr} className="flex flex-col rounded-2xl overflow-hidden"
                  onDragOver={(e) => {
                    if (!draggedSessionId) return
                    e.preventDefault()
                    if (dragTargetDate !== dateStr) setDragTargetDate(dateStr)
                  }}
                  onDragLeave={() => {
                    if (dragTargetDate === dateStr) setDragTargetDate(null)
                  }}
                  onDrop={(e) => {
                    if (!draggedSessionId) return
                    e.preventDefault()
                    void handleMoveSession(draggedSessionId, dateStr)
                  }}
                  style={{
                    border: dragTargetDate === dateStr
                      ? '2px solid rgba(255,92,27,0.75)'
                      : todayFlag
                      ? '2px solid rgba(255,92,27,0.5)'
                      : '1px solid var(--border)',
                    background: dragTargetDate === dateStr ? 'rgba(255,92,27,0.05)' : 'var(--bg-card)',
                  }}>
                  <div className="py-3 px-2 text-center shrink-0"
                    style={{ background: todayFlag ? 'rgba(255,92,27,0.07)' : 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <div className="text-xs font-medium capitalize" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-muted)' }}>
                      {dayName(day, true)}
                    </div>
                    <div className="text-xl font-black leading-tight mt-0.5" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-primary)' }}>
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                    {daySessions.length === 0 && (
                      <div className="h-full flex items-center justify-center py-4">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>wolny</span>
                      </div>
                    )}
                    {daySessions.map(session => (
                      <div key={session.id} onClick={() => openEditSession(session)}
                        draggable
                        onDragStart={(e) => {
                          setDraggedSessionId(session.id)
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', session.id)
                        }}
                        onDragEnd={() => {
                          setDraggedSessionId(null)
                          setDragTargetDate(null)
                        }}
                        className={`relative p-2 rounded-xl cursor-pointer hover:opacity-80 ${typeClass(session.type)}`}
                        style={{
                          ...typeStyle(session.type),
                          ...completionStyle(session),
                          opacity: draggedSessionId === session.id ? 0.55 : 1,
                        }}>
                        <div className="font-semibold text-xs leading-tight mb-1">{session.title}</div>
                        {density === 'full' && session.description && <div className="text-xs opacity-60 leading-tight mb-1">{session.description}</div>}
                        <div className="flex flex-col gap-0.5 text-xs opacity-75">
                          {session.planned_distance && <span>📏 {session.planned_distance} km</span>}
                          {session.planned_duration && <span>⏱ {session.planned_duration} min</span>}
                          {session.planned_pace && <span>⚡ {session.planned_pace}/km</span>}
                        </div>
                        {density === 'full' && session.actual_distance && (
                          <div className="flex flex-col gap-0.5 text-xs mt-1" style={{ color: 'rgba(46,204,113,0.9)' }}>
                            <span>✓ {session.actual_distance} km</span>
                            {session.actual_pace && <span>⚡ {session.actual_pace}/km</span>}
                          </div>
                        )}
                        {density === 'full' && session.url && (
                          <a href={session.url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 mt-1.5 text-xs opacity-80 hover:opacity-100">
                            🔗 <span className="underline">{session.url_label || 'Link'}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  {showFeedback && visibleFeedbackByDate[dateStr] && (
                    <div
                      className="px-1.5 pb-3 pt-2 shrink-0"
                      style={{ borderTop: daySessions.length > 0 ? '1px dashed var(--border-strong)' : 'none' }}
                    >
                      <button onClick={() => setFeedbackModalData(visibleFeedbackByDate[dateStr])}
                        className="w-full py-1 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1"
                        style={feedbackToneStyle(visibleFeedbackByDate[dateStr])}>
                        <span>{feedbackToneIcon(visibleFeedbackByDate[dateStr])}</span>
                        <span>feedback</span>
                      </button>
                    </div>
                  )}
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

        {/* Month view */}
        {planView === 'month' && (
          <div className="pb-20">
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
                    const daySessions = visibleSessions.filter(s => s.date === dateStr)
                    const todayFlag = isToday(dateStr)
                    const isSelected = selectedDay === dateStr
                    const dayNum = parseInt(dateStr.split('-')[2])
                    return (
                      <div key={dateStr} className="min-h-36 p-2 transition-colors"
                        onDragOver={(e) => {
                          if (!draggedSessionId) return
                          e.preventDefault()
                          if (dragTargetDate !== dateStr) setDragTargetDate(dateStr)
                        }}
                        onDragLeave={() => {
                          if (dragTargetDate === dateStr) setDragTargetDate(null)
                        }}
                        onDrop={(e) => {
                          if (!draggedSessionId) return
                          e.preventDefault()
                          void handleMoveSession(draggedSessionId, dateStr)
                        }}
                        style={{
                          background: dragTargetDate === dateStr
                            ? 'rgba(255,92,27,0.08)'
                            : isSelected
                            ? 'rgba(255,92,27,0.06)'
                            : 'var(--bg-card)',
                          borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                          outline: dragTargetDate === dateStr
                            ? '2px solid rgba(255,92,27,0.75)'
                            : todayFlag
                            ? '2px solid rgba(255,92,27,0.4)'
                            : 'none',
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
                              draggable
                              onDragStart={(e) => {
                                setDraggedSessionId(s.id)
                                e.dataTransfer.effectAllowed = 'move'
                                e.dataTransfer.setData('text/plain', s.id)
                              }}
                              onDragEnd={() => {
                                setDraggedSessionId(null)
                                setDragTargetDate(null)
                              }}
                              className={`relative p-2 rounded-xl cursor-pointer hover:opacity-80 ${typeClass(s.type)}`}
                              style={{
                                ...typeStyle(s.type),
                                ...completionStyle(s),
                                opacity: draggedSessionId === s.id ? 0.55 : 1,
                              }}>
                              <div className="font-semibold text-xs leading-tight mb-1">{s.title}</div>
                              {density === 'full' && s.description && <div className="text-xs opacity-60 leading-tight mb-1">{s.description}</div>}
                              <div className="flex flex-col gap-0.5 text-xs opacity-75">
                                {s.planned_distance && <span>📏 {s.planned_distance} km</span>}
                                {s.planned_duration && <span>⏱ {s.planned_duration} min</span>}
                                {s.planned_pace && <span>⚡ {s.planned_pace}/km</span>}
                              </div>
                              {density === 'full' && s.actual_distance && (
                                <div className="flex flex-col gap-0.5 text-xs mt-1" style={{ color: 'rgba(46,204,113,0.9)' }}>
                                  <span>✓ {s.actual_distance} km</span>
                                  {s.actual_pace && <span>⚡ {s.actual_pace}/km</span>}
                                </div>
                              )}
                              {density === 'full' && s.url && (
                                <a href={s.url} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="flex items-center gap-1 mt-1.5 text-xs opacity-80 hover:opacity-100">
                                  🔗 <span className="underline">{s.url_label || 'Link'}</span>
                                </a>
                              )}
                            </div>
                          ))}
                          {daySessions.length > 3 && <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>+{daySessions.length - 3} więcej</div>}
                        </div>
                        {showFeedback && visibleFeedbackByDate[dateStr] && (
                          <div
                            className="mt-2 pt-2"
                            style={{ borderTop: daySessions.length > 0 ? '1px dashed var(--border-strong)' : 'none' }}
                          >
                            <button onClick={e => { e.stopPropagation(); setFeedbackModalData(visibleFeedbackByDate[dateStr]) }}
                              className="w-full text-center cursor-pointer rounded-lg py-0.5"
                            style={{ fontSize: '10px', ...feedbackToneStyle(visibleFeedbackByDate[dateStr]) }}>
                              {feedbackToneIcon(visibleFeedbackByDate[dateStr])} feedback
                            </button>
                          </div>
                        )}
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
                {visibleSessions.filter(s => s.date === selectedDay).length === 0 ? (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak sesji — wolny dzień</div>
                ) : (
                  <div className="space-y-2">
                    {visibleSessions.filter(s => s.date === selectedDay).map(session => (
                      <div key={session.id} className={`flex items-center gap-4 p-3 rounded-xl ${typeClass(session.type)}`}
                        style={typeStyle(session.type)}>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{session.title}</div>
                          <div className="flex gap-4 text-xs opacity-70 mt-1">
                            {session.planned_distance && <span>📏 {session.planned_distance} km</span>}
                            {session.planned_duration && <span>⏱️ {session.planned_duration} min</span>}
                            {session.planned_pace && <span>⚡ {session.planned_pace}/km</span>}
                          </div>
                          {session.url && (
                            <a href={session.url} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 mt-1.5 text-xs opacity-80 hover:opacity-100 underline">
                              🔗 {session.url_label || 'Link'}
                            </a>
                          )}
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

      </div>

      {/* Feedback detail modal */}
      <Modal
        open={!!feedbackModalData}
        onClose={() => setFeedbackModalData(null)}
        title="Feedback zawodnika"
        size="sm"
      >
        {feedbackModalData && <FeedbackDetail fb={feedbackModalData} />}
      </Modal>

      <Modal
        open={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        title="Zapisz tydzień jako szablon"
        size="sm"
        footer={(
          <div className="flex gap-2">
            <button
              onClick={() => setSaveTemplateOpen(false)}
              className="px-4 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
            >
              Anuluj
            </button>
            <button
              onClick={() => void handleSaveTemplate()}
              disabled={templateActionLoading || !templateName.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60"
              style={{ background: '#FF5C1B' }}
            >
              {templateActionLoading ? 'Zapisywanie...' : 'Zapisz szablon'}
            </button>
          </div>
        )}
      >
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Zapiszesz układ bieżącego tygodnia jako gotowy szablon do ponownego użycia.
          </p>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>
              Nazwa szablonu
            </label>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="np. Tydzień bazowy 10 km"
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        title="Użyj szablonu tygodnia"
        size="sm"
      >
        <div className="space-y-3">
          {templatesLoading ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Ładowanie szablonów...</div>
          ) : templates.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nie masz jeszcze zapisanych szablonów tygodnia.
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{template.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Zapisano {formatDate(template.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={() => void handleApplyTemplate(template.id)}
                  disabled={templateActionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  style={{ background: '#FF5C1B' }}
                >
                  {templateActionLoading ? 'Trwa...' : 'Użyj'}
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Session modal */}
      {sessionModalOpen && (
        <SessionModal
          open={sessionModalOpen}
          onClose={() => setSessionModalOpen(false)}
          athleteId={athleteId}
          today={today}
          editSession={editingSession}
          initialDate={newSessionDate}
          onActionComplete={setStatusMessage}
        />
      )}
    </>
  )
}
