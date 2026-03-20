import type { Database } from '@/lib/supabase/database.types'
import type {
  HrZoneMethod,
  SessionActualDataSource,
  SessionCompletionSource,
  SessionExecutionStatus,
  SessionGoal,
  SessionPriority,
  SessionType,
  TrainingLoadSource,
} from '@/lib/types'

type PublicTableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export type CoachAthleteRow = Omit<PublicTableRow<'athletes'>, 'hr_zone_method'> & {
  hr_zone_method: HrZoneMethod
}
export type CoachTrainingSessionRow = Omit<PublicTableRow<'training_sessions'>, 'type' | 'status' | 'completion_source' | 'actual_data_source' | 'session_priority' | 'session_goal' | 'training_load_source'> & {
  type: SessionType
  status: SessionExecutionStatus
  completion_source: SessionCompletionSource | null
  actual_data_source: SessionActualDataSource | null
  session_priority: SessionPriority
  session_goal: SessionGoal | null
  training_load_source: TrainingLoadSource | null
  url: string | null
  url_label: string | null
}
export type CoachFeedbackRow = PublicTableRow<'feedbacks'>
export type CoachInvoiceRow = PublicTableRow<'invoices'>
export type CoachStravaActivityRow = PublicTableRow<'strava_activities'>
export type CoachRaceRow = Omit<PublicTableRow<'athlete_races'>, 'status'> & {
  status: 'planned' | 'completed' | 'dns' | 'dnf' | null
}
export interface CoachPackageRow {
  id: string
  name: string
  description: string | null
  price: number
}

export type FeedbackByDateMap = Record<string, CoachFeedbackRow>
export type FeedbackBySessionMap = Record<string, CoachFeedbackRow>
