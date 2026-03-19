'use client'

import { useEffect, useState } from 'react'
import type { CoachFeedbackRow, CoachTrainingSessionRow, FeedbackByDateMap, FeedbackBySessionMap } from '@/app/coach/athletes/[id]/_components/types'

interface UsePlannerDataArgs {
  athleteId: string
  sessions: CoachTrainingSessionRow[]
  feedbackBySession: FeedbackBySessionMap
  feedbackByDate: FeedbackByDateMap
  rangeFrom: string
  rangeTo: string
  stateReady: boolean
  persistenceKey?: string
  showStatus: (tone: 'error' | 'success', text: string) => void
}

export function usePlannerData({
  athleteId,
  sessions,
  feedbackBySession,
  feedbackByDate,
  rangeFrom,
  rangeTo,
  stateReady,
  persistenceKey,
  showStatus,
}: UsePlannerDataArgs) {
  const [visibleSessions, setVisibleSessions] = useState<CoachTrainingSessionRow[]>(sessions)
  const [visibleFeedbackBySession, setVisibleFeedbackBySession] = useState<FeedbackBySessionMap>(feedbackBySession)
  const [visibleFeedbackByDate, setVisibleFeedbackByDate] = useState<FeedbackByDateMap>(feedbackByDate)
  const [loadingRange, setLoadingRange] = useState(false)

  // Sync incoming props when available
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

  // Fetch data for current range
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    if (!stateReady) return () => {}

    async function loadRange() {
      if (!athleteId) return
      setLoadingRange(true)
      try {
        const params = new URLSearchParams({ athleteId, from: rangeFrom, to: rangeTo })
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
  }, [athleteId, rangeFrom, rangeTo, stateReady, showStatus])

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

  return {
    visibleSessions,
    visibleFeedbackBySession,
    visibleFeedbackByDate,
    loadingRange,
    mergeSessionsIntoVisible,
  }
}
