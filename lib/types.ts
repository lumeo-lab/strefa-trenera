export type SessionType = 'easy' | 'interval' | 'tempo' | 'long' | 'rest' | 'gym' | 'bike'
export type FeedbackSource = 'voice' | 'text' | 'both' | 'auto'
export type FeedbackSignal = 'green' | 'yellow' | 'red'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type AthleteStatus = 'ok' | 'warning' | 'alert' | 'inactive'
export type SessionExecutionStatus = 'planned' | 'completed' | 'skipped' | 'detected'
export type SessionCompletionSource = 'athlete' | 'coach' | 'strava' | 'imported'
export type SessionActualDataSource = 'athlete' | 'coach' | 'strava' | 'imported'
export type SessionComplianceState = 'completed' | 'skipped' | 'detected' | 'past_unresolved' | 'upcoming'
export type SessionPriority = 'key' | 'normal' | 'optional'
export type SessionGoal = 'recovery' | 'z2_volume' | 'threshold' | 'vo2' | 'speed' | 'long_run' | 'strength' | 'race_specific'
export type TrainingLoadSource = 'strava_hr' | 'estimated_rpe' | 'coach_manual' | 'imported'
export type HrZoneMethod = 'custom' | 'threshold_hr'

export interface Athlete {
  id: string
  name: string
  avatar: string
  goal: string
  package: string
  packagePrice: number
  status: AthleteStatus
  lastTraining: string // ISO date
  lastContact: number // days ago
  joinDate: string // ISO date
  email: string
  phone: string
  age: number
  city: string
  personalBests: Record<string, string>
  injuries: string[]
  coachNotes: string
  totalPaid: number
  alertMessage?: string
}

export interface Session {
  id: string
  athleteId: string
  date: string // ISO date
  type: SessionType
  title: string
  description: string
  plannedDistance?: number // km
  plannedDuration?: number // min
  plannedPace?: string // min/km
  actualDistance?: number
  actualDuration?: number
  actualPace?: string
  avgHR?: number
  maxHR?: number
  completed: boolean
  status?: SessionExecutionStatus
  completionSource?: SessionCompletionSource | null
  actualDataSource?: SessionActualDataSource | null
  completedAt?: string | null
  linkedStravaActivityId?: number | null
  skippedReason?: string | null
  sessionPriority?: SessionPriority
  sessionGoal?: SessionGoal | null
  trainingLoad?: number | null
  trainingLoadSource?: TrainingLoadSource | null
  timeInHrZ1?: number | null
  timeInHrZ2?: number | null
  timeInHrZ3?: number | null
  timeInHrZ4?: number | null
  timeInHrZ5?: number | null
  feedbackId?: string
}

export interface WatchData {
  avgHR?: number
  maxHR?: number
  hrv?: number
  distance?: number
  pace?: string
  cadence?: number
  elevation?: number
  calories?: number
}

export interface Feedback {
  id: string
  athleteId: string
  sessionId: string
  date: string // ISO date
  source: FeedbackSource
  signal: FeedbackSignal
  transcript: string
  aiAnalysis: string
  aiSummary: string
  watchData?: WatchData
  coachReply?: string
  read: boolean
}

export interface Invoice {
  id: string
  athleteId: string
  number: string
  date: string
  dueDate: string
  amount: number
  status: InvoiceStatus
  package: string
  description: string
}

export interface Message {
  id: string
  senderId: string // athleteId or 'coach'
  content: string
  timestamp: string
  read: boolean
}

export interface Revenue {
  month: string
  amount: number
}
