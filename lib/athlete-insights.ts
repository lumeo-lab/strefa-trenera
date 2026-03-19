import { FEELING_LABELS } from '@/lib/constants'
import { addDaysToBusinessDate } from '@/lib/date'
import {
  getSessionExecutionStatus,
  isSessionPastUnresolved,
  shouldCountSessionInCompliance,
} from '@/lib/session-status'
import type {
  SessionActualDataSource,
  SessionCompletionSource,
  SessionExecutionStatus,
  SessionType,
} from '@/lib/types'
import { parseFeedbackTranscript, sessionTypeLabel } from '@/lib/utils'

type InsightSession = {
  id: string
  date: string
  type: SessionType
  title: string
  planned_distance: number | null
  planned_duration: number | null
  actual_distance: number | null
  actual_duration: number | null
  status?: SessionExecutionStatus | null
  completed?: boolean | null
  completion_source?: SessionCompletionSource | null
  actual_data_source?: SessionActualDataSource | null
}

type InsightFeedback = {
  id: string
  session_id: string | null
  date: string
  created_at: string
  source: string
  transcript: string
  feeling: string | null
  rpe: number | null
  pain_flag: boolean
  pain_note: string | null
  notes_structured: string | null
  voice_transcript: string | null
}

export type AthleteInsightFlag = {
  tone: 'red' | 'orange' | 'yellow' | 'green'
  title: string
  detail: string
}

export type AthleteInsightTypeStat = {
  type: SessionType
  label: string
  sessions: number
  completed: number
  skipped: number
  detected: number
  unresolved: number
  completionRate: number | null
  avgRpe: number | null
  painCount: number
}

export type AthleteInsightRecentSession = {
  id: string
  date: string
  title: string
  type: SessionType
  status: SessionExecutionStatus
  completionSource: SessionCompletionSource | null
  actualDataSource: SessionActualDataSource | null
  rpe: number | null
  feeling: string | null
  painFlag: boolean
}

export type AthleteInsights = {
  window: {
    last28Start: string
    last14Start: string
    last56Start: string
    previous14Start: string
    previous14End: string
  }
  overview: {
    dueSessions: number
    completedSessions: number
    skippedSessions: number
    detectedSessions: number
    unresolvedSessions: number
    completionRate: number | null
    actualCoverage: number | null
    feedbackCoverage: number | null
  }
  planVsActual: {
    distance: {
      planned: number
      actual: number
      coverage: number
      deltaPercent: number | null
    } | null
    duration: {
      planned: number
      actual: number
      coverage: number
      deltaPercent: number | null
    } | null
  }
  reaction: {
    avgRpe: number | null
    previousAvgRpe: number | null
    rpeDelta: number | null
    dominantFeeling: string | null
    dominantFeelingLabel: string | null
    painCount: number
    feedbackCount: number
  }
  actualSources: Array<{
    source: SessionActualDataSource
    label: string
    count: number
  }>
  typeStats: AthleteInsightTypeStat[]
  flags: AthleteInsightFlag[]
  recentSessions: AthleteInsightRecentSession[]
}

type NormalizedFeedback = {
  id: string
  sessionId: string | null
  date: string
  createdAt: string
  feeling: string | null
  rpe: number | null
  painFlag: boolean
  note: string | null
  voice: string | null
}

const FEELING_SCORE: Record<string, number> = {
  '😫': 1,
  '😕': 2,
  '😐': 3,
  '😊': 4,
  '🤩': 5,
}

const ACTUAL_SOURCE_LABELS: Record<SessionActualDataSource, string> = {
  athlete: 'Dane od zawodnika',
  coach: 'Korekta trenera',
  strava: 'Strava / urządzenie',
  imported: 'Import historyczny',
}

