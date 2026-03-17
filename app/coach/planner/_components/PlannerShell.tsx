'use client'

import { useEffect, useMemo, useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { PlanTab } from '@/app/coach/athletes/[id]/_components/tabs/PlanTab'
import type { CoachFeedbackRow, CoachTrainingSessionRow, FeedbackByDateMap, FeedbackBySessionMap } from '@/app/coach/athletes/[id]/_components/types'

type Athlete = {
  id: string
  name: string
  avatar: string
  status: string
}

interface Props {
  athletes: Athlete[]
  sessions: CoachTrainingSessionRow[]
  feedbacks: CoachFeedbackRow[]
  today: string
  currentMonth: string
  requestedAthleteId?: string
}

export function PlannerShell({ athletes, sessions, feedbacks, today, currentMonth, requestedAthleteId }: Props) {
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id ?? '')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('coach_planner_shell')
      if (saved) {
        const parsed = JSON.parse(saved) as { selectedAthleteId?: string }
        if (parsed.selectedAthleteId && athletes.some((athlete) => athlete.id === parsed.selectedAthleteId)) {
          setSelectedAthleteId(parsed.selectedAthleteId)
        }
      }
    } catch {
      // ignore invalid saved planner state
    } finally {
      setReady(true)
    }
  }, [athletes])

  useEffect(() => {
    if (!ready || !requestedAthleteId) return
    if (athletes.some((athlete) => athlete.id === requestedAthleteId)) {
      setSelectedAthleteId(requestedAthleteId)
    }
  }, [ready, requestedAthleteId, athletes])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem('coach_planner_shell', JSON.stringify({ selectedAthleteId }))
  }, [ready, selectedAthleteId])

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId)

  // Filter sessions for selected athlete
  const athleteSessions = useMemo(
    () => sessions.filter(s => s.athlete_id === selectedAthleteId),
    [sessions, selectedAthleteId]
  )

  // Build feedbackByDate for selected athlete
  const feedbackByDate: FeedbackByDateMap = useMemo(() => {
    const map: FeedbackByDateMap = {}
    for (const fb of feedbacks) {
      if (fb.athlete_id === selectedAthleteId && !fb.session_id) {
        map[fb.date] = fb
      }
    }
    return map
  }, [feedbacks, selectedAthleteId])

  const feedbackBySession: FeedbackBySessionMap = useMemo(() => {
    const map: FeedbackBySessionMap = {}
    for (const fb of feedbacks) {
      if (fb.athlete_id === selectedAthleteId && fb.session_id) {
        map[fb.session_id] = fb
      }
    }
    return map
  }, [feedbacks, selectedAthleteId])

  if (athletes.length === 0) {
    return (
      <div>
        <CoachTopbar title="Planer" subtitle="Plan treningowy" />
        <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--text-muted)' }}>
          Brak aktywnych zawodników. Dodaj zawodnika, aby korzystać z planera.
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div>
        <CoachTopbar title="Planer" subtitle="Ładowanie..." />
        <div className="p-4 sm:p-6">
          <div className="rounded-2xl px-4 py-10 text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Przywracanie ostatniego widoku planera...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <CoachTopbar
        title="Planer"
        subtitle={selectedAthlete?.name ?? ''}
        actions={(
          <div className="flex items-center gap-2 max-w-full">
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-[0.08em] whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
              Zawodnik
            </span>
            <select
              value={selectedAthleteId}
              onChange={(e) => setSelectedAthleteId(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer w-[min(58vw,14rem)] sm:w-56"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-strong)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
              }}
              aria-label="Wybierz zawodnika"
            >
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </div>
        )}
      />

      <div className="p-4 sm:p-6">
        <PlanTab
          athleteId={selectedAthleteId}
          sessions={athleteSessions}
          feedbackBySession={feedbackBySession}
          feedbackByDate={feedbackByDate}
          today={today}
          currentMonth={currentMonth}
          persistenceKey={`coach_planner_tab:${selectedAthleteId}`}
        />
      </div>
    </div>
  )
}
