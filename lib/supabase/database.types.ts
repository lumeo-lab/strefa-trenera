// Generated from Supabase schema (supabase/migrations/*.sql)
// Update this file when schema changes

export type Database = {
  public: {
    Tables: {
      coaches: {
        Row: {
          id: string
          name: string
          plan: string
          avatar: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string
          plan?: string
          avatar?: string | null
        }
        Update: Partial<Database['public']['Tables']['coaches']['Insert']>
      }
      coach_session_types: {
        Row: {
          id: string
          coach_id: string
          key: string
          label: string
          color: string | null
          is_builtin: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          key: string
          label: string
          color?: string | null
          is_builtin?: boolean
          position?: number
        }
        Update: Partial<Database['public']['Tables']['coach_session_types']['Insert']>
      }
      coach_week_templates: {
        Row: {
          id: string
          coach_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['coach_week_templates']['Insert']>
      }
      coach_week_template_items: {
        Row: {
          id: string
          template_id: string
          day_offset: number
          position: number
          type: string
          title: string
          description: string
          planned_distance: number | null
          planned_duration: number | null
          planned_pace: string | null
          url: string | null
          url_label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          day_offset: number
          position?: number
          type?: string
          title: string
          description?: string
          planned_distance?: number | null
          planned_duration?: number | null
          planned_pace?: string | null
          url?: string | null
          url_label?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['coach_week_template_items']['Insert']>
      }
      athletes: {
        Row: {
          id: string
          coach_id: string
          name: string
          avatar: string
          slug: string
          invite_token: string
          invite_token_expires_at: string | null
          invite_token_used_at: string | null
          email: string | null
          phone: string | null
          goal: string
          package: string
          package_price: number
          status: string
          age: number | null
          city: string | null
          height: number | null
          weight: number | null
          join_date: string
          personal_bests: Record<string, string>
          injuries: string[]
          coach_notes: string
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          avatar?: string
          slug: string
          invite_token?: string
          invite_token_expires_at?: string | null
          invite_token_used_at?: string | null
          email?: string | null
          phone?: string | null
          goal?: string
          package?: string
          package_price?: number
          status?: string
          age?: number | null
          city?: string | null
          height?: number | null
          weight?: number | null
          join_date?: string
          personal_bests?: Record<string, string>
          injuries?: string[]
          coach_notes?: string
        }
        Update: Partial<Database['public']['Tables']['athletes']['Insert']>
      }
      training_sessions: {
        Row: {
          id: string
          athlete_id: string
          coach_id: string
          date: string
          type: string
          title: string
          description: string
          planned_distance: number | null
          planned_duration: number | null
          planned_pace: string | null
          actual_distance: number | null
          actual_duration: number | null
          actual_pace: string | null
          avg_hr: number | null
          max_hr: number | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          coach_id: string
          date: string
          type?: string
          title: string
          description?: string
          planned_distance?: number | null
          planned_duration?: number | null
          planned_pace?: string | null
          actual_distance?: number | null
          actual_duration?: number | null
          actual_pace?: string | null
          avg_hr?: number | null
          max_hr?: number | null
          completed?: boolean
        }
        Update: Partial<Database['public']['Tables']['training_sessions']['Insert']>
      }
      feedbacks: {
        Row: {
          id: string
          athlete_id: string
          session_id: string | null
          coach_id: string
          date: string
          source: string
          signal: string
          transcript: string
          ai_summary: string
          ai_analysis: string
          watch_data: Record<string, unknown> | null
          watch_link: string | null
          coach_reply: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          session_id?: string | null
          coach_id: string
          date?: string
          source?: string
          signal?: string
          transcript?: string
          ai_summary?: string
          ai_analysis?: string
          watch_data?: Record<string, unknown> | null
          watch_link?: string | null
          coach_reply?: string | null
          read?: boolean
        }
        Update: Partial<Database['public']['Tables']['feedbacks']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          athlete_id: string
          coach_id: string
          number: string
          date: string
          due_date: string
          amount: number
          status: string
          package: string | null
          description: string | null
          attachment_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          coach_id: string
          number: string
          date: string
          due_date: string
          amount: number
          status?: string
          package?: string | null
          description?: string | null
          attachment_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      athlete_races: {
        Row: {
          id: string
          athlete_id: string
          coach_id: string
          name: string
          date: string
          distance: string | null
          goal_time: string | null
          result: string | null
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          coach_id: string
          name: string
          date: string
          distance?: string | null
          goal_time?: string | null
          result?: string | null
          status?: string
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['athlete_races']['Insert']>
      }
      messages: {
        Row: {
          id: string
          coach_id: string
          athlete_id: string
          sender_type: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          athlete_id: string
          sender_type: string
          content: string
          read?: boolean
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      athlete_sessions: {
        Row: {
          id: string
          athlete_id: string
          token: string
          expires_at: string
          revoked_at: string | null
          last_seen_at: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          token?: string
          expires_at?: string
          revoked_at?: string | null
          last_seen_at?: string
          user_agent?: string | null
        }
        Update: Partial<Database['public']['Tables']['athlete_sessions']['Insert']>
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          user_type: string
          endpoint: string
          subscription: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_type: string
          endpoint: string
          subscription: Record<string, unknown>
        }
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>
      }
      strava_oauth_states: {
        Row: {
          id: string
          athlete_id: string
          slug: string
          nonce: string
          expires_at: string
          consumed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          slug: string
          nonce: string
          expires_at?: string
          consumed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['strava_oauth_states']['Insert']>
      }
      strava_connections: {
        Row: {
          id: string
          athlete_id: string
          strava_athlete_id: number
          access_token: string | null
          refresh_token: string | null
          expires_at: string | null
          connected_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          strava_athlete_id: number
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['strava_connections']['Insert']>
      }
      strava_activities: {
        Row: {
          id: string
          athlete_id: string
          strava_id: number
          name: string | null
          distance: number | null
          moving_time: number | null
          start_date: string | null
          type: string | null
          average_speed: number | null
          average_heartrate: number | null
          max_heartrate: number | null
          total_elevation_gain: number | null
          synced_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          strava_id: number
          name?: string | null
          distance?: number | null
          moving_time?: number | null
          start_date?: string | null
          type?: string | null
          average_speed?: number | null
          average_heartrate?: number | null
          max_heartrate?: number | null
          total_elevation_gain?: number | null
        }
        Update: Partial<Database['public']['Tables']['strava_activities']['Insert']>
      }
    }
  }
}

// Convenience row type aliases
export type CoachRow = Database['public']['Tables']['coaches']['Row']
export type AthleteRow = Database['public']['Tables']['athletes']['Row']
export type SessionRow = Database['public']['Tables']['training_sessions']['Row']
export type FeedbackRow = Database['public']['Tables']['feedbacks']['Row']
export type InvoiceRow = Database['public']['Tables']['invoices']['Row']
export type RaceRow = Database['public']['Tables']['athlete_races']['Row']
export type MessageRow = Database['public']['Tables']['messages']['Row']