function average(values: number[]) {
  if (values.length === 0) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

function percentage(value: number, total: number) {
  if (total === 0) return null
  return Math.round((value / total) * 100)
}

function percentageDelta(actual: number, planned: number) {
  if (planned <= 0) return null
  return Math.round(((actual - planned) / planned) * 100)
}

function isWithinRange(date: string, from: string, to: string) {
  return date >= from && date <= to
}

function normalizeFeedback(feedback: InsightFeedback): NormalizedFeedback {
  const parsed = parseFeedbackTranscript(feedback.transcript ?? '')
  const parsedRpe = parsed.rpe ? Number(parsed.rpe.replace(/[^\d]/g, '')) : null

  return {
    id: feedback.id,
    sessionId: feedback.session_id,
    date: feedback.date,
    createdAt: feedback.created_at,
    feeling: feedback.feeling ?? parsed.feeling ?? null,
    rpe: feedback.rpe ?? (Number.isFinite(parsedRpe) ? parsedRpe : null),
    painFlag: feedback.pain_flag || !!feedback.pain_note || !!parsed.pain,
    note: feedback.notes_structured ?? parsed.notes ?? null,
    voice: feedback.voice_transcript ?? parsed.voice ?? null,
  }
}

function feedbackScore(feedback: NormalizedFeedback) {
  let score = 0
  if (feedback.feeling) score += 2
  if (feedback.rpe != null) score += 3
  if (feedback.painFlag) score += 2
  if (feedback.note) score += 1
  if (feedback.voice) score += 1
  return score
}

function dedupeFeedback(feedbacks: InsightFeedback[]) {
  const map = new Map<string, NormalizedFeedback>()

  for (const rawFeedback of feedbacks) {
    const feedback = normalizeFeedback(rawFeedback)
    const key = feedback.sessionId ? `session:${feedback.sessionId}` : `date:${feedback.date}`
    const existing = map.get(key)

    if (!existing) {
      map.set(key, feedback)
      continue
    }

    const existingScore = feedbackScore(existing)
    const nextScore = feedbackScore(feedback)

    if (nextScore > existingScore || (nextScore === existingScore && feedback.createdAt > existing.createdAt)) {
      map.set(key, feedback)
    }
  }

  return [...map.values()]
}

function getFeedbackForSession(feedbacks: NormalizedFeedback[], session: InsightSession) {
  return feedbacks.find((feedback) => feedback.sessionId === session.id)
    ?? feedbacks.find((feedback) => !feedback.sessionId && feedback.date === session.date)
    ?? null
}

function hasActualData(session: InsightSession) {
  return session.actual_distance != null || session.actual_duration != null
}

export function buildAthleteInsights({
  sessions,
  feedbacks,
  today,
}: {
  sessions: InsightSession[]
  feedbacks: InsightFeedback[]
  today: string
}): AthleteInsights {
  const last28Start = addDaysToBusinessDate(today, -27)
  const last14Start = addDaysToBusinessDate(today, -13)
  const last56Start = addDaysToBusinessDate(today, -55)
  const previous14End = addDaysToBusinessDate(last14Start, -1)
  const previous14Start = addDaysToBusinessDate(previous14End, -13)

  const normalizedFeedbacks = dedupeFeedback(feedbacks)
  const nonRestSessions = sessions.filter((session) => session.type !== 'rest')

  const dueSessions28 = nonRestSessions.filter((session) =>
    isWithinRange(session.date, last28Start, today) && shouldCountSessionInCompliance(session, today)
  )

  const completedSessions28 = dueSessions28.filter((session) => getSessionExecutionStatus(session) === 'completed')
  const skippedSessions28 = dueSessions28.filter((session) => getSessionExecutionStatus(session) === 'skipped')
  const detectedSessions28 = dueSessions28.filter((session) => getSessionExecutionStatus(session) === 'detected')
  const unresolvedSessions28 = dueSessions28.filter((session) => isSessionPastUnresolved(session, today))

  const feedback28 = normalizedFeedbacks.filter((feedback) => isWithinRange(feedback.date, last28Start, today))
  const feedback14 = normalizedFeedbacks.filter((feedback) => isWithinRange(feedback.date, last14Start, today))
  const feedbackPrev14 = normalizedFeedbacks.filter((feedback) => isWithinRange(feedback.date, previous14Start, previous14End))

  const avgRpe = average(feedback28.map((feedback) => feedback.rpe).filter((value): value is number => value != null))
  const recentAvgRpe = average(feedback14.map((feedback) => feedback.rpe).filter((value): value is number => value != null))
  const previousAvgRpe = average(feedbackPrev14.map((feedback) => feedback.rpe).filter((value): value is number => value != null))
  const rpeDelta = recentAvgRpe != null && previousAvgRpe != null
    ? Number((recentAvgRpe - previousAvgRpe).toFixed(1))
    : null

  const feelingCounts = feedback28.reduce<Record<string, number>>((acc, feedback) => {
    if (feedback.feeling) acc[feedback.feeling] = (acc[feedback.feeling] ?? 0) + 1
    return acc
  }, {})
  const dominantFeeling = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const sessionsWithActuals28 = dueSessions28.filter((session) => hasActualData(session))
  const feedbackSessionKeys28 = new Set(
    dueSessions28
      .filter((session) => getFeedbackForSession(feedback28, session))
      .map((session) => session.id),
  )

  const distanceSessions = dueSessions28.filter((session) =>
    (getSessionExecutionStatus(session) === 'completed' || getSessionExecutionStatus(session) === 'detected')
    && session.planned_distance != null
    && session.actual_distance != null
  )
  const durationSessions = dueSessions28.filter((session) =>
    (getSessionExecutionStatus(session) === 'completed' || getSessionExecutionStatus(session) === 'detected')
    && session.planned_duration != null
    && session.actual_duration != null
  )

  const distancePlanned = distanceSessions.reduce((sum, session) => sum + (session.planned_distance ?? 0), 0)
  const distanceActual = distanceSessions.reduce((sum, session) => sum + (session.actual_distance ?? 0), 0)
  const durationPlanned = durationSessions.reduce((sum, session) => sum + (session.planned_duration ?? 0), 0)
  const durationActual = durationSessions.reduce((sum, session) => sum + (session.actual_duration ?? 0), 0)

  const actualSourceCounts = sessionsWithActuals28.reduce<Record<SessionActualDataSource, number>>((acc, session) => {
    const source = session.actual_data_source
    if (!source) return acc
    acc[source] = (acc[source] ?? 0) + 1
    return acc
  }, { athlete: 0, coach: 0, strava: 0, imported: 0 })

  const typeStats = nonRestSessions
    .filter((session) => isWithinRange(session.date, last56Start, today) && shouldCountSessionInCompliance(session, today))
    .reduce<Map<SessionType, AthleteInsightTypeStat>>((acc, session) => {
      const feedback = getFeedbackForSession(normalizedFeedbacks, session)
      const existing = acc.get(session.type) ?? {
        type: session.type,
        label: sessionTypeLabel(session.type),
        sessions: 0,
        completed: 0,
        skipped: 0,
        detected: 0,
        unresolved: 0,
        completionRate: null,
        avgRpe: null,
        painCount: 0,
      }
      const status = getSessionExecutionStatus(session)
      existing.sessions += 1
      if (status === 'completed') existing.completed += 1
      if (status === 'skipped') existing.skipped += 1
      if (status === 'detected') existing.detected += 1
      if (isSessionPastUnresolved(session, today)) existing.unresolved += 1
      if (feedback?.painFlag) existing.painCount += 1
      const rpeValues = feedback?.rpe != null ? [feedback.rpe] : []
      existing.avgRpe = average([
        ...(existing.avgRpe != null ? Array(Math.max(existing.sessions - 1, 0)).fill(existing.avgRpe) : []),
        ...rpeValues,
      ])
      acc.set(session.type, existing)
      return acc
    }, new Map())

  const typeStatsList = [...typeStats.values()]
    .map((stat) => ({
      ...stat,
      completionRate: percentage(stat.completed, stat.sessions),
      avgRpe: average(
        nonRestSessions
          .filter((session) => session.type === stat.type && isWithinRange(session.date, last56Start, today))
          .map((session) => getFeedbackForSession(normalizedFeedbacks, session)?.rpe)
          .filter((value): value is number => value != null),
      ),
    }))
    .sort((a, b) => b.sessions - a.sessions)

  const painCount14 = feedback14.filter((feedback) => feedback.painFlag).length
  const skipped14 = nonRestSessions.filter((session) =>
    isWithinRange(session.date, last14Start, today) && getSessionExecutionStatus(session) === 'skipped'
  ).length
  const unresolved14 = nonRestSessions.filter((session) =>
    isWithinRange(session.date, last14Start, today) && isSessionPastUnresolved(session, today)
  ).length
  const detectedOpen14 = nonRestSessions.filter((session) =>
    isWithinRange(session.date, last14Start, today) && getSessionExecutionStatus(session) === 'detected'
  ).length

  const flags: AthleteInsightFlag[] = []
  const completionRate = percentage(completedSessions28.length, dueSessions28.length)

  if (dueSessions28.length >= 4 && completionRate !== null && completionRate < 60) {
    flags.push({
      tone: 'red',
      title: 'Niska realizacja planu',
      detail: `${completedSessions28.length} z ${dueSessions28.length} sesji zostało potwierdzonych jako wykonane w ostatnich 28 dniach.`,
    })
  }
  if (skipped14 >= 2) {
    flags.push({
      tone: 'red',
      title: 'Powtarzające się pominięcia',
      detail: `${skipped14} sesje zostały pominięte w ostatnich 14 dniach.`,
    })
  }
  if (painCount14 >= 2) {
    flags.push({
      tone: 'orange',
      title: 'Powtarzający się ból / problem',
      detail: `${painCount14} feedbacki w ostatnich 14 dniach zawierały sygnał bólu lub problemu.`,
    })
  }
  if (rpeDelta != null && recentAvgRpe != null && recentAvgRpe >= 7 && rpeDelta >= 1) {
    flags.push({
      tone: 'orange',
      title: 'Rośnie odczuwana trudność',
      detail: `Średnie RPE wzrosło z ${previousAvgRpe?.toFixed(1)} do ${recentAvgRpe.toFixed(1)} w porównaniu do poprzednich 14 dni.`,
    })
  }
  if (unresolved14 >= 2) {
    flags.push({
      tone: 'yellow',
      title: 'Brakuje potwierdzeń treningów',
      detail: `${unresolved14} przeszłe sesje nadal nie mają potwierdzenia wykonania.`,
    })
  }
  if (detectedOpen14 >= 2) {
    flags.push({
      tone: 'yellow',
      title: 'Strava wykryła aktywności do sprawdzenia',
      detail: `${detectedOpen14} sesje są wykryte z urządzenia, ale nadal czekają na pełne potwierdzenie.`,
    })
  }
  if (flags.length === 0) {
    flags.push({
      tone: 'green',
      title: 'Brak pilnych sygnałów',
      detail: 'W ostatnich tygodniach nie widać powtarzalnych ostrzeżeń w realizacji ani w reakcji zawodnika.',
    })
  }

  const recentSessions = nonRestSessions
    .filter((session) => session.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map((session) => {
      const feedback = getFeedbackForSession(normalizedFeedbacks, session)
      return {
        id: session.id,
        date: session.date,
        title: session.title,
        type: session.type,
        status: getSessionExecutionStatus(session),
        completionSource: session.completion_source ?? null,
        actualDataSource: session.actual_data_source ?? null,
        rpe: feedback?.rpe ?? null,
        feeling: feedback?.feeling ?? null,
        painFlag: feedback?.painFlag ?? false,
      }
    })

  return {
    window: {
      last28Start,
      last14Start,
      last56Start,
      previous14Start,
      previous14End,
    },
    overview: {
      dueSessions: dueSessions28.length,
      completedSessions: completedSessions28.length,
      skippedSessions: skippedSessions28.length,
      detectedSessions: detectedSessions28.length,
      unresolvedSessions: unresolvedSessions28.length,
      completionRate,
      actualCoverage: percentage(sessionsWithActuals28.length, dueSessions28.length),
      feedbackCoverage: percentage(feedbackSessionKeys28.size, dueSessions28.length),
    },
    planVsActual: {
      distance: distanceSessions.length > 0 ? {
        planned: Number(distancePlanned.toFixed(1)),
        actual: Number(distanceActual.toFixed(1)),
        coverage: distanceSessions.length,
        deltaPercent: percentageDelta(distanceActual, distancePlanned),
      } : null,
      duration: durationSessions.length > 0 ? {
        planned: Math.round(durationPlanned),
        actual: Math.round(durationActual),
        coverage: durationSessions.length,
        deltaPercent: percentageDelta(durationActual, durationPlanned),
      } : null,
    },
    reaction: {
      avgRpe,
      previousAvgRpe,
      rpeDelta,
      dominantFeeling,
      dominantFeelingLabel: dominantFeeling ? FEELING_LABELS[dominantFeeling] ?? dominantFeeling : null,
      painCount: feedback28.filter((feedback) => feedback.painFlag).length,
      feedbackCount: feedback28.length,
    },
    actualSources: (Object.entries(actualSourceCounts) as Array<[SessionActualDataSource, number]>)
      .filter(([, count]) => count > 0)
      .map(([source, count]) => ({
        source,
        label: ACTUAL_SOURCE_LABELS[source],
        count,
      }))
      .sort((a, b) => b.count - a.count),
    typeStats: typeStatsList,
    flags,
    recentSessions,
  }
}
