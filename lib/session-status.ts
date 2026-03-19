import type { SessionCompletionSource, SessionComplianceState, SessionExecutionStatus } from '@/lib/types'

type SessionStatusLike = {
  date: string
  status?: SessionExecutionStatus | null
  completed?: boolean | null
}

type SessionWithMeta = SessionStatusLike & {
  completion_source?: SessionCompletionSource | null
}

export function getSessionExecutionStatus(session: SessionStatusLike): SessionExecutionStatus {
  if (session.status === 'planned' || session.status === 'completed' || session.status === 'skipped' || session.status === 'detected') {
    return session.status
  }
  return session.completed ? 'completed' : 'planned'
}

export function isSessionCompleted(session: SessionStatusLike) {
  return getSessionExecutionStatus(session) === 'completed'
}

export function isSessionSkipped(session: SessionStatusLike) {
  return getSessionExecutionStatus(session) === 'skipped'
}

export function isSessionDetected(session: SessionStatusLike) {
  return getSessionExecutionStatus(session) === 'detected'
}

export function isSessionPlanned(session: SessionStatusLike) {
  return getSessionExecutionStatus(session) === 'planned'
}

export function isSessionPastUnresolved(session: SessionStatusLike, today: string) {
  return isSessionPlanned(session) && session.date < today
}

export function getSessionExecutionLabel(session: SessionStatusLike) {
  const status = getSessionExecutionStatus(session)
  switch (status) {
    case 'completed':
      return 'Wykonany'
    case 'skipped':
      return 'Pominięty'
    case 'detected':
      return 'Wykryty'
    default:
      return 'Zaplanowany'
  }
}

export function getSessionExecutionTone(session: SessionStatusLike): 'success' | 'warning' | 'muted' | 'info' {
  const status = getSessionExecutionStatus(session)
  switch (status) {
    case 'completed':
      return 'success'
    case 'skipped':
      return 'warning'
    case 'detected':
      return 'info'
    default:
      return 'muted'
  }
}

export function getSessionComplianceState(session: SessionStatusLike, today: string): SessionComplianceState {
  const status = getSessionExecutionStatus(session)
  if (status === 'completed') return 'completed'
  if (status === 'skipped') return 'skipped'
  if (status === 'detected') return 'detected'
  if (session.date < today) return 'past_unresolved'
  return 'upcoming'
}

export function shouldCountSessionInCompliance(session: SessionStatusLike, today: string) {
  const compliance = getSessionComplianceState(session, today)
  return compliance === 'completed' || compliance === 'skipped' || compliance === 'detected' || compliance === 'past_unresolved'
}

export function getSessionCompletionSource(session: SessionWithMeta): SessionCompletionSource | null {
  return session.completion_source ?? null
}

export function getLegacyCompletedFromStatus(status: SessionExecutionStatus) {
  return status === 'completed'
}

export function getStatusUpdateForExecution(status: SessionExecutionStatus, source: SessionCompletionSource | null, completedAt?: string | null) {
  return {
    status,
    completion_source: source,
    completed_at: status === 'completed' ? (completedAt ?? new Date().toISOString()) : null,
    completed: getLegacyCompletedFromStatus(status),
  }
}
