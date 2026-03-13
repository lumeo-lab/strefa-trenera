export type SessionType = 'easy' | 'interval' | 'tempo' | 'long' | 'rest' | 'gym' | 'bike'
export type FeedbackSource = 'voice' | 'text' | 'auto'
export type FeedbackSignal = 'green' | 'yellow' | 'red'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type CrmStatus = 'inquiry' | 'conversation' | 'offer' | 'onboarding' | 'active' | 'ended'
export type AthleteStatus = 'ok' | 'warning' | 'alert' | 'inactive'

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

export interface CrmCard {
  id: string
  name: string
  email: string
  phone?: string
  source: string
  status: CrmStatus
  notes: string
  createdAt: string
  interest: string
  value?: number
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
