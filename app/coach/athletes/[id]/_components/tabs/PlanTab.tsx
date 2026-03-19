'use client'

import React, { startTransition, useCallback, useEffect, useState } from 'react'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import { useRouter } from 'next/navigation'
import {
  dayName, formatDate,
  getWeekDays, isToday, toISODate,
} from '@/lib/utils'
import { duplicateWeekSessions, moveSessionDate } from '@/lib/actions/sessions'
import { applyWeekTemplate, saveWeekTemplate } from '@/lib/actions/sessions'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'
import { FeedbackDetail } from '@/components/coach/FeedbackCard'
import { Modal } from '@/components/ui/Modal'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { SessionModal } from '../modals/SessionModal'
import { getMonthBounds, getMonthCalendar, shiftMonth } from '@/lib/calendar'
import { SessionCard } from './plan/SessionCard'
import { DayFeedbackSection } from './plan/DayFeedbackSection'
import { WeekTemplateModals } from './plan/WeekTemplateModals'
import { PlanToolbar } from './plan/PlanToolbar'
import type { CoachFeedbackRow, CoachTrainingSessionRow, FeedbackByDateMap, FeedbackBySessionMap } from '../types'

interface PlanTabProps {
  athleteId: string
  sessions: CoachTrainingSessionRow[]
  feedbackBySession: FeedbackBySessionMap
  feedbackByDate: FeedbackByDateMap
  today: string
  currentMonth: string
  persistenceKey?: string
}

