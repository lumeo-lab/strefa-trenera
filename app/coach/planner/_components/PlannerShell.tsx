'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { EmptyState } from '@/components/ui/EmptyState'
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
  const router = useRouter()
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id ?? '')
  const [ready, setReady] = useState(false)
  const [switchingAthlete, setSwitchingAthlete] = useState(false)

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
    if (!switchingAthlete) return
    const timeout = window.setTimeout(() => setSwitchingAthlete(false), 500)
    return () => window.clearTimeout(timeout)
  }, [switchingAthlete])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem('coach_planner_shell', JSON.stringify({ selectedAthleteId }))
  }, [ready, selectedAthleteId])

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId)

  function handleAthleteChange(nextAthleteId: string) {
    if (!nextAthleteId || nextAthleteId === selectedAthleteId) return
    setSwitchingAthlete(true)
    setSelectedAthleteId(nextAthleteId)
    router.replace(`/coach/planner?athlete=${nextAthleteId}`, { scroll: false })
  }

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
        <div className="p-4 sm:p-6">
          <EmptyState
            title="Planer jest jeszcze pusty"
            description="Dodaj aktywnego zawodnika, a tutaj pojawi się jego plan treningowy, sesje i feedback przypisany do dni."
          />
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div>
        <CoachTopbar title="Planer" subtitle="Ładowanie..." />
        <div className="p-4 sm:p-6">
          <EmptyState
            title="Przywracanie ostatniego widoku"
            description="Za chwilę wrócisz do ostatnio otwartego zawodnika i zapisanej konfiguracji planera."
          />
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
              onChange={(e) => handleAthleteChange(e.target.value)}
              disabled={switchingAthlete}
              className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer disabled:cursor-wait disabled:opacity-70 w-[min(58vw,14rem)] sm:w-56"
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
            {switchingAthlete && (
              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                Przełączanie...
              </span>
            )}
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
