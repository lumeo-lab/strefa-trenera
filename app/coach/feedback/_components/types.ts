import type { FeedbackRow } from '@/lib/supabase/database.types'
import type { PriorityResult } from '@/lib/feedback-priority'
import type { StravaData } from '@/lib/feedback-helpers'

export type FeedbackWithJoins = FeedbackRow & {
  athletes: { id: string; name: string; avatar: string | null } | null
  training_sessions: {
    id: string
    title: string
    linked_strava_activity_id: number | null
    actual_distance: number | null
    actual_duration: number | null
    actual_pace: string | null
    avg_hr: number | null
    max_hr: number | null
  } | null
  strava_data: StravaData | null
}

export type FeedbackWithPriority = FeedbackWithJoins & { priority: PriorityResult }

export type Filter = 'all' | 'today' | 'unread' | 'needs_action' | 'needs_reply'
export type ViewMode = 'priority' | 'chronological'