export function PlanTab({ athleteId, sessions, feedbackBySession, feedbackByDate, today, currentMonth, persistenceKey }: PlanTabProps) {
  const router = useRouter()
  const { all: allSessionTypes } = useCustomSessionTypes()

  const [planView, setPlanView] = useState<'week' | 'month'>('week')
  const [density, setDensity] = useState<'full' | 'compact'>('full')
  const [showFeedback, setShowFeedback] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()
  const [visibleSessions, setVisibleSessions] = useState<CoachTrainingSessionRow[]>(sessions)
  const [visibleFeedbackBySession, setVisibleFeedbackBySession] = useState<FeedbackBySessionMap>(feedbackBySession)
  const [visibleFeedbackByDate, setVisibleFeedbackByDate] = useState<FeedbackByDateMap>(feedbackByDate)
  const [loadingRange, setLoadingRange] = useState(false)
  const [copyWeekConfirm, setCopyWeekConfirm] = useState(false)
  const [copyingWeek, setCopyingWeek] = useState(false)
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null)
  const [dragTargetDate, setDragTargetDate] = useState<string | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; created_at: string; itemCount?: number }>>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templateActionLoading, setTemplateActionLoading] = useState(false)
  const [stateReady, setStateReady] = useState(!persistenceKey)

  const handleDragEnd = useCallback(() => {
    setDraggedSessionId(null)
    setDragTargetDate(null)
  }, [])

  // Session modal
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<CoachTrainingSessionRow | null>(null)
  const [newSessionDate, setNewSessionDate] = useState('')

  // Feedback detail modal
  const [feedbackModalData, setFeedbackModalData] = useState<CoachFeedbackRow | null>(null)

  function typeStyle(type: string): React.CSSProperties {
    const c = allSessionTypes.find(t => t.key === type)
    return c?.color ? { background: c.color + '33', color: c.color } : {}
  }
  function getTypeLabel(type: string): string | undefined {
    return allSessionTypes.find(t => t.key === type)?.label
  }
  function completionStyle(session: CoachTrainingSessionRow): React.CSSProperties {
    if (session.completed) return { outline: '2px solid rgba(46,204,113,0.6)', outlineOffset: '-2px' }
    return {}
  }
  function openNewSession(date: string) {
    clearStatus()
    setNewSessionDate(date)
    setEditingSession(null)
    setSessionModalOpen(true)
  }

  function openEditSession(session: CoachTrainingSessionRow) {
    clearStatus()
    setEditingSession(session)
    setNewSessionDate('')
    setSessionModalOpen(true)
  }
  function getSessionFeedback(sessionId: string): CoachFeedbackRow | null {
    return visibleFeedbackBySession[sessionId] ?? null
  }
  function getDateFeedback(dateStr: string): CoachFeedbackRow | null {
    return visibleFeedbackByDate[dateStr] ?? null
  }

  function mergeSessionsIntoVisible(nextSessions: CoachTrainingSessionRow[]) {
    setVisibleSessions((current) => {
      const merged = [...current]
      for (const session of nextSessions) {
        if (!merged.some((item) => item.id === session.id)) {
          merged.push(session)
        }
      }
      return merged.sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
    })
  }

  async function handleMoveSession(sessionId: string, targetDate: string) {
    const session = visibleSessions.find((item) => item.id === sessionId)
    if (!session || session.date === targetDate) {
      setDraggedSessionId(null)
      setDragTargetDate(null)
      return
    }

    clearStatus()
    const result = await moveSessionDate(sessionId, athleteId, targetDate)
    setDraggedSessionId(null)
    setDragTargetDate(null)

    if (result && 'error' in result) {
      showStatus('error', result.error ?? 'Nie udało się przenieść sesji.')
      return
    }

    showStatus('success', 'Sesja została przeniesiona na nowy dzień.')
    startTransition(() => router.refresh())
  }

  async function handleCopyWeek() {
    if (copyingWeek) return
    setCopyingWeek(true)
    clearStatus()
    const result = await duplicateWeekSessions(athleteId, weekStart, weekEnd, 7)
    if (result && 'error' in result) {
      showStatus('error', result.error ?? 'Nie udało się skopiować tygodnia.')
      setCopyWeekConfirm(false)
      setCopyingWeek(false)
      return
    }
    showStatus('success', `Skopiowano ${result?.count ?? 0} ${result?.count === 1 ? 'sesję' : result?.count && result.count < 5 ? 'sesje' : 'sesji'} na kolejny tydzień.`)
    if (result && 'sessions' in result && Array.isArray(result.sessions) && result.sessions.length > 0) {
      mergeSessionsIntoVisible(result.sessions)
    }
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
        items?: Array<{ id: string; name: string; created_at: string; itemCount?: number }>
      } | null

      if (!res.ok) {
        throw new Error(data?.error || 'Nie udało się pobrać szablonów.')
      }

      setTemplates(data?.items ?? [])
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Nie udało się pobrać szablonów.')
    } finally {
      setTemplatesLoading(false)
    }
  }

  async function handleOpenTemplates() {
    setTemplatesOpen(true)
    clearStatus()
    await loadTemplates()
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) {
      showStatus('error', 'Podaj nazwę szablonu.')
      return
    }
    setTemplateActionLoading(true)
    clearStatus()
    const result = await saveWeekTemplate(athleteId, weekStart, weekEnd, templateName)
    if (result && 'error' in result) {
      showStatus('error', result.error ?? 'Nie udało się zapisać szablonu.')
      setTemplateActionLoading(false)
      return
    }
    setTemplateName('')
    setSaveTemplateOpen(false)
    setTemplateActionLoading(false)
    showStatus('success', 'Szablon tygodnia został zapisany.')
    await loadTemplates()
  }

  async function handleApplyTemplate(templateId: string) {
    setTemplateActionLoading(true)
    clearStatus()
    const result = await applyWeekTemplate(athleteId, templateId, weekStart)
    if (result && 'error' in result) {
      showStatus('error', result.error ?? 'Nie udało się zastosować szablonu.')
      setTemplateActionLoading(false)
      return
    }
    setTemplatesOpen(false)
    setTemplateActionLoading(false)
    if (result && 'sessions' in result && Array.isArray(result.sessions) && result.sessions.length > 0) {
      mergeSessionsIntoVisible(result.sessions)
    }
    showStatus('success', `Dodano ${result?.count ?? 0} ${result?.count === 1 ? 'sesję' : result?.count && result.count < 5 ? 'sesje' : 'sesji'} z szablonu.`)
    startTransition(() => router.refresh())
  }

  // Plan week data
  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])
  const weekSessions = visibleSessions.filter(s => s.date >= weekStart && s.date <= weekEnd)
  const monthSessions = visibleSessions.filter((session) => session.date.slice(0, 7) === selectedMonth)

  // Plan month data
  const calendarWeeks = getMonthCalendar(selectedMonth)
  const range = planView === 'week' ? { from: weekStart, to: weekEnd } : getMonthBounds(selectedMonth)

  useEffect(() => {
    if (!persistenceKey) {
      setStateReady(true)
      return
    }

    setStateReady(false)
    try {
      const saved = localStorage.getItem(persistenceKey)
      if (saved) {
        const parsed = JSON.parse(saved) as {
          planView?: 'week' | 'month'
          density?: 'full' | 'compact'
          showFeedback?: boolean
          weekOffset?: number
          selectedMonth?: string
          selectedDay?: string | null
        }
        if (parsed.planView === 'week' || parsed.planView === 'month') setPlanView(parsed.planView)
        if (parsed.density === 'full' || parsed.density === 'compact') setDensity(parsed.density)
        if (typeof parsed.showFeedback === 'boolean') setShowFeedback(parsed.showFeedback)
        if (typeof parsed.weekOffset === 'number' && Number.isFinite(parsed.weekOffset)) setWeekOffset(parsed.weekOffset)
        if (typeof parsed.selectedMonth === 'string' && /^\d{4}-\d{2}$/.test(parsed.selectedMonth)) setSelectedMonth(parsed.selectedMonth)
        if (typeof parsed.selectedDay === 'string' || parsed.selectedDay === null) setSelectedDay(parsed.selectedDay ?? null)
      } else {
        setPlanView('week')
        setDensity('full')
        setShowFeedback(true)
        setWeekOffset(0)
        setSelectedMonth(currentMonth)
        setSelectedDay(null)
      }
    } catch {
      setPlanView('week')
      setDensity('full')
      setShowFeedback(true)
      setWeekOffset(0)
      setSelectedMonth(currentMonth)
      setSelectedDay(null)
    } finally {
      setStateReady(true)
    }
  }, [persistenceKey, currentMonth, athleteId])

  useEffect(() => {
    if (!persistenceKey || !stateReady) return
    localStorage.setItem(
      persistenceKey,
      JSON.stringify({
        planView,
        density,
        showFeedback,
        weekOffset,
        selectedMonth,
        selectedDay,
      }),
    )
  }, [persistenceKey, stateReady, planView, density, showFeedback, weekOffset, selectedMonth, selectedDay])

  useEffect(() => {
    const hasIncomingPlannerData =
      sessions.length > 0 ||
      Object.keys(feedbackBySession).length > 0 ||
      Object.keys(feedbackByDate).length > 0

    if (persistenceKey && !hasIncomingPlannerData) return
    setVisibleSessions(sessions)
    setVisibleFeedbackBySession(feedbackBySession)
    setVisibleFeedbackByDate(feedbackByDate)
  }, [sessions, feedbackBySession, feedbackByDate, athleteId, persistenceKey])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    if (!stateReady) return () => {}

    async function loadRange() {
      if (!athleteId) return
      setLoadingRange(true)
      try {
        const params = new URLSearchParams({
          athleteId,
          from: range.from,
          to: range.to,
        })
        const res = await fetch(`/api/planner?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
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
        const nextFeedbackBySession: FeedbackBySessionMap = {}
        for (const fb of data?.feedbacks ?? []) {
          if (fb.session_id && !nextFeedbackBySession[fb.session_id]) {
            nextFeedbackBySession[fb.session_id] = fb
          } else if (!fb.session_id && !nextFeedbackByDate[fb.date]) {
            nextFeedbackByDate[fb.date] = fb
          }
        }

        setVisibleSessions(data?.sessions ?? [])
        setVisibleFeedbackBySession(nextFeedbackBySession)
        setVisibleFeedbackByDate(nextFeedbackByDate)
      } catch (error) {
        if (cancelled) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof TypeError && error.message === 'Load failed') return
        showStatus('error', error instanceof Error ? error.message : 'Nie udało się pobrać danych planera.')
      } finally {
        if (!cancelled) setLoadingRange(false)
      }
    }

    void loadRange()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [athleteId, range.from, range.to, stateReady, showStatus])

  if (!stateReady) {
    return (
      <div className="rounded-2xl px-4 py-10 text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        Przywracanie ostatniego widoku planera...
      </div>
    )
  }

  return (
    <>
      <div>
        {/* Toolbar */}
        <PlanToolbar
          planView={planView}
          setPlanView={setPlanView}
          density={density}
          setDensity={setDensity}
          showFeedback={showFeedback}
          setShowFeedback={setShowFeedback}
          weekStart={weekStart}
          weekEnd={weekEnd}
          onWeekPrev={() => setWeekOffset(w => w - 1)}
          onWeekNext={() => setWeekOffset(w => w + 1)}
          onWeekToday={() => setWeekOffset(0)}
          copyWeekConfirm={copyWeekConfirm}
          setCopyWeekConfirm={setCopyWeekConfirm}
          onCopyWeek={handleCopyWeek}
          copyingWeek={copyingWeek}
          onSaveTemplate={() => setSaveTemplateOpen(true)}
          onUseTemplate={() => void handleOpenTemplates()}
          selectedMonth={selectedMonth}
          onMonthPrev={() => setSelectedMonth(m => shiftMonth(m, -1))}
          onMonthNext={() => setSelectedMonth(m => shiftMonth(m, 1))}
          onMonthToday={() => setSelectedMonth(currentMonth)}
          monthSessionCount={monthSessions.length}
        />

        {statusMessage && (
          <StatusMessage tone={statusMessage.tone} text={statusMessage.text} className="mb-4" />
        )}

        {loadingRange && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            ⏳ Ładowanie danych planera...
          </div>
        )}

        {/* Week view */}
        {planView === 'week' && (
          <div className="overflow-x-auto pb-20">
            {weekSessions.length === 0 && (
              <div className="mb-4 rounded-2xl px-4 py-5" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
                <div className="text-sm font-semibold">Brak sesji w tym tygodniu</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Kliknij `+ dodaj` w wybranym dniu albo użyj szablonu, jeśli chcesz szybko ułożyć cały tydzień.
                </div>
              </div>
            )}
            <div className="grid grid-cols-7 gap-2 min-w-[980px]" style={{ minHeight: '260px' }}>
              {weekDays.map(day => {
              const dateStr = toISODate(day)
              const daySessions = weekSessions.filter(s => s.date === dateStr)
              const sessionFeedbacks = daySessions
                .map((session) => ({ session, feedback: getSessionFeedback(session.id) }))
                .filter((item): item is { session: CoachTrainingSessionRow; feedback: CoachFeedbackRow } => !!item.feedback)
              const dateFeedback = getDateFeedback(dateStr)
              const canShowNoFeedback = dateStr < today
              const missingSessionFeedbacks = canShowNoFeedback
                ? daySessions.filter((session) => !getSessionFeedback(session.id))
                : []
              const showNoFeedback = missingSessionFeedbacks.length > 0 && !dateFeedback
              const hasBottomFeedbackSection = sessionFeedbacks.length > 0 || !!dateFeedback || showNoFeedback
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
                    style={{ background: todayFlag ? 'rgba(255,92,27,0.10)' : 'var(--bg-elevated)', borderBottom: todayFlag ? '2px solid rgba(255,92,27,0.4)' : '1px solid var(--border)' }}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-muted)' }}>
                      {dayName(day, true)}
                    </div>
                    <div className="text-xl font-black leading-tight mt-0.5" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-primary)' }}>
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                    {daySessions.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center py-5 gap-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Dzień wolny</span>
                      </div>
                    )}
                    {daySessions.map(session => (
                      <div key={session.id} className="space-y-1.5">
                        <SessionCard
                          session={session}
                          density={density}
                          typeStyle={typeStyle(session.type)}
                          completionStyle={completionStyle(session)}
                          isDragging={draggedSessionId === session.id}
                          typeLabel={getTypeLabel(session.type)}
                          onClick={() => openEditSession(session)}
                          onDragStart={(e) => {
                            setDraggedSessionId(session.id)
                            e.dataTransfer.effectAllowed = 'move'
                            e.dataTransfer.setData('text/plain', session.id)
                          }}
                          onDragEnd={handleDragEnd}
                        />
                      </div>
                    ))}
                  </div>
                  {showFeedback && daySessions.length > 0 && hasBottomFeedbackSection && (
                    <div
                      className="px-1.5 pb-3 pt-2 shrink-0"
                      style={{ borderTop: '1px dashed var(--border-strong)' }}
                    >
                      <DayFeedbackSection
                        sessionFeedbacks={sessionFeedbacks}
                        dateFeedback={dateFeedback}
                        showNoFeedback={showNoFeedback}

                        totalDaySessions={daySessions.length}
                        onFeedbackClick={setFeedbackModalData}
                        compact={false}
                      />
                  </div>
                  )}
                  <div className="p-1.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={() => openNewSession(dateStr)}
                      className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors hover:opacity-80"
                      style={{ background: 'rgba(255,92,27,0.06)', color: '#FF5C1B' }}>+ Dodaj</button>
                  </div>
                </div>
              )
              })}
            </div>
          </div>
        )}

        {/* Month view */}
        {planView === 'month' && (
          <div className="pb-20 overflow-x-auto">
            {monthSessions.length === 0 && (
              <div className="mb-4 rounded-2xl px-4 py-5" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
                <div className="text-sm font-semibold">Brak sesji w tym miesiącu</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Dodaj pierwszy trening z poziomu wybranego dnia albo wróć do widoku tygodnia, jeśli chcesz planować szybciej.
                </div>
              </div>
            )}
            <div className="rounded-2xl overflow-hidden min-w-[980px]" style={{ border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
                {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(d => (
                  <div key={d} className="py-3 text-center text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{d}</div>
                ))}
              </div>
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < calendarWeeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {week.map((dateStr, di) => {
                    if (!dateStr) return (
                      <div key={di} className="min-h-[11rem] p-2.5" style={{ background: 'var(--bg-base)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />
                    )
                    const daySessions = visibleSessions.filter(s => s.date === dateStr)
                    const sessionFeedbacks = daySessions
                      .map((session) => ({ session, feedback: getSessionFeedback(session.id) }))
                      .filter((item): item is { session: CoachTrainingSessionRow; feedback: CoachFeedbackRow } => !!item.feedback)
                    const dateFeedback = getDateFeedback(dateStr)
                    const canShowNoFeedback = dateStr < today
                    const missingSessionFeedbacks = canShowNoFeedback
                      ? daySessions.filter((session) => !getSessionFeedback(session.id))
                      : []
                    const showNoFeedback = missingSessionFeedbacks.length > 0 && !dateFeedback
                    const hasBottomFeedbackSection = sessionFeedbacks.length > 0 || !!dateFeedback || showNoFeedback
                    const todayFlag = isToday(dateStr)
                    const isSelected = selectedDay === dateStr
                    const dayNum = parseInt(dateStr.split('-')[2])
                    return (
                      <div key={dateStr} className="min-h-[11rem] p-2.5 transition-colors flex flex-col"
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
                        <div className="flex items-center justify-between mb-2">
                          <button onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                            className="text-sm font-bold cursor-pointer w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                            style={{
                              background: todayFlag ? '#FF5C1B' : isSelected ? 'rgba(255,92,27,0.15)' : 'transparent',
                              color: todayFlag ? 'white' : isSelected ? '#FF5C1B' : 'var(--text-primary)',
                            }}>
                            {dayNum}
                          </button>
                          <button onClick={e => { e.stopPropagation(); openNewSession(dateStr) }}
                            title="Dodaj sesję"
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer"
                            style={{ background: 'rgba(255,92,27,0.08)', color: '#FF5C1B' }}>+</button>
                        </div>
                        <div className="space-y-1 flex-1">
                          {daySessions.slice(0, 3).map(s => (
                            <div key={s.id} className="space-y-1">
                              <SessionCard
                                session={s}
                                density={density}
                                typeStyle={typeStyle(s.type)}
                                completionStyle={completionStyle(s)}
                                isDragging={draggedSessionId === s.id}
                                typeLabel={getTypeLabel(s.type)}
                                onClick={() => openEditSession(s)}
                                onDragStart={(e) => {
                                  setDraggedSessionId(s.id)
                                  e.dataTransfer.effectAllowed = 'move'
                                  e.dataTransfer.setData('text/plain', s.id)
                                }}
                                onDragEnd={() => {
                                  setDraggedSessionId(null)
                                  setDragTargetDate(null)
                                }}
                              />
                            </div>
                          ))}
                          {daySessions.length > 3 && (
                            <button
                              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80"
                              style={{ background: 'var(--bg-elevated)', color: '#FF5C1B', border: '1px solid var(--border)' }}
                            >
                              +{daySessions.length - 3} więcej
                            </button>
                          )}
                        </div>
                        {showFeedback && daySessions.length > 0 && hasBottomFeedbackSection && (
                          <div
                            className="mt-auto pt-2"
                            style={{ borderTop: '1px dashed var(--border-strong)' }}
                          >
                            <DayFeedbackSection
                              sessionFeedbacks={sessionFeedbacks}
                              dateFeedback={dateFeedback}
                              showNoFeedback={showNoFeedback}
      
                              totalDaySessions={daySessions.length}
                              onFeedbackClick={setFeedbackModalData}
                              compact={true}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            {selectedDay && (
              <div className="mt-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold capitalize">{formatDate(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {visibleSessions.filter(s => s.date === selectedDay).length} {visibleSessions.filter(s => s.date === selectedDay).length === 1 ? 'sesja' : 'sesje'}
                    </div>
                  </div>
                  <button onClick={() => openNewSession(selectedDay)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>+ Dodaj sesję</button>
                </div>
                {visibleSessions.filter(s => s.date === selectedDay).length === 0 ? (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak sesji — wolny dzień</div>
                ) : (
                  <div className="space-y-2">
                    {visibleSessions.filter(s => s.date === selectedDay).map(session => (
                      <div key={session.id} className="flex items-center gap-4 p-3 rounded-xl"
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

      <WeekTemplateModals
        saveOpen={saveTemplateOpen}
        onSaveClose={() => setSaveTemplateOpen(false)}
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
        onSaveTemplate={() => void handleSaveTemplate()}
        saving={templateActionLoading}
        useOpen={templatesOpen}
        onUseClose={() => setTemplatesOpen(false)}
        templates={templates}
        templatesLoading={templatesLoading}
        onApplyTemplate={(id) => void handleApplyTemplate(id)}
        applying={templateActionLoading}
      />

      {/* Session modal */}
      {sessionModalOpen && (
        <SessionModal
          open={sessionModalOpen}
          onClose={() => setSessionModalOpen(false)}
          athleteId={athleteId}
          editSession={editingSession}
          initialDate={newSessionDate}
          onActionComplete={(notice) => showStatus(notice.tone, notice.text)}
        />
      )}
    </>
  )
}
