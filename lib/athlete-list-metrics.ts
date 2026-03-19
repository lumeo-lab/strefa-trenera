import { getSessionComplianceState, isSessionOpenForExecution } from '@/lib/session-status'

/** Build athlete metric maps from raw Supabase data (fallback when RPC unavailable) */

export interface AthleteMetricMaps {
  lastSessionMap: Record<string, { date: string; type: string; title: string }>
  weeklyLoadMap: Record<string, number>
  weeklySessionCountMap: Record<string, number>
  nextRaceMap: Record<string, { name: string; date: string; distance: string | null }>
  signalMap: Record<string, string>
  lastFeedbackDateMap: Record<string, string>
  unreadFeedbackMap: Record<string, number>
  nextSessionMap: Record<string, { date: string; type: string; title: string }>
  unreadMessagesMap: Record<string, number>
  complianceMap: Record<string, { completed: number; total: number }>
  unpaidInvoiceSet: Record<string, boolean>
}

export function buildMetricMapsFromFallback({
  lastSessions,
  recentSessions,
  allFeedbacks,
  upcomingSessions,
  unreadMsgs,
  monthSessions,
  unpaidInvoices,
  upcomingRaces,
  today = '',
}: {
  lastSessions: Array<{ athlete_id: string; date: string; type: string; title: string }> | null
  recentSessions: Array<{ athlete_id: string; planned_distance: number | null; actual_distance: number | null }> | null
  allFeedbacks: Array<{ athlete_id: string; signal: string; created_at: string; read: boolean }> | null
  upcomingSessions: Array<{ athlete_id: string; date: string; type: string; title: string; completed?: boolean; status?: 'planned' | 'completed' | 'skipped' | 'detected' | null }> | null
  unreadMsgs: Array<{ athlete_id: string }> | null
  monthSessions: Array<{ athlete_id: string; date?: string; completed: boolean; status?: 'planned' | 'completed' | 'skipped' | 'detected' | null }> | null
  unpaidInvoices: Array<{ athlete_id: string }> | null
  upcomingRaces: Array<{ athlete_id: string; name: string; date: string; distance: string | null }> | null
  today?: string
}): AthleteMetricMaps {
  const lastSessionMap: AthleteMetricMaps['lastSessionMap'] = {}
  const weeklyLoadMap: AthleteMetricMaps['weeklyLoadMap'] = {}
  const weeklySessionCountMap: AthleteMetricMaps['weeklySessionCountMap'] = {}
  const nextRaceMap: AthleteMetricMaps['nextRaceMap'] = {}
  const signalMap: AthleteMetricMaps['signalMap'] = {}
  const lastFeedbackDateMap: AthleteMetricMaps['lastFeedbackDateMap'] = {}
  const unreadFeedbackMap: AthleteMetricMaps['unreadFeedbackMap'] = {}
  const nextSessionMap: AthleteMetricMaps['nextSessionMap'] = {}
  const unreadMessagesMap: AthleteMetricMaps['unreadMessagesMap'] = {}
  const complianceMap: AthleteMetricMaps['complianceMap'] = {}
  const unpaidInvoiceSet: AthleteMetricMaps['unpaidInvoiceSet'] = {}

  for (const session of lastSessions ?? []) {
    if (!lastSessionMap[session.athlete_id]) lastSessionMap[session.athlete_id] = { date: session.date, type: session.type, title: session.title }
  }
  for (const session of recentSessions ?? []) {
    const km = session.actual_distance ?? session.planned_distance ?? 0
    weeklyLoadMap[session.athlete_id] = (weeklyLoadMap[session.athlete_id] ?? 0) + km
    weeklySessionCountMap[session.athlete_id] = (weeklySessionCountMap[session.athlete_id] ?? 0) + 1
  }
  for (const feedback of allFeedbacks ?? []) {
    if (!signalMap[feedback.athlete_id]) {
      signalMap[feedback.athlete_id] = feedback.signal
      lastFeedbackDateMap[feedback.athlete_id] = feedback.created_at
    }
    if (!feedback.read) unreadFeedbackMap[feedback.athlete_id] = (unreadFeedbackMap[feedback.athlete_id] ?? 0) + 1
  }
  for (const session of upcomingSessions ?? []) {
    if (isSessionOpenForExecution({ date: session.date, completed: false, status: 'status' in session ? session.status ?? undefined : undefined }) && !nextSessionMap[session.athlete_id]) {
      nextSessionMap[session.athlete_id] = { date: session.date, type: session.type, title: session.title }
    }
  }
  for (const message of unreadMsgs ?? []) {
    unreadMessagesMap[message.athlete_id] = (unreadMessagesMap[message.athlete_id] ?? 0) + 1
  }
  for (const session of monthSessions ?? []) {
    if (!complianceMap[session.athlete_id]) complianceMap[session.athlete_id] = { completed: 0, total: 0 }
    const complianceState = session.date && today
      ? getSessionComplianceState({ date: session.date, completed: session.completed, status: session.status ?? undefined }, today)
      : (session.completed ? 'completed' : 'past_unresolved')
    if (complianceState === 'upcoming') continue
    complianceMap[session.athlete_id].total++
    if (complianceState === 'completed') complianceMap[session.athlete_id].completed++
  }
  for (const invoice of unpaidInvoices ?? []) {
    unpaidInvoiceSet[invoice.athlete_id] = true
  }
  for (const race of upcomingRaces ?? []) {
    if (!nextRaceMap[race.athlete_id]) {
      nextRaceMap[race.athlete_id] = { name: race.name, date: race.date, distance: race.distance }
    }
  }

  return { lastSessionMap, weeklyLoadMap, weeklySessionCountMap, nextRaceMap, signalMap, lastFeedbackDateMap, unreadFeedbackMap, nextSessionMap, unreadMessagesMap, complianceMap, unpaidInvoiceSet }
}
