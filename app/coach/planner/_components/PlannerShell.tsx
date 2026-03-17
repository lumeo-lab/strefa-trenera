'use client'

import { useMemo, useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { PlanTab } from '@/app/coach/athletes/[id]/_components/tabs/PlanTab'
import type { CoachFeedbackRow, CoachTrainingSessionRow, FeedbackByDateMap } from '@/app/coach/athletes/[id]/_components/types'

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
}

export function PlannerShell({ athletes, sessions, feedbacks, today, currentMonth }: Props) {
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id ?? '')

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
      if (fb.athlete_id === selectedAthleteId) {
        map[fb.date] = fb
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

  return (
    <div>
      <CoachTopbar
        title="Planer"
        subtitle={selectedAthlete?.name ?? ''}
        actions={(
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
              Zawodnik
            </span>
            <select
              value={selectedAthleteId}
              onChange={(e) => setSelectedAthleteId(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer min-w-56"
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

      <div className="p-6">
        {/* Reuse PlanTab from athlete profile */}
        <PlanTab
          athleteId={selectedAthleteId}
          sessions={athleteSessions}
          feedbackByDate={feedbackByDate}
          today={today}
          currentMonth={currentMonth}
        />
      </div>
    </div>
  )
}
