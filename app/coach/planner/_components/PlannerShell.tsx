'use client'

import { useMemo, useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
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
      <CoachTopbar title="Planer" subtitle={selectedAthlete?.name ?? ''} />

      <div className="p-6">
        {/* Athlete selector */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {athletes.map(a => {
              const isActive = a.id === selectedAthleteId
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAthleteId(a.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all"
                  style={{
                    background: isActive ? 'rgba(255,92,27,0.12)' : 'var(--bg-subtle)',
                    border: isActive ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
                    color: isActive ? '#FF5C1B' : 'var(--text-muted)',
                  }}
                >
                  <Avatar initials={a.avatar} size="sm" />
                  <span className={isActive ? 'font-semibold' : 'font-medium'}>{a.name}</span>
                </button>
              )
            })}
          </div>
        </div>

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
