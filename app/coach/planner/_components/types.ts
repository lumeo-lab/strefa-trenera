import type { Database } from '@/lib/supabase/database.types'
import type { SessionType } from '@/lib/types'

type PublicTableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export type PlannerAthleteRow = Pick<PublicTableRow<'athletes'>, 'id' | 'name' | 'avatar' | 'status'>
export type PlannerSessionRow = Omit<
  Pick<
    PublicTableRow<'training_sessions'>,
    'id' | 'athlete_id' | 'date' | 'type' | 'title' | 'description' | 'planned_distance' | 'planned_duration' | 'planned_pace' | 'completed'
  >,
  'type'
> & {
  type: SessionType
}
