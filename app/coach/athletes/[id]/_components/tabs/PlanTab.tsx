'use client'

import React, { startTransition, useCallback, useState } from 'react'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import { useRouter } from 'next/navigation'
import { getWeekDays, toISODate } from '@/lib/utils'
import { duplicateWeekSessions, moveSessionDate } from '@/lib/actions/sessions'
import { applyWeekTemplate, saveWeekTemplate } from '@/lib/actions/sessions'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'
import { FeedbackDetail } from '@/components/coach/FeedbackCard'
import { Modal } from '@/components/ui/Modal'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { SessionModal } from '@/app/coach/athletes/[id]/_components/modals/SessionModal'
import { getMonthBounds, getMonthCalendar, shiftMonth } from '@/lib/calendar'
import { WeekTemplateModals } from '@/app/coach/athletes/[id]/_components/tabs/plan/WeekTemplateModals'
import { PlanToolbar } from '@/app/coach/athletes/[id]/_components/tabs/plan/PlanToolbar'
import { PlanWeekView } from '@/app/coach/athletes/[id]/_components/tabs/plan/PlanWeekView'
import { PlanMonthView } from '@/app/coach/athletes/[id]/_components/tabs/plan/PlanMonthView'
import { usePlanPersistence } from '@/app/coach/athletes/[id]/_components/tabs/plan/usePlanPersistence'
import { usePlannerData } from '@/app/coach/athletes/[id]/_components/tabs/plan/usePlannerData'
import type { CoachFeedbackRow, CoachTrainingSessionRow, FeedbackByDateMap, FeedbackBySessionMap } from '@/app/coach/athletes/[id]/_components/types'

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
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()

  // Persisted view state
  const {
    planView, setPlanView,
    density, setDensity,
    showFeedback, setShowFeedback,
    weekOffset, setWeekOffset,
    selectedMonth, setSelectedMonth,
    selectedDay, setSelectedDay,
    stateReady,
  } = usePlanPersistence({ persistenceKey, currentMonth, athleteId })

  // Computed date ranges
  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])
  const range = planView === 'week' ? { from: weekStart, to: weekEnd } : getMonthBounds(selectedMonth)

  // Visible planner data (with range-loading)
  const {
    visibleSessions, visibleFeedbackBySession, visibleFeedbackByDate,
    loadingRange, mergeSessionsIntoVisible,
  } = usePlannerData({
    athleteId, sessions, feedbackBySession, feedbackByDate,
    rangeFrom: range.from, rangeTo: range.to,
    stateReady, persistenceKey, showStatus,
  })

  const weekSessions = visibleSessions.filter(s => s.date >= weekStart && s.date <= weekEnd)
  const monthSessions = visibleSessions.filter(s => s.date.slice(0, 7) === selectedMonth)
  const calendarWeeks = getMonthCalendar(selectedMonth)

  // Session modal state
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<CoachTrainingSessionRow | null>(null)
  const [newSessionDate, setNewSessionDate] = useState('')
  const [feedbackModalData, setFeedbackModalData] = useState<CoachFeedbackRow | null>(null)

  // Drag state
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null)
  const [dragTargetDate, setDragTargetDate] = useState<string | null>(null)

  // Template state
  const [copyWeekConfirm, setCopyWeekConfirm] = useState(false)
  const [copyingWeek, setCopyingWeek] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; created_at: string; itemCount?: number }>>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templateActionLoading, setTemplateActionLoading] = useState(false)

  // --- Style helpers ---

  const typeStyle = useCallback((type: string): React.CSSProperties => {
    const c = allSessionTypes.find(t => t.key === type)
    return c?.color ? { background: c.color + '33', color: c.color } : {}
  }, [allSessionTypes])

  const getTypeLabel = useCallback((type: string): string | undefined => {
    return allSessionTypes.find(t => t.key === type)?.label
  }, [allSessionTypes])

  const completionStyle = useCallback((session: CoachTrainingSessionRow): React.CSSProperties => {
    if (session.completed) return { outline: '2px solid rgba(46,204,113,0.6)', outlineOffset: '-2px' }
    return {}
  }, [])

  const getSessionFeedback = useCallback((sessionId: string): CoachFeedbackRow | null => {
    return visibleFeedbackBySession[sessionId] ?? null
  }, [visibleFeedbackBySession])

  const getDateFeedback = useCallback((dateStr: string): CoachFeedbackRow | null => {
    return visibleFeedbackByDate[dateStr] ?? null
  }, [visibleFeedbackByDate])

  // --- Session modal helpers ---

  function openNewSession(date: string) {
    clearStatus(); setNewSessionDate(date); setEditingSession(null); setSessionModalOpen(true)
  }
  function openEditSession(session: CoachTrainingSessionRow) {
    clearStatus(); setEditingSession(session); setNewSessionDate(''); setSessionModalOpen(true)
  }

  // --- Drag handlers ---

  const handleDragEnd = useCallback(() => { setDraggedSessionId(null); setDragTargetDate(null) }, [])
  const handleDragStart = useCallback((sessionId: string, e: React.DragEvent) => {
    setDraggedSessionId(sessionId); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', sessionId)
  }, [])
  const handleDragOver = useCallback((dateStr: string) => { setDragTargetDate(prev => prev !== dateStr ? dateStr : prev) }, [])
  const handleDragLeave = useCallback((dateStr: string) => { setDragTargetDate(prev => prev === dateStr ? null : prev) }, [])

  async function handleMoveSession(sessionId: string, targetDate: string) {
    const session = visibleSessions.find(item => item.id === sessionId)
    if (!session || session.date === targetDate) { setDraggedSessionId(null); setDragTargetDate(null); return }
    clearStatus()
    const result = await moveSessionDate(sessionId, athleteId, targetDate)
    setDraggedSessionId(null); setDragTargetDate(null)
    if (result && 'error' in result) { showStatus('error', result.error ?? 'Nie udało się przenieść sesji.'); return }
    showStatus('success', 'Sesja została przeniesiona na nowy dzień.')
    startTransition(() => router.refresh())
  }

  const handleDrop = useCallback((dateStr: string) => {
    if (draggedSessionId) void handleMoveSession(draggedSessionId, dateStr)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggedSessionId])

  // --- Week copy & templates ---

  async function handleCopyWeek() {
    if (copyingWeek) return
    setCopyingWeek(true); clearStatus()
    const result = await duplicateWeekSessions(athleteId, weekStart, weekEnd, 7)
    if (result && 'error' in result) {
      showStatus('error', result.error ?? 'Nie udało się skopiować tygodnia.')
      setCopyWeekConfirm(false); setCopyingWeek(false); return
    }
    showStatus('success', `Skopiowano ${result?.count ?? 0} ${result?.count === 1 ? 'sesję' : result?.count && result.count < 5 ? 'sesje' : 'sesji'} na kolejny tydzień.`)
    if (result && 'sessions' in result && Array.isArray(result.sessions) && result.sessions.length > 0) mergeSessionsIntoVisible(result.sessions)
    setCopyWeekConfirm(false); setCopyingWeek(false)
    startTransition(() => router.refresh())
  }

  async function loadTemplates() {
    setTemplatesLoading(true)
    try {
      const res = await fetch('/api/week-templates', { cache: 'no-store' })
      const data = (await res.json().catch(() => null)) as { error?: string; items?: Array<{ id: string; name: string; created_at: string; itemCount?: number }> } | null
      if (!res.ok) throw new Error(data?.error || 'Nie udało się pobrać szablonów.')
      setTemplates(data?.items ?? [])
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Nie udało się pobrać szablonów.')
    } finally { setTemplatesLoading(false) }
  }

  async function handleOpenTemplates() { setTemplatesOpen(true); clearStatus(); await loadTemplates() }

  async function handleSaveTemplate() {
    if (!templateName.trim()) { showStatus('error', 'Podaj nazwę szablonu.'); return }
    setTemplateActionLoading(true); clearStatus()
    const result = await saveWeekTemplate(athleteId, weekStart, weekEnd, templateName)
    if (result && 'error' in result) { showStatus('error', result.error ?? 'Nie udało się zapisać szablonu.'); setTemplateActionLoading(false); return }
    setTemplateName(''); setSaveTemplateOpen(false); setTemplateActionLoading(false)
    showStatus('success', 'Szablon tygodnia został zapisany.')
    await loadTemplates()
  }

  async function handleApplyTemplate(templateId: string) {
    setTemplateActionLoading(true); clearStatus()
    const result = await applyWeekTemplate(athleteId, templateId, weekStart)
    if (result && 'error' in result) { showStatus('error', result.error ?? 'Nie udało się zastosować szablonu.'); setTemplateActionLoading(false); return }
    setTemplatesOpen(false); setTemplateActionLoading(false)
    if (result && 'sessions' in result && Array.isArray(result.sessions) && result.sessions.length > 0) mergeSessionsIntoVisible(result.sessions)
    showStatus('success', `Dodano ${result?.count ?? 0} ${result?.count === 1 ? 'sesję' : result?.count && result.count < 5 ? 'sesje' : 'sesji'} z szablonu.`)
    startTransition(() => router.refresh())
  }

  // --- Render ---

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
        <PlanToolbar
          planView={planView} setPlanView={setPlanView}
          density={density} setDensity={setDensity}
          showFeedback={showFeedback} setShowFeedback={setShowFeedback}
          weekStart={weekStart} weekEnd={weekEnd}
          onWeekPrev={() => setWeekOffset(w => w - 1)}
          onWeekNext={() => setWeekOffset(w => w + 1)}
          onWeekToday={() => setWeekOffset(0)}
          copyWeekConfirm={copyWeekConfirm} setCopyWeekConfirm={setCopyWeekConfirm}
          onCopyWeek={handleCopyWeek} copyingWeek={copyingWeek}
          onSaveTemplate={() => setSaveTemplateOpen(true)}
          onUseTemplate={() => void handleOpenTemplates()}
          selectedMonth={selectedMonth}
          onMonthPrev={() => setSelectedMonth(m => shiftMonth(m, -1))}
          onMonthNext={() => setSelectedMonth(m => shiftMonth(m, 1))}
          onMonthToday={() => setSelectedMonth(currentMonth)}
          monthSessionCount={monthSessions.length}
        />

        {statusMessage && <StatusMessage tone={statusMessage.tone} text={statusMessage.text} className="mb-4" />}

        {loadingRange && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            ⏳ Ładowanie danych planera...
          </div>
        )}

        {planView === 'week' && (
          <PlanWeekView
            weekDays={weekDays} weekSessions={weekSessions} today={today}
            density={density} showFeedback={showFeedback}
            draggedSessionId={draggedSessionId} dragTargetDate={dragTargetDate}
            typeStyle={typeStyle} completionStyle={completionStyle} getTypeLabel={getTypeLabel}
            getSessionFeedback={getSessionFeedback} getDateFeedback={getDateFeedback}
            onSessionClick={openEditSession} onAddSession={openNewSession}
            onDragStart={handleDragStart} onDragEnd={handleDragEnd}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onFeedbackClick={setFeedbackModalData}
          />
        )}

        {planView === 'month' && (
          <PlanMonthView
            calendarWeeks={calendarWeeks} monthSessions={monthSessions}
            visibleSessions={visibleSessions} today={today}
            density={density} showFeedback={showFeedback}
            selectedDay={selectedDay} setSelectedDay={setSelectedDay}
            draggedSessionId={draggedSessionId} dragTargetDate={dragTargetDate}
            typeStyle={typeStyle} completionStyle={completionStyle} getTypeLabel={getTypeLabel}
            getSessionFeedback={getSessionFeedback} getDateFeedback={getDateFeedback}
            onSessionClick={openEditSession} onAddSession={openNewSession}
            onDragStart={handleDragStart} onDragEnd={handleDragEnd}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onFeedbackClick={setFeedbackModalData}
          />
        )}
      </div>

      <Modal open={!!feedbackModalData} onClose={() => setFeedbackModalData(null)} title="Feedback zawodnika" size="sm">
        {feedbackModalData && <FeedbackDetail fb={feedbackModalData} />}
      </Modal>

      <WeekTemplateModals
        saveOpen={saveTemplateOpen} onSaveClose={() => setSaveTemplateOpen(false)}
        templateName={templateName} onTemplateNameChange={setTemplateName}
        onSaveTemplate={() => void handleSaveTemplate()} saving={templateActionLoading}
        useOpen={templatesOpen} onUseClose={() => setTemplatesOpen(false)}
        templates={templates} templatesLoading={templatesLoading}
        onApplyTemplate={(id) => void handleApplyTemplate(id)} applying={templateActionLoading}
      />

      {sessionModalOpen && (
        <SessionModal
          open={sessionModalOpen} onClose={() => setSessionModalOpen(false)}
          athleteId={athleteId} editSession={editingSession} initialDate={newSessionDate}
          onActionComplete={(notice) => showStatus(notice.tone, notice.text)}
        />
      )}
    </>
  )
}
