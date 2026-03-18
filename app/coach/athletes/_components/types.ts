'use client'

import type { StatusDef } from '@/lib/useCustomStatuses'

export type ColumnKey =
  | 'signal'
  | 'compliance'
  | 'weekly_load'
  | 'next_race'
  | 'package'
  | 'next_session'
  | 'last_session'
  | 'join_date'
  | 'phone'
  | 'age'
  | 'city'

export type SortKey =
  | 'name'
  | 'package'
  | 'status'
  | 'join_date'
  | 'last_session'
  | 'next_session'
  | 'next_race'
  | 'signal'
  | 'weekly_load'
  | 'compliance'
  | null

export interface Athlete {
  id: string
  athlete_order: number
  name: string
  avatar: string
  goal: string
  package: string
  package_price: number
  status: string
  email: string | null
  phone: string | null
  slug: string
  join_date: string
  created_at: string
  age: number | null
  city: string | null
}

export interface Package {
  id: string
  name: string
  price: number
}

export interface AthletesClientProps {
  coachId: string
  athletes: Athlete[]
  lastSessionMap: Record<string, { date: string; type: string; title: string }>
  weeklyLoadMap: Record<string, number>
  weeklySessionCountMap: Record<string, number>
  nextRaceMap: Record<string, { name: string; date: string; distance: string | null }>
  packages: Package[]
  signalMap: Record<string, string>
  lastFeedbackDateMap: Record<string, string>
  nextSessionMap: Record<string, { date: string; type: string; title: string }>
  unreadMessagesMap: Record<string, number>
  unreadFeedbackMap: Record<string, number>
  complianceMap: Record<string, { completed: number; total: number }>
  unpaidInvoiceSet: Record<string, boolean>
  initialStatuses: StatusDef[]
}

export const COLUMN_DEFS: { key: ColumnKey; label: string; desc: string }[] = [
  { key: 'last_session', label: 'Ostatni trening', desc: 'Ostatni ukończony trening' },
  { key: 'next_session', label: 'Następna sesja', desc: 'Najbliższy zaplanowany trening' },
  { key: 'signal', label: 'Forma', desc: 'Ostatni sygnał z feedbacku + kiedy' },
  { key: 'compliance', label: 'Realizacja 30 dni', desc: '% ukończonych sesji z ost. 30 dni' },
  { key: 'weekly_load', label: 'Obciążenie 7 dni', desc: 'Suma km i liczba sesji z ost. 7 dni' },
  { key: 'next_race', label: 'Następne zawody', desc: 'Najbliższy zaplanowany start zawodnika' },
  { key: 'package', label: 'Pakiet', desc: 'Pakiet, cena i status płatności' },
  { key: 'join_date', label: 'Data dołączenia', desc: 'Kiedy zawodnik dołączył + staż' },
  { key: 'phone', label: 'Telefon', desc: 'Numer telefonu (klikalny)' },
  { key: 'age', label: 'Wiek', desc: 'Wiek zawodnika' },
  { key: 'city', label: 'Miasto', desc: 'Miasto zawodnika' },
]

export const DEFAULT_COLUMNS: ColumnKey[] = ['last_session', 'next_session', 'compliance', 'weekly_load', 'next_race']
export const COLUMNS_STORAGE_KEY = 'coach_table_columns_v2'
export const SIGNAL_COLORS: Record<string, string> = { green: '#2ECC71', yellow: '#F1C40F', red: '#E74C3C' }
export const SIGNAL_LABELS: Record<string, string> = { green: 'Dobra', yellow: 'Średnia', red: 'Słaba' }
