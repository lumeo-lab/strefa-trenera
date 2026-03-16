// Derived row types for dashboard queries (partial selects + joins)

/** athletes select: id, name, avatar, status, package, package_price, created_at */
export type DashboardAthleteRow = {
  id: string
  name: string
  avatar: string
  status: string
  package: string
  package_price: number
  created_at: string
}

/** feedbacks select: id, athlete_id, created_at, transcript, signal, athletes(name, avatar) */
export type DashboardFeedbackRow = {
  id: string
  athlete_id: string
  created_at: string
  transcript: string
  signal: string
  athletes: { name: string; avatar: string } | null
}

/** messages select: id, athlete_id, content, created_at, athletes(name, avatar) */
export type DashboardMessageRow = {
  id: string
  athlete_id: string
  content: string
  created_at: string
  athletes: { name: string; avatar: string } | null
}

/** training_sessions (today) select: id, type, title, planned_distance, completed, athlete_id, athletes(name, avatar) */
export type DashboardSessionRow = {
  id: string
  type: string
  title: string
  planned_distance: number | null
  completed: boolean
  athlete_id: string
  athletes: { name: string; avatar: string } | null
}

/** training_sessions (week) select: athlete_id, completed, actual_distance */
export type DashboardWeekSessionRow = {
  athlete_id: string
  completed: boolean
  actual_distance: number | null
}

/** athlete_races select: id, name, date, distance, athlete_id, athletes(name, avatar) */
export type DashboardRaceRow = {
  id: string
  name: string
  date: string
  distance: string | null
  athlete_id: string
  athletes: { name: string; avatar: string } | null
}

/** invoices (recent) select: id, number, amount, status, date, athlete_id, athletes(name, avatar) */
export type DashboardInvoiceRow = {
  id: string
  number: string
  amount: number
  status: string
  date: string
  athlete_id: string
  athletes: { name: string; avatar: string } | null
}
