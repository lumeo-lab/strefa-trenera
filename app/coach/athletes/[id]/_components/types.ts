import type { Database } from '@/lib/supabase/database.types'
import type { SessionType } from '@/lib/types'

type PublicTableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export type CoachAthleteRow = PublicTableRow<'athletes'>
export type CoachTrainingSessionRow = Omit<PublicTableRow<'training_sessions'>, 'type'> & {
  type: SessionType
  url: string | null
  url_label: string | null
}
export type CoachFeedbackRow = PublicTableRow<'feedbacks'>
export type CoachInvoiceRow = PublicTableRow<'invoices'>
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
