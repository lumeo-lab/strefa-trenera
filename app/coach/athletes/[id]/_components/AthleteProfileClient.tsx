'use client'

import React, { useState, useRef, useEffect, startTransition, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  formatDate, formatCurrency, intensityColor, sessionTypeLabel,
  signalColor, getWeekDays, toISODate, dayName, isToday, isPast,
} from '@/lib/utils'
import { SessionType, InvoiceStatus } from '@/lib/types'
import { createSession, updateSession, deleteSession as deleteSessionAction } from '@/lib/actions/sessions'
import { updateAthlete } from '@/lib/actions/athletes'
import { createRace, updateRace, deleteRace } from '@/lib/actions/races'
import { createInvoice, updateInvoiceStatus } from '@/lib/actions/invoices'
import { InvoiceStatusDropdown } from '@/components/ui/InvoiceStatusDropdown'
import { markFeedbackRead, replyFeedback } from '@/lib/actions/feedback'
import Link from 'next/link'
import { useCustomSessionTypes, BUILTIN_SESSION_TYPE_KEYS, SessionTypeDef } from '@/lib/useCustomSessionTypes'

const PRESET_TYPE_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#EF4444', '#F59E0B', '#06B6D4']
const DEFAULT_PB_DISTANCES = ['5 km', '10 km', 'Półmaraton', 'Maraton']

// ── Race status helpers ────────────────────────────────────────────────────

type RaceStatus = 'planned' | 'completed' | 'dns' | 'dnf'

const RACE_STATUS_INFO: Record<RaceStatus, { label: string; color: string }> = {
  planned:   { label: 'Planowany', color: 'var(--text-muted)' },
  completed: { label: 'Ukończony', color: '#2ECC71' },
  dns:       { label: 'DNS',       color: '#E74C3C' },
  dnf:       { label: 'DNF',       color: '#F39C12' },
}

// ── Race note cell ─────────────────────────────────────────────────────────

function RaceNoteCell({ notes, isOpen, onToggle }: { notes?: string | null; isOpen: boolean; onToggle: () => void }) {
  return (
    <td className="px-4 py-3 text-xs">
      {notes ? (
        <div>
          <button onClick={onToggle} className="cursor-pointer text-base leading-none"
            title={isOpen ? 'Ukryj notatkę' : 'Pokaż notatkę'}>📝</button>
          {isOpen && (
            <div className="mt-1.5 text-xs leading-relaxed max-w-[220px]"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '8px', padding: '6px 8px' }}>
              {notes}
            </div>
          )}
        </div>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>—</span>
      )}
    </td>
  )
}

// ── Feedback display helpers ───────────────────────────────────────────────

const FEELING_LABELS: Record<string, string> = {
  '😫': 'Fatalnie', '😕': 'Słabo', '😐': 'Średnio', '😊': 'Dobrze', '🤩': 'Świetnie',
}

function parseFeedback(fb: DbRow) {
  const textSummary = fb.source !== 'voice' ? (fb.transcript ?? '') : ''
  const voice = fb.ai_analysis || (fb.source === 'voice' ? fb.transcript : '') || ''
  let feeling = '', trainingType = '', distanceKm = '', durationMin = '', intensity = '', notes = ''
  for (const part of textSummary.split(' | ')) {
    if (part.startsWith('Samopoczucie: ')) feeling = part.slice(14)
    else if (part.startsWith('Typ: ')) trainingType = part.slice(5)
    else if (part.startsWith('Dystans: ')) distanceKm = part.slice(9).replace(' km', '')
    else if (part.startsWith('Czas: ')) durationMin = part.slice(6).replace(' min', '')
    else if (part.startsWith('Intensywność: ')) intensity = part.slice(14)
    else if (part.startsWith('Notatka: ')) notes = part.slice(9)
  }
  return { feeling, trainingType, distanceKm, durationMin, intensity, notes, voice }
}

function FeedbackDetail({ fb }: { fb: DbRow }) {
  const d = parseFeedback(fb)
  const hasText = !!(d.feeling || d.trainingType || d.distanceKm || d.durationMin || d.intensity || d.notes)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span>{fb.signal === 'green' ? '🟢' : fb.signal === 'yellow' ? '🟡' : '🔴'}</span>
        <span className="text-sm font-semibold">{fb.ai_summary}</span>
        {fb.coach_reply && <span className="text-xs text-green-400 ml-1">✓ Odpowiedziano</span>}
      </div>
      {hasText && (
        <div className="space-y-1.5 text-sm">
          {d.feeling && (
            <div className="flex items-center gap-2">
              <span>{d.feeling}</span>
              <span style={{ color: 'var(--text-muted)' }}>{FEELING_LABELS[d.feeling]}</span>
              {d.intensity && <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{d.intensity}</span>}
            </div>
          )}
          {(d.trainingType || d.distanceKm || d.durationMin) && (
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              {d.trainingType && <span>🏃 {d.trainingType}</span>}
              {d.distanceKm && <span>📏 {d.distanceKm} km</span>}
              {d.durationMin && <span>⏱ {d.durationMin} min</span>}
            </div>
          )}
          {d.notes && <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>"{d.notes}"</p>}
        </div>
      )}
      {d.voice && (
        <p className="text-sm italic"
          style={{ color: 'var(--text-muted)', borderTop: hasText ? '1px solid var(--border)' : 'none', paddingTop: hasText ? '10px' : '0', marginTop: hasText ? '4px' : '0' }}>
          🎤 {d.voice}
        </p>
      )}
      {fb.coach_reply && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
          <div className="text-xs font-semibold mb-1" style={{ color: '#2ECC71' }}>💬 Twoja odpowiedź</div>
          <p>{fb.coach_reply}</p>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────

function shiftMonth(m: string, d: number): string {
  const [y, mo] = m.split('-').map(Number)
  const dt = new Date(y, mo - 1 + d, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

function getMonthCalendar(monthStr: string): (string | null)[][] {
  const [y, mo] = monthStr.split('-').map(Number)
  const daysInMonth = new Date(y, mo, 0).getDate()
  const startDow = (new Date(y, mo - 1, 1).getDay() + 6) % 7
  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${monthStr}-${String(d).padStart(2, '0')}`)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

interface SessionDraft {
  title: string; type: string; description: string
  plannedDistance: string; plannedDuration: string; plannedPace: string; url: string; urlLabel: string
  completed: boolean; actualDistance: string; actualDuration: string; actualPace: string; avgHr: string; maxHr: string
}

const emptyDraft = (): SessionDraft => ({
  title: '', type: 'easy', description: '', plannedDistance: '', plannedDuration: '', plannedPace: '', url: '', urlLabel: '',
  completed: false, actualDistance: '', actualDuration: '', actualPace: '', avgHr: '', maxHr: '',
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>

type Package = { id: string; name: string; description: string | null; price: number }

interface RaceDraft { name: string; date: string; distance: string; goalTime: string; result: string; status: RaceStatus; notes: string }

interface Props {
  athlete: DbRow
  sessions: DbRow[]
  feedbacks: DbRow[]
  invoices: DbRow[]
  packages: Package[]
  races: DbRow[]
  unreadMessagesCount: number
}

// ── Component ─────────────────────────────────────────────────────────────

export function AthleteProfileClient({ athlete, sessions: initialSessions, feedbacks: athleteFeedbacks, invoices: athleteInvoices, packages, races: initialRaces, unreadMessagesCount }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('plan')
  const [saving, setSaving] = useState(false)

  // ── Feedback lookup ──
  const feedbackBySession = Object.fromEntries(athleteFeedbacks.filter(f => f.session_id).map(f => [f.session_id, f]))
  const feedbackByDate = Object.fromEntries(athleteFeedbacks.map(f => [f.date, f]))

  // ── Plan view state ──
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)
  const [planView, setPlanView] = useState<'week' | 'month'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // ── Session types hook ──
  const { all: allSessionTypes, custom: customSessionTypes, labelOverrides, saveAll: saveSessionTypes } = useCustomSessionTypes()

  // ── Session type editor modal ──
  const [sessionTypeModalOpen, setSessionTypeModalOpen] = useState(false)
  const [editingBuiltinLabels, setEditingBuiltinLabels] = useState<Record<string, string>>({})
  const [editingCustomTypes, setEditingCustomTypes] = useState<SessionTypeDef[]>([])
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [newTypeColor, setNewTypeColor] = useState(PRESET_TYPE_COLORS[0])

  // ── Session modal ──
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [draftDate, setDraftDate] = useState('')
  const [draft, setDraft] = useState<SessionDraft>(emptyDraft())

  // ── History month navigation ──
  const [historyMonth, setHistoryMonth] = useState(currentMonth)

  // ── Expanded feedback rows (history) ──
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  function toggleRow(sessionId: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId)
      return next
    })
  }

  // ── Feedback detail modal ──
  const [feedbackModalData, setFeedbackModalData] = useState<DbRow | null>(null)

  // ── Notes state ──
  const [coachNotes, setCoachNotes] = useState(athlete.coach_notes ?? '')
  const [notesEditing, setNotesEditing] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  // ── Dane (data edit) state ──
  const [dataEditing, setDataEditing] = useState(false)
  const [dataEdit, setDataEdit] = useState({
    name: athlete.name ?? '',
    email: athlete.email ?? '',
    phone: athlete.phone ?? '',
    age: athlete.age?.toString() ?? '',
    city: athlete.city ?? '',
    goal: athlete.goal ?? '',
    package: athlete.package ?? 'Starter',
    package_price: athlete.package_price?.toString() ?? '',
    status: athlete.status ?? 'ok',
    height: athlete.height?.toString() ?? '',
    weight: athlete.weight?.toString() ?? '',
    join_date: athlete.join_date ?? '',
    injuries: (athlete.injuries as string[] | null) ?? [],
  })
  const [injuryInput, setInjuryInput] = useState('')

  // ── Races state ──
  const [raceModalOpen, setRaceModalOpen] = useState(false)
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null)
  const [raceDraft, setRaceDraft] = useState<RaceDraft>({ name: '', date: '', distance: '', goalTime: '', result: '', status: 'planned', notes: '' })
  const [raceSaving, setRaceSaving] = useState(false)
  const [confirmDeleteRaceId, setConfirmDeleteRaceId] = useState<string | null>(null)
  const [openNoteRaceId, setOpenNoteRaceId] = useState<string | null>(null)
  const [plannedOpen, setPlannedOpen] = useState(true)
  const [finishedOpen, setFinishedOpen] = useState(true)
  // ── Invoice state ──
  const [localInvoices, setLocalInvoices] = useState(athleteInvoices)
  useEffect(() => setLocalInvoices(athleteInvoices), [athleteInvoices])
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [invoiceDraft, setInvoiceDraft] = useState({ description: '', amount: '', dueDate: '' })
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)
  const invoiceFileRef = useRef<HTMLInputElement>(null)
  const [dataSaving, setDataSaving] = useState(false)
  const [dataSaved, setDataSaved] = useState(false)

  // ── Feedback tab state ──
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Set<string>>(new Set())
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [replyingSaving, setReplyingSaving] = useState<string | null>(null)

  async function toggleFeedback(fbId: string, read: boolean) {
    setExpandedFeedbacks(prev => {
      const next = new Set(prev)
      next.has(fbId) ? next.delete(fbId) : next.add(fbId)
      return next
    })
    if (!read) {
      await markFeedbackRead(fbId, athlete.id)
      startTransition(() => router.refresh())
    }
  }

  async function sendReply(fbId: string) {
    const reply = replyTexts[fbId]?.trim()
    if (!reply || replyingSaving) return
    setReplyingSaving(fbId)
    try {
      const fd = new FormData()
      fd.set('id', fbId)
      fd.set('reply', reply)
      fd.set('athlete_id', athlete.id)
      await replyFeedback(null, fd)
      setReplyTexts(prev => ({ ...prev, [fbId]: '' }))
      startTransition(() => router.refresh())
    } finally {
      setReplyingSaving(null)
    }
  }

  // ── Personal bests state ──
  const savedDistances = Object.keys(athlete.personal_bests ?? {})
  const initialDistances = [
    ...DEFAULT_PB_DISTANCES,
    ...savedDistances.filter(d => !DEFAULT_PB_DISTANCES.includes(d)),
  ]
  const [pbDistances, setPbDistances] = useState(initialDistances)
  const [newPbDistance, setNewPbDistance] = useState('')
  const [pbEditing, setPbEditing] = useState(false)
  const [pbEdit, setPbEdit] = useState<Record<string, string>>(
    Object.fromEntries(initialDistances.map(d => [d, (athlete.personal_bests ?? {})[d] ?? '']))
  )
  const [pbSaving, setPbSaving] = useState(false)
  const [pbSaved, setPbSaved] = useState(false)

  async function saveData() {
    if (dataSaving) return
    setDataSaving(true)
    const fd = new FormData()
    fd.set('id', athlete.id)
    const { injuries, ...restEdit } = dataEdit
    Object.entries(restEdit).forEach(([k, v]) => fd.set(k, v))
    fd.set('injuries', JSON.stringify(injuries))
    await updateAthlete(null, fd)
    setDataSaving(false)
    setDataSaved(true)
    setDataEditing(false)
    setTimeout(() => setDataSaved(false), 2000)
    startTransition(() => router.refresh())
  }

  async function savePb() {
    if (pbSaving) return
    setPbSaving(true)
    const fd = new FormData()
    fd.set('id', athlete.id)
    const personalBests = Object.fromEntries(Object.entries(pbEdit).filter(([, v]) => v.trim()))
    fd.set('personal_bests', JSON.stringify(personalBests))
    await updateAthlete(null, fd)
    setPbSaving(false)
    setPbSaved(true)
    setPbEditing(false)
    setTimeout(() => setPbSaved(false), 2000)
    startTransition(() => router.refresh())
  }

  // ── Invite link ──
  const [linkCopied, setLinkCopied] = useState(false)
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/u/${athlete.slug}?t=${athlete.invite_token}`
    : `/u/${athlete.slug}?t=${athlete.invite_token}`


  const unreadFeedbackCount = athleteFeedbacks.filter(f => !f.read).length

  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'history', label: 'Historia' },
    { id: 'feedback', label: unreadFeedbackCount > 0 ? `Feedback (${unreadFeedbackCount})` : 'Feedback' },
    { id: 'races', label: 'Zawody' },
    { id: 'notes', label: 'Notatki' },
    { id: 'data', label: 'Dane' },
    { id: 'finance', label: 'Finanse' },
  ]

  const completedSessions = initialSessions.filter(s => s.completed && s.actual_distance)
  const totalKm = completedSessions.reduce((sum, s) => sum + (s.actual_distance || 0), 0)
  const totalPaid = localInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)

  // ── Session modal handlers ──
  // ── Session type color helpers ──
  function typeClass(type: string): string {
    if (customSessionTypes.find(t => t.key === type)) return ''
    return intensityColor(type as SessionType)
  }
  function typeStyle(type: string): React.CSSProperties {
    const c = customSessionTypes.find(t => t.key === type)
    return c?.color ? { background: c.color + '33', color: c.color } : {}
  }
  function typeLabel(type: string): string {
    return allSessionTypes.find(t => t.key === type)?.label ?? sessionTypeLabel(type as SessionType)
  }
  function completionStyle(session: DbRow): React.CSSProperties {
    if (session.completed) return { outline: '2px solid rgba(46,204,113,0.6)', outlineOffset: '-2px' }
    if (isPast(session.date)) return { opacity: 0.4, outline: '1px dashed rgba(231,76,60,0.5)', outlineOffset: '-1px' }
    return {}
  }

  // ── Session type editor ──
  function openSessionTypeModal() {
    setEditingBuiltinLabels({ ...labelOverrides })
    setEditingCustomTypes(customSessionTypes.map(t => ({ ...t })))
    setNewTypeLabel('')
    setNewTypeColor(PRESET_TYPE_COLORS[0])
    setSessionTypeModalOpen(true)
  }
  function saveSessionTypeEdits() {
    saveSessionTypes(editingBuiltinLabels, editingCustomTypes)
    setSessionTypeModalOpen(false)
  }
  function addCustomType() {
    if (!newTypeLabel.trim()) return
    const key = `custom_${Date.now()}`
    setEditingCustomTypes(prev => [...prev, { key, label: newTypeLabel.trim(), color: newTypeColor, isBuiltin: false }])
    setNewTypeLabel('')
  }

  function openNewSession(date: string) {
    setDraftDate(date)
    setDraft(emptyDraft())
    setEditingSessionId(null)
    setSessionModalOpen(true)
  }

  function openEditSession(session: DbRow) {
    setDraftDate(session.date)
    setDraft({
      title: session.title,
      type: session.type,
      description: session.description || '',
      plannedDistance: session.planned_distance?.toString() ?? '',
      plannedDuration: session.planned_duration?.toString() ?? '',
      plannedPace: session.planned_pace ?? '',
      url: session.url ?? '',
      urlLabel: session.url_label ?? '',
      completed: session.completed ?? false,
      actualDistance: session.actual_distance?.toString() ?? '',
      actualDuration: session.actual_duration?.toString() ?? '',
      actualPace: session.actual_pace ?? '',
      avgHr: session.avg_hr?.toString() ?? '',
      maxHr: session.max_hr?.toString() ?? '',
    })
    setEditingSessionId(session.id)
    setSessionModalOpen(true)
  }

  async function saveSession() {
    if (!draft.title.trim() || saving) return
    setSaving(true)

    const fd = new FormData()
    fd.set('athlete_id', athlete.id)
    fd.set('date', draftDate)
    fd.set('type', draft.type)
    fd.set('title', draft.title)
    fd.set('description', draft.description)

    if (editingSessionId) {
      // Przy edycji zawsze wysyłamy wszystkie pola — pusty string = null na serwerze
      fd.set('planned_distance', draft.plannedDistance)
      fd.set('planned_duration', draft.plannedDuration)
      fd.set('planned_pace', draft.plannedPace)
      fd.set('url', draft.url)
      fd.set('url_label', draft.urlLabel)
      fd.set('completed', draft.completed.toString())
      fd.set('actual_distance', draft.actualDistance)
      fd.set('actual_duration', draft.actualDuration)
      fd.set('actual_pace', draft.actualPace)
      fd.set('avg_hr', draft.avgHr)
      fd.set('max_hr', draft.maxHr)
    } else {
      if (draft.plannedDistance) fd.set('planned_distance', draft.plannedDistance)
      if (draft.plannedDuration) fd.set('planned_duration', draft.plannedDuration)
      if (draft.plannedPace) fd.set('planned_pace', draft.plannedPace)
      if (draft.url) fd.set('url', draft.url)
      if (draft.urlLabel) fd.set('url_label', draft.urlLabel)
      if (draft.completed) fd.set('completed', 'true')
      if (draft.actualDistance) fd.set('actual_distance', draft.actualDistance)
      if (draft.actualDuration) fd.set('actual_duration', draft.actualDuration)
      if (draft.actualPace) fd.set('actual_pace', draft.actualPace)
      if (draft.avgHr) fd.set('avg_hr', draft.avgHr)
      if (draft.maxHr) fd.set('max_hr', draft.maxHr)
    }

    if (editingSessionId) {
      fd.set('id', editingSessionId)
      fd.set('athlete_id', athlete.id)
      await updateSession(null, fd)
    } else {
      await createSession(null, fd)
    }

    setSessionModalOpen(false)
    setSaving(false)
    startTransition(() => router.refresh())
  }

  async function handleDeleteSession() {
    if (!editingSessionId || saving) return
    setSaving(true)
    await deleteSessionAction(editingSessionId, athlete.id)
    setSessionModalOpen(false)
    setSaving(false)
    startTransition(() => router.refresh())
  }

  async function saveNotes() {
    const fd = new FormData()
    fd.set('id', athlete.id)
    fd.set('coach_notes', coachNotes)
    await updateAthlete(null, fd)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
    startTransition(() => router.refresh())
  }

  // ── Race handlers ──
  function openNewRace() {
    setRaceDraft({ name: '', date: '', distance: '', goalTime: '', result: '', status: 'planned', notes: '' })
    setEditingRaceId(null)
    setRaceModalOpen(true)
  }

  function openEditRace(race: DbRow) {
    setRaceDraft({ name: race.name, date: race.date, distance: race.distance ?? '', goalTime: race.goal_time ?? '', result: race.result ?? '', status: race.status ?? 'planned', notes: race.notes ?? '' })
    setEditingRaceId(race.id)
    setRaceModalOpen(true)
  }

  async function saveRace() {
    if (!raceDraft.name.trim() || !raceDraft.date || raceSaving) return
    setRaceSaving(true)
    try {
      const fd = new FormData()
      fd.set('athlete_id', athlete.id)
      fd.set('name', raceDraft.name)
      fd.set('date', raceDraft.date)
      fd.set('distance', raceDraft.distance)
      fd.set('goal_time', raceDraft.goalTime)
      fd.set('result', raceDraft.result)
      fd.set('status', raceDraft.status)
      fd.set('notes', raceDraft.notes)
      if (editingRaceId) {
        fd.set('id', editingRaceId)
        await updateRace(null, fd)
      } else {
        await createRace(null, fd)
      }
      setRaceModalOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setRaceSaving(false)
    }
  }

  async function handleDeleteRace(id: string) {
    await deleteRace(id, athlete.id)
    setConfirmDeleteRaceId(null)
    setRaceModalOpen(false)
    startTransition(() => router.refresh())
  }

  // ── Invoice handlers ──
  function closeInvoiceModal() {
    setInvoiceModalOpen(false)
    setInvoiceDraft({ description: '', amount: '', dueDate: '' })
    if (invoiceFileRef.current) invoiceFileRef.current.value = ''
  }

  async function changeInvoiceStatus(invId: string, next: InvoiceStatus) {
    const prev = localInvoices.find(i => i.id === invId)?.status as InvoiceStatus
    setLocalInvoices(ls => ls.map(i => i.id === invId ? { ...i, status: next } : i))
    setStatusChangingId(invId)
    try {
      const result = await updateInvoiceStatus(invId, next, athlete.id)
      if (result?.error) {
        setLocalInvoices(ls => ls.map(i => i.id === invId ? { ...i, status: prev } : i))
      } else {
        startTransition(() => router.refresh())
      }
    } finally {
      setStatusChangingId(null)
    }
  }

  async function saveInvoice() {
    if (!invoiceDraft.amount || invoiceSaving) return
    setInvoiceSaving(true)
    try {
      const fd = new FormData()
      fd.set('athlete_id', athlete.id)
      fd.set('description', invoiceDraft.description)
      fd.set('amount', invoiceDraft.amount)
      if (invoiceDraft.dueDate) fd.set('due_date', invoiceDraft.dueDate)
      if (athlete.package) fd.set('package', athlete.package)
      const file = invoiceFileRef.current?.files?.[0]
      if (file) fd.set('attachment', file)
      await createInvoice(null, fd)
      closeInvoiceModal()
      startTransition(() => router.refresh())
    } finally {
      setInvoiceSaving(false)
    }
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  // ── Plan week data ──
  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])
  const weekSessions = initialSessions.filter(s => s.date >= weekStart && s.date <= weekEnd)

  // ── Plan month data ──
  const calendarWeeks = getMonthCalendar(selectedMonth)

  // ── Session modal footer ──
  const sessionFooter = (
    <div className="flex gap-3">
      {editingSessionId && (
        <button
          onClick={handleDeleteSession}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}
        >🗑 Usuń</button>
      )}
      {editingSessionId && (
        <button
          onClick={() => {
            const cur = { ...draft }
            setEditingSessionId(null)
            setDraftDate('')
            setDraft({ ...cur, completed: false, actualDistance: '', actualDuration: '', actualPace: '', avgHr: '', maxHr: '' })
          }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
        >📋 Duplikuj</button>
      )}
      <Button className="flex-1" onClick={saveSession} disabled={!draft.title.trim() || saving}>
        {saving ? 'Zapisywanie...' : editingSessionId ? 'Zapisz zmiany' : 'Dodaj sesję'}
      </Button>
    </div>
  )

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }

  return (
    <div>
      <CoachTopbar
        title={athlete.name}
        subtitle={[athlete.goal, athlete.package].filter(Boolean).join(' · ')}
        actions={
          <Link href="/coach/athletes" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← Zawodnicy
          </Link>
        }
      />

      <div className="p-6">
        {/* Profile header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-5">
            <Avatar initials={athlete.avatar} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{athlete.name}</h2>
                <Badge variant="gray">
                  {athlete.package} — {formatCurrency(athlete.package_price)}/mies.
                </Badge>
                <Link href={`/coach/chat?athlete=${athlete.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ml-auto shrink-0 transition-colors"
                  style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                  💬 Chat
                  {unreadMessagesCount > 0 && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FF5C1B', color: 'white', lineHeight: 1 }}>
                      {unreadMessagesCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
                {athlete.goal && <span>🎯 {athlete.goal}</span>}
                {athlete.city && <span>📍 {athlete.city}</span>}
                {athlete.age && <span>🎂 {athlete.age} lat</span>}
                <span>📅 Od {formatDate(athlete.join_date, { month: 'long', year: 'numeric' })}</span>
                {totalKm > 0 && <span>🏃 {totalKm.toFixed(0)} km łącznie</span>}
              </div>
            </div>
          </div>

          {/* Invite link */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>🔗 Link zaproszenia dla zawodnika</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl text-xs font-mono truncate" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                /u/{athlete.slug}?t={athlete.invite_token.slice(0, 8)}…
              </code>
              <button
                onClick={copyInviteLink}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                style={{ background: linkCopied ? 'rgba(46,204,113,0.15)' : 'rgba(255,92,27,0.1)', color: linkCopied ? '#2ECC71' : '#FF5C1B' }}
              >
                {linkCopied ? '✓ Skopiowano' : '📋 Kopiuj'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Cześć! Oto Twój panel treningowy: ${inviteUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}
              >
                WhatsApp
              </a>
              <a
                href={`mailto:${athlete.email || ''}?subject=${encodeURIComponent('Twój panel treningowy')}&body=${encodeURIComponent(`Cześć ${athlete.name}!\n\nTutaj znajdziesz swój panel treningowy:\n${inviteUrl}`)}`}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}
              >
                Email
              </a>
            </div>
          </div>
        </Card>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* ── Plan ── */}
        {activeTab === 'plan' && (
          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setPlanView('week')}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                  style={{ background: planView === 'week' ? '#FF5C1B' : 'transparent', color: planView === 'week' ? 'white' : 'var(--text-muted)' }}
                >📅 Tydzień</button>
                <button
                  onClick={() => setPlanView('month')}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                  style={{ background: planView === 'month' ? '#FF5C1B' : 'transparent', color: planView === 'month' ? 'white' : 'var(--text-muted)' }}
                >📆 Miesiąc</button>
              </div>

              {planView === 'week' ? (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>←</button>
                    <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Dziś</button>
                    <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→</button>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(weekStart, { day: 'numeric', month: 'short' })} — {formatDate(weekEnd, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedMonth(m => shiftMonth(m, -1))} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>←</button>
                    <button onClick={() => setSelectedMonth(currentMonth)} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Dziś</button>
                    <button onClick={() => setSelectedMonth(m => shiftMonth(m, 1))} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→</button>
                  </div>
                  <span className="text-sm capitalize font-medium" style={{ color: 'var(--text-muted)' }}>
                    {monthLabel(selectedMonth)}
                  </span>
                </div>
              )}
            </div>

            {/* ── Widok tygodniowy ── */}
            {planView === 'week' && (
              <div className="grid grid-cols-7 gap-2" style={{ minHeight: '260px' }}>
                {weekDays.map(day => {
                  const dateStr = toISODate(day)
                  const daySessions = weekSessions.filter(s => s.date === dateStr)
                  const todayFlag = isToday(dateStr)
                  const pastFlag = isPast(dateStr)

                  return (
                    <div key={dateStr} className="flex flex-col rounded-2xl overflow-hidden"
                      style={{ border: todayFlag ? '2px solid rgba(255,92,27,0.5)' : '1px solid var(--border)', background: 'var(--bg-card)' }}>
                      <div className="py-3 px-2 text-center shrink-0"
                        style={{ background: todayFlag ? 'rgba(255,92,27,0.07)' : 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                        <div className="text-xs font-medium capitalize" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-muted)' }}>
                          {dayName(day, true)}
                        </div>
                        <div className="text-xl font-black leading-tight mt-0.5" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-primary)' }}>
                          {day.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                        {daySessions.length === 0 && (
                          <div className="h-full flex items-center justify-center py-4">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>wolny</span>
                          </div>
                        )}
                        {daySessions.map(session => (
                          <div key={session.id} onClick={() => openEditSession(session)}
                            className={`relative p-2 rounded-xl cursor-pointer hover:opacity-80 ${typeClass(session.type)}`}
                            style={{ ...typeStyle(session.type), ...completionStyle(session) }}>
                            {!session.completed && (
                              <button
                                onClick={async e => {
                                  e.stopPropagation()
                                  const fd = new FormData()
                                  fd.set('id', session.id)
                                  fd.set('athlete_id', athlete.id)
                                  fd.set('completed', 'true')
                                  await updateSession(null, fd)
                                  startTransition(() => router.refresh())
                                }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer opacity-60 hover:opacity-100"
                                style={{ background: 'rgba(0,0,0,0.25)', color: 'white' }}
                                title="Oznacz jako wykonaną"
                              >✓</button>
                            )}
                            <div className="font-semibold text-xs leading-tight mb-1 pr-5">{session.title}</div>
                            {session.description && <div className="text-xs opacity-60 leading-tight mb-1">{session.description}</div>}
                            <div className="flex flex-col gap-0.5 text-xs opacity-75">
                              {session.planned_distance && <span>📏 {session.planned_distance} km</span>}
                              {session.planned_duration && <span>⏱ {session.planned_duration} min</span>}
                              {session.planned_pace && <span>⚡ {session.planned_pace}/km</span>}
                            </div>
                            {session.actual_distance && (
                              <div className="flex flex-col gap-0.5 text-xs mt-1" style={{ color: 'rgba(46,204,113,0.9)' }}>
                                <span>✓ {session.actual_distance} km</span>
                                {session.actual_pace && <span>⚡ {session.actual_pace}/km</span>}
                              </div>
                            )}
                            {session.url && (
                              <a href={session.url} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 mt-1.5 text-xs opacity-80 hover:opacity-100">
                                🔗 <span className="underline">{session.url_label || 'Link'}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                      {feedbackByDate[dateStr] && (
                        <div className="px-1.5 pb-1 shrink-0">
                          <button onClick={() => setFeedbackModalData(feedbackByDate[dateStr])}
                            className="w-full py-1 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1"
                            style={{ background: 'rgba(255,92,27,0.08)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.2)' }}>
                            💬 Feedback
                          </button>
                        </div>
                      )}
                      <div className="p-1.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                        <button onClick={() => openNewSession(dateStr)}
                          className="w-full py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>+ dodaj</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Widok miesięczny ── */}
            {planView === 'month' && (
              <div>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(d => (
                      <div key={d} className="py-3 text-center text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{d}</div>
                    ))}
                  </div>
                  {calendarWeeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < calendarWeeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      {week.map((dateStr, di) => {
                        if (!dateStr) return (
                          <div key={di} className="min-h-36 p-2" style={{ background: 'var(--bg-base)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />
                        )
                        const daySessions = initialSessions.filter(s => s.date === dateStr)
                        const todayFlag = isToday(dateStr)
                        const isSelected = selectedDay === dateStr
                        const dayNum = parseInt(dateStr.split('-')[2])
                        return (
                          <div key={dateStr} className="min-h-36 p-2 transition-colors"
                            style={{
                              background: isSelected ? 'rgba(255,92,27,0.06)' : 'var(--bg-card)',
                              borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                              outline: todayFlag ? '2px solid rgba(255,92,27,0.4)' : 'none',
                              outlineOffset: '-2px',
                            }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <button onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                                className="text-sm font-bold cursor-pointer w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: todayFlag ? '#FF5C1B' : 'transparent', color: todayFlag ? 'white' : isSelected ? '#FF5C1B' : 'var(--text-primary)' }}>
                                {dayNum}
                              </button>
                              <button onClick={e => { e.stopPropagation(); openNewSession(dateStr) }}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer"
                                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>+</button>
                            </div>
                            <div className="space-y-1">
                              {daySessions.slice(0, 3).map(s => (
                                <div key={s.id} onClick={() => openEditSession(s)}
                                  className={`px-1.5 py-1 rounded-lg cursor-pointer hover:opacity-80 ${typeClass(s.type)}`}
                                  style={{ ...typeStyle(s.type), ...completionStyle(s) }}>
                                  <div className="text-xs font-semibold leading-tight">{s.title}</div>
                                  {s.completed && s.actual_distance
                                    ? <div style={{ fontSize: '10px', color: 'rgba(46,204,113,0.9)' }}>✓ {s.actual_distance}km</div>
                                    : <div className="flex flex-wrap gap-x-2 mt-0.5" style={{ fontSize: '10px', opacity: 0.75 }}>
                                        {s.planned_distance && <span>📏 {s.planned_distance}km</span>}
                                        {s.planned_duration && <span>⏱ {s.planned_duration}min</span>}
                                      </div>
                                  }
                                </div>
                              ))}
                              {daySessions.length > 3 && <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>+{daySessions.length - 3} więcej</div>}
                            </div>
                            {feedbackByDate[dateStr] && (
                              <button onClick={e => { e.stopPropagation(); setFeedbackModalData(feedbackByDate[dateStr]) }}
                                className="mt-1 w-full text-center cursor-pointer rounded-lg py-0.5"
                                style={{ fontSize: '10px', background: 'rgba(255,92,27,0.1)', color: '#FF5C1B', border: 'none' }}>
                                💬 feedback
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
                {selectedDay && (
                  <div className="mt-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-semibold">{formatDate(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                      <button onClick={() => openNewSession(selectedDay)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer"
                        style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>+ Dodaj sesję</button>
                    </div>
                    {initialSessions.filter(s => s.date === selectedDay).length === 0 ? (
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak sesji — wolny dzień</div>
                    ) : (
                      <div className="space-y-2">
                        {initialSessions.filter(s => s.date === selectedDay).map(session => (
                          <div key={session.id} className={`flex items-center gap-4 p-3 rounded-xl ${typeClass(session.type)}`}
                            style={typeStyle(session.type)}>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{session.title}</div>
                              <div className="flex gap-4 text-xs opacity-70 mt-1">
                                {session.planned_distance && <span>📏 {session.planned_distance} km</span>}
                                {session.planned_duration && <span>⏱️ {session.planned_duration} min</span>}
                                {session.planned_pace && <span>⚡ {session.planned_pace}/km</span>}
                              </div>
                              {session.url && (
                                <a href={session.url} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="flex items-center gap-1 mt-1.5 text-xs opacity-80 hover:opacity-100 underline">
                                  🔗 {session.url_label || 'Link'}
                                </a>
                              )}
                            </div>
                            <button onClick={() => openEditSession(session)} className="p-1.5 rounded-lg cursor-pointer text-sm" style={{ background: 'rgba(0,0,0,0.2)' }}>✏️</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── Historia ── */}
        {activeTab === 'history' && (() => {
          const monthSessions = initialSessions.filter(s => s.date.slice(0, 7) === historyMonth).sort((a, b) => b.date.localeCompare(a.date))
          const monthCompleted = monthSessions.filter(s => s.completed)
          const monthKm = monthCompleted.reduce((sum, s) => sum + (s.actual_distance || 0), 0)
          const monthFeedbacks = athleteFeedbacks.filter(f => f.date.slice(0, 7) === historyMonth)
          const completionRate = monthSessions.length > 0
            ? Math.round((monthCompleted.length / monthSessions.length) * 100)
            : 0
          return (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Sesje', value: `${monthCompleted.length} / ${monthSessions.length}` },
                { label: 'Łącznie km', value: monthKm > 0 ? `${monthKm.toFixed(0)} km` : '—' },
                { label: 'Feedbacków', value: monthFeedbacks.length },
                { label: 'Ukończenie', value: monthSessions.length > 0 ? `${completionRate}%` : '—' },
              ].map(stat => (
                <Card key={stat.label} className="p-4 text-center">
                  <div className="text-xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                </Card>
              ))}
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setHistoryMonth(m => shiftMonth(m, -1))}
                className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>←</button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                  {monthLabel(historyMonth)}
                </span>
                {historyMonth !== currentMonth && (
                  <button onClick={() => setHistoryMonth(currentMonth)}
                    className="px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    Dziś
                  </button>
                )}
              </div>
              <button onClick={() => setHistoryMonth(m => shiftMonth(m, 1))}
                className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>→</button>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    {['Data', 'Sesja', 'Typ', 'Dystans', 'Tempo', 'HR', 'Status', 'Feedback'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthSessions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <div className="text-3xl mb-2">📅</div>
                        <div className="text-sm font-medium mb-1">Brak sesji w tym miesiącu</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Przejdź do zakładki Plan, aby zaplanować treningi</div>
                      </td>
                    </tr>
                  )}
                  {monthSessions.map(session => {
                    const fb = feedbackBySession[session.id] || feedbackByDate[session.date]
                    const isExpanded = expandedRows.has(session.id)
                    return (
                      <Fragment key={session.id}>
                        <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--bg-subtle)' }}>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(session.date, { day: 'numeric', month: 'short' })}</td>
                          <td className="px-4 py-3 font-medium text-xs">{session.title}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeClass(session.type)}`}
                              style={typeStyle(session.type)}>
                              {typeLabel(session.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {session.actual_distance ? `${session.actual_distance} km` : session.planned_distance ? `(${session.planned_distance} km)` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.actual_pace || session.planned_pace || '—'}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{session.avg_hr ? `${session.avg_hr} bpm` : '—'}</td>
                          <td className="px-4 py-3">
                            {session.completed
                              ? <span className="text-xs text-green-400">✓ Wykonany</span>
                              : session.date < today
                              ? <span className="text-xs text-red-400">✗ Pominięty</span>
                              : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Planowany</span>}
                          </td>
                          <td className="px-4 py-3">
                            {fb ? (
                              <button onClick={() => toggleRow(session.id)}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg cursor-pointer"
                                style={{ background: isExpanded ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)', color: isExpanded ? '#FF5C1B' : 'var(--text-muted)' }}>
                                <span>💬</span><span>{isExpanded ? '▲' : '▼'}</span>
                              </button>
                            ) : <span className="text-xs" style={{ color: 'var(--border)' }}>—</span>}
                          </td>
                        </tr>
                        {isExpanded && fb && (
                          <tr>
                            <td colSpan={8} className="px-4 pb-3">
                              <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                <FeedbackDetail fb={fb} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )
        })()}

        {/* ── Dane ── */}
        {activeTab === 'data' && (
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Dane zawodnika</h3>
                {!dataEditing ? (
                  <button
                    onClick={() => setDataEditing(true)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
                  >
                    Edytuj
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDataEditing(false)
                        setDataEdit({
                          name: athlete.name ?? '',
                          email: athlete.email ?? '',
                          phone: athlete.phone ?? '',
                          age: athlete.age?.toString() ?? '',
                          city: athlete.city ?? '',
                          goal: athlete.goal ?? '',
                          package: athlete.package ?? 'Starter',
                          package_price: athlete.package_price?.toString() ?? '',
                          status: athlete.status ?? 'ok',
                          height: athlete.height?.toString() ?? '',
                          weight: athlete.weight?.toString() ?? '',
                          join_date: athlete.join_date ?? '',
                          injuries: (athlete.injuries as string[] | null) ?? [],
                        })
                        setInjuryInput('')
                      }}
                      className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={saveData}
                      disabled={dataSaving}
                      className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ background: dataSaved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: dataSaved ? '#2ECC71' : 'white' }}
                    >
                      {dataSaved ? '✓ Zapisano' : dataSaving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                  </div>
                )}
              </div>

              {!dataEditing ? (
                <div className="space-y-3 text-sm">
                  {([
                    ['Imię i nazwisko', dataEdit.name],
                    ['Email', dataEdit.email],
                    ['Telefon', dataEdit.phone],
                    ['Wiek', dataEdit.age ? `${dataEdit.age} lat` : ''],
                    ['Wzrost', dataEdit.height ? `${dataEdit.height} cm` : ''],
                    ['Waga', dataEdit.weight ? `${dataEdit.weight} kg` : ''],
                    ['Miasto', dataEdit.city],
                    ['Cel treningowy', dataEdit.goal],
                    ['Pakiet', dataEdit.package],
                    ['Cena', dataEdit.package_price ? `${formatCurrency(Number(dataEdit.package_price))}/mies.` : ''],
                    ['Dołączył/a', dataEdit.join_date ? formatDate(dataEdit.join_date, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="font-medium text-right ml-4">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {([
                    ['Imię i nazwisko', 'name', 'text'],
                    ['Email', 'email', 'email'],
                    ['Telefon', 'phone', 'text'],
                    ['Wiek', 'age', 'number'],
                    ['Wzrost (cm)', 'height', 'number'],
                    ['Waga (kg)', 'weight', 'number'],
                    ['Miasto', 'city', 'text'],
                    ['Cel treningowy', 'goal', 'text'],
                  ] as const).map(([label, field, type]) => (
                    <div key={field}>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                      <input
                        type={type}
                        value={dataEdit[field]}
                        onChange={e => setDataEdit(d => ({ ...d, [field]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-sm"
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Pakiet</label>
                    {packages.length === 0 ? (
                      <div className="px-3 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}>
                        Brak pakietów — <a href="/coach/packages" className="underline" style={{ color: '#FF5C1B' }}>dodaj pakiet w zakładce Pakiety</a>
                      </div>
                    ) : (
                      <select
                        value={dataEdit.package}
                        onChange={e => {
                          const pkg = packages.find(p => p.name === e.target.value)
                          setDataEdit(d => ({
                            ...d,
                            package: e.target.value,
                            package_price: pkg ? pkg.price.toString() : d.package_price,
                          }))
                        }}
                        className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
                        style={inputStyle}
                      >
                        {!packages.some(p => p.name === dataEdit.package) && dataEdit.package && (
                          <option value={dataEdit.package} disabled>{dataEdit.package} (nieaktywny)</option>
                        )}
                        {packages.map(p => <option key={p.id} value={p.name}>{p.name} — {formatCurrency(p.price)}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Data dołączenia</label>
                    <input
                      type="date"
                      value={dataEdit.join_date}
                      onChange={e => setDataEdit(d => ({ ...d, join_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Kontuzje / historia</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {dataEdit.injuries.map(inj => (
                        <span key={inj} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                          {inj}
                          <button type="button" onClick={() => setDataEdit(d => ({ ...d, injuries: d.injuries.filter(i => i !== inj) }))} className="hover:opacity-70 leading-none">✕</button>
                        </span>
                      ))}
                    </div>
                    <input
                      value={injuryInput}
                      onChange={e => setInjuryInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && injuryInput.trim()) {
                          e.preventDefault()
                          const val = injuryInput.trim()
                          if (!dataEdit.injuries.includes(val)) setDataEdit(d => ({ ...d, injuries: [...d.injuries, val] }))
                          setInjuryInput('')
                        }
                      }}
                      placeholder="np. Kolano lewe — Enter żeby dodać"
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Rekordy życiowe</h3>
                {!pbEditing ? (
                  <button
                    onClick={() => setPbEditing(true)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
                  >Edytuj</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setPbEditing(false)
                      setPbDistances(initialDistances)
                      setPbEdit(Object.fromEntries(initialDistances.map(d => [d, (athlete.personal_bests ?? {})[d] ?? ''])))
                      setNewPbDistance('')
                    }}
                      className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Anuluj</button>
                    <button onClick={savePb} disabled={pbSaving}
                      className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ background: pbSaved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: pbSaved ? '#2ECC71' : 'white' }}>
                      {pbSaved ? '✓ Zapisano' : pbSaving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                  </div>
                )}
              </div>

              {!pbEditing ? (
                <div className="space-y-3 text-sm">
                  {pbDistances.map(dist => (
                    <div key={dist} className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>{dist}</span>
                      <span className="font-mono font-medium">{pbEdit[dist] || '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Format: 3:52:00 lub 22:30</p>
                  {pbDistances.map(dist => (
                    <div key={dist}>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{dist}</label>
                      <input
                        value={pbEdit[dist] ?? ''}
                        onChange={e => setPbEdit(p => ({ ...p, [dist]: e.target.value }))}
                        placeholder="np. 22:30"
                        className="w-full px-3 py-2 rounded-xl text-sm font-mono"
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <div>
                    <input
                      value={newPbDistance}
                      onChange={e => setNewPbDistance(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newPbDistance.trim()) {
                          e.preventDefault()
                          const dist = newPbDistance.trim()
                          if (!pbDistances.includes(dist)) {
                            setPbDistances(d => [...d, dist])
                            setPbEdit(p => ({ ...p, [dist]: '' }))
                          }
                          setNewPbDistance('')
                        }
                      }}
                      placeholder="+ Dodaj dystans (np. 3 km) — Enter"
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ ...inputStyle, borderStyle: 'dashed' }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Kontuzje/historia</div>
                {(athlete.injuries as string[] | null)?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(athlete.injuries as string[]).map(inj => (
                      <span key={inj} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{inj}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Brak</span>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ── Feedback ── */}
        {activeTab === 'feedback' && (
          <div className="space-y-2">
            {athleteFeedbacks.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-4xl mb-3">💬</div>
                <div className="text-sm font-medium mb-1">Brak feedbacków od zawodnika</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Feedbacki będą się tu pojawiać gdy zawodnik wypełni formularz po treningu</div>
              </Card>
            ) : (
              athleteFeedbacks.map(fb => {
                const isExpanded = expandedFeedbacks.has(fb.id)
                const signalDot = fb.signal === 'green' ? '#2ECC71' : fb.signal === 'yellow' ? '#F1C40F' : '#E74C3C'
                return (
                  <div key={fb.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <button
                      onClick={() => toggleFeedback(fb.id, fb.read)}
                      className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left"
                      style={{ background: 'transparent' }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: signalDot }} />
                      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(fb.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-sm font-medium flex-1">{fb.ai_summary || '—'}</span>
                      {!fb.read && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(255,92,27,0.15)', color: '#FF5C1B' }}>NOWE</span>
                      )}
                      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="pt-3">
                          <FeedbackDetail fb={fb} />
                        </div>
                        {!fb.coach_reply && (
                          <div className="mt-4 space-y-2">
                            <textarea
                              value={replyTexts[fb.id] ?? ''}
                              onChange={e => setReplyTexts(prev => ({ ...prev, [fb.id]: e.target.value }))}
                              placeholder="Napisz odpowiedź dla zawodnika..."
                              rows={3}
                              className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                            />
                            <button
                              onClick={() => sendReply(fb.id)}
                              disabled={!replyTexts[fb.id]?.trim() || replyingSaving === fb.id}
                              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                              style={{ background: '#FF5C1B', color: 'white', opacity: !replyTexts[fb.id]?.trim() ? 0.5 : 1 }}
                            >
                              {replyingSaving === fb.id ? 'Wysyłanie...' : 'Wyślij odpowiedź'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Zawody ── */}
        {activeTab === 'races' && (() => {
          // Split by STATUS not date — a future race can be marked completed, a past race can still be 'planned'
          const plannedRaces = initialRaces
            .filter(r => !r.status || r.status === 'planned')
            .slice().sort((a, b) => a.date.localeCompare(b.date)) // earliest first
          const finishedRaces = initialRaces
            .filter(r => r.status && r.status !== 'planned')
            .slice().sort((a, b) => b.date.localeCompare(a.date)) // most recent first

          const RaceTable = ({ races, columns, renderRow }: {
            races: DbRow[]
            columns: string[]
            renderRow: (race: DbRow, i: number) => React.ReactNode
          }) => (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    {columns.map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {races.map((race, i) => renderRow(race, i))}
                </tbody>
              </table>
            </div>
          )

          return (
            <div className="space-y-4">
              {/* ── Planowane ── */}
              <Card className="p-5">
                <div className={`flex items-center justify-between ${plannedOpen ? 'mb-4' : ''}`}>
                  <button onClick={() => setPlannedOpen(o => !o)}
                    className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{plannedOpen ? '▼' : '▶'}</span>
                    <h3 className="font-semibold">🏁 Planowane starty</h3>
                    {plannedRaces.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        {plannedRaces.length}
                      </span>
                    )}
                  </button>
                  <button onClick={openNewRace}
                    className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                    + Dodaj start
                  </button>
                </div>
                {plannedOpen && (plannedRaces.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">🏁</div>
                    <div className="text-sm font-medium mb-1">Brak zaplanowanych startów</div>
                    <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                      Dodaj nadchodzące zawody, aby śledzić cele i przygotowania zawodnika
                    </div>
                    <button onClick={openNewRace}
                      className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                      + Dodaj pierwszy start
                    </button>
                  </div>
                ) : (
                  <RaceTable
                    races={plannedRaces}
                    columns={['Data', 'Zawody', 'Dystans', 'Cel czasowy', 'Notatki', '']}
                    renderRow={(race, i) => {
                      const isPastDate = race.date < today
                      const noteOpen = openNoteRaceId === race.id
                      return (
                        <tr key={race.id} style={{ borderBottom: i < plannedRaces.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs" style={{ color: isPastDate ? '#F39C12' : 'var(--text-muted)' }}>
                              {formatDate(race.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            {isPastDate && <div className="text-xs mt-0.5" style={{ color: '#F39C12', opacity: 0.8 }}>brak wyniku</div>}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium">{race.name}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{race.distance || '—'}</td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{race.goal_time || '—'}</td>
                          <RaceNoteCell notes={race.notes} isOpen={noteOpen} onToggle={() => setOpenNoteRaceId(noteOpen ? null : race.id)} />
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => openEditRace(race)}
                              className="text-xs px-2.5 py-1 rounded-lg cursor-pointer"
                              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>✏️</button>
                          </td>
                        </tr>
                      )
                    }}
                  />
                ))}
              </Card>

              {/* ── Ukończone ── */}
              <Card className="p-5">
                <button onClick={() => setFinishedOpen(o => !o)}
                  className={`flex items-center gap-2 cursor-pointer ${finishedOpen ? 'mb-4' : ''}`}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{finishedOpen ? '▼' : '▶'}</span>
                  <h3 className="font-semibold">📋 Ukończone starty</h3>
                  {finishedRaces.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      {finishedRaces.length}
                    </span>
                  )}
                </button>
                {finishedOpen && (finishedRaces.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Brak ukończonych startów — po zawodach zmień status startu na ukończony, DNS lub DNF.
                    </div>
                  </div>
                ) : (
                  <RaceTable
                    races={finishedRaces}
                    columns={['Data', 'Zawody', 'Dystans', 'Wynik', 'Status', 'Notatki', '']}
                    renderRow={(race, i) => {
                      const st = RACE_STATUS_INFO[(race.status as RaceStatus)] ?? RACE_STATUS_INFO.completed
                      const noteOpen = openNoteRaceId === race.id
                      return (
                        <tr key={race.id} style={{ borderBottom: i < finishedRaces.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(race.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium">{race.name}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{race.distance || '—'}</td>
                          <td className="px-4 py-3 text-xs font-mono font-medium">{race.result || '—'}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
                          </td>
                          <RaceNoteCell notes={race.notes} isOpen={noteOpen} onToggle={() => setOpenNoteRaceId(noteOpen ? null : race.id)} />
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => openEditRace(race)}
                              className="text-xs px-2.5 py-1 rounded-lg cursor-pointer"
                              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>✏️</button>
                          </td>
                        </tr>
                      )
                    }}
                  />
                ))}
              </Card>
            </div>
          )
        })()}

        {/* ── Notatki ── */}
        {activeTab === 'notes' && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Notatki trenera</h3>
              {!notesEditing ? (
                <button
                  onClick={() => setNotesEditing(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
                >Edytuj</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setNotesEditing(false)}
                    className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Anuluj</button>
                  <button
                    onClick={async () => { await saveNotes(); setNotesEditing(false) }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: notesSaved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: notesSaved ? '#2ECC71' : 'white' }}
                  >{notesSaved ? '✓ Zapisano' : 'Zapisz'}</button>
                </div>
              )}
            </div>
            {!notesEditing ? (
              <div className="text-sm whitespace-pre-wrap min-h-16" style={{ color: coachNotes ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1.7 }}>
                {coachNotes || 'Brak notatek. Kliknij Edytuj, aby dodać.'}
              </div>
            ) : (
              <textarea
                value={coachNotes}
                onChange={e => setCoachNotes(e.target.value)}
                placeholder="Zapisz obserwacje, uwagi, przemyślenia o zawodniku..."
                rows={12}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={inputStyle}
              />
            )}
          </Card>
        )}

        {/* ── Finanse ── */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setInvoiceModalOpen(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                + Nowa faktura
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Opłacono łącznie', value: formatCurrency(totalPaid), color: 'text-green-400' },
                { label: 'Oczekujące', value: formatCurrency(localInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)), color: 'text-yellow-400' },
                { label: 'Przeterminowane', value: formatCurrency(localInvoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)), color: 'text-red-400' },
              ].map(kpi => (
                <Card key={kpi.label} className="p-4 text-center">
                  <div className={`text-xl font-bold mb-1 ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
                </Card>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    {['Nr faktury', 'Opis', 'Data', 'Termin', 'Kwota', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localInvoices.map((inv, i) => (
                    <tr key={inv.id} style={{ borderBottom: i < localInvoices.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{inv.number}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{inv.description || '—'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(inv.date, { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: inv.status === 'overdue' ? '#E74C3C' : 'var(--text-muted)' }}>{formatDate(inv.due_date, { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(inv.amount)}</td>
                      <td className="px-4 py-3">
                        <InvoiceStatusDropdown
                          status={inv.status as InvoiceStatus}
                          onChange={next => changeInvoiceStatus(inv.id, next)}
                          loading={statusChangingId === inv.id}
                        />
                      </td>
                    </tr>
                  ))}
                  {localInvoices.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Brak faktur</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Feedback detail modal ── */}
      <Modal
        open={!!feedbackModalData}
        onClose={() => setFeedbackModalData(null)}
        title="Feedback zawodnika"
        size="sm"
      >
        {feedbackModalData && <FeedbackDetail fb={feedbackModalData} />}
      </Modal>

      {/* ── Race Modal ── */}
      <Modal
        open={raceModalOpen}
        onClose={() => { setRaceModalOpen(false); setConfirmDeleteRaceId(null) }}
        title={editingRaceId ? 'Edytuj start' : 'Nowy start'}
        footer={
          <div className="flex gap-3">
            {editingRaceId && (
              confirmDeleteRaceId === editingRaceId ? (
                <div className="flex gap-2 items-center">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Na pewno usunąć?</span>
                  <button onClick={() => handleDeleteRace(editingRaceId)}
                    className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ background: 'rgba(231,76,60,0.15)', color: '#E74C3C' }}>Tak, usuń</button>
                  <button onClick={() => setConfirmDeleteRaceId(null)}
                    className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Nie</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteRaceId(editingRaceId)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                  style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>🗑 Usuń</button>
              )
            )}
            <Button className="flex-1" onClick={saveRace} disabled={!raceDraft.name.trim() || !raceDraft.date || raceSaving}>
              {raceSaving ? 'Zapisywanie...' : editingRaceId ? 'Zapisz zmiany' : 'Dodaj start'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Nazwa zawodów *</label>
            <input value={raceDraft.name} onChange={e => setRaceDraft(d => ({ ...d, name: e.target.value }))}
              placeholder="np. Maraton Warszawski 2026"
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Data *</label>
              <input type="date" value={raceDraft.date} onChange={e => setRaceDraft(d => ({ ...d, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Dystans</label>
              <input value={raceDraft.distance} onChange={e => setRaceDraft(d => ({ ...d, distance: e.target.value }))}
                placeholder="np. Maraton, 10 km"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Cel czasowy</label>
              <input value={raceDraft.goalTime} onChange={e => setRaceDraft(d => ({ ...d, goalTime: e.target.value }))}
                placeholder="np. 3:30:00"
                className="w-full px-3 py-2 rounded-xl text-sm font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Status</label>
              <select value={raceDraft.status} onChange={e => setRaceDraft(d => ({ ...d, status: e.target.value as RaceStatus }))}
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}>
                <option value="planned">Planowany</option>
                <option value="completed">Ukończony</option>
                <option value="dns">DNS</option>
                <option value="dnf">DNF</option>
              </select>
            </div>
          </div>
          {raceDraft.status === 'completed' && (
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Wynik</label>
              <input value={raceDraft.result} onChange={e => setRaceDraft(d => ({ ...d, result: e.target.value }))}
                placeholder="np. 3:24:15"
                className="w-full px-3 py-2 rounded-xl text-sm font-mono" style={inputStyle} />
            </div>
          )}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Notatki</label>
            <textarea value={raceDraft.notes} onChange={e => setRaceDraft(d => ({ ...d, notes: e.target.value }))}
              placeholder="Dodatkowe informacje..."
              rows={3} className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={inputStyle} />
          </div>
        </div>
      </Modal>

      {/* ── Invoice Modal ── */}
      <Modal
        open={invoiceModalOpen}
        onClose={closeInvoiceModal}
        title="Nowa faktura"
        footer={
          <Button className="w-full" onClick={saveInvoice} disabled={!invoiceDraft.amount || invoiceSaving}>
            {invoiceSaving ? 'Zapisywanie...' : 'Wystaw fakturę'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Opis</label>
            <input value={invoiceDraft.description} onChange={e => setInvoiceDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="np. Trening personalny — marzec 2026"
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Kwota (PLN) *</label>
              <input type="number" min="0" step="0.01" value={invoiceDraft.amount}
                onChange={e => setInvoiceDraft(d => ({ ...d, amount: e.target.value }))}
                placeholder="np. 500"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Termin płatności</label>
              <input type="date" value={invoiceDraft.dueDate} onChange={e => setInvoiceDraft(d => ({ ...d, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Załącznik (opcjonalnie, PDF / JPG / PNG)</label>
            <input
              ref={invoiceFileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-xs cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
          <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
            Pakiet: <span style={{ color: 'var(--text-primary)' }}>{athlete.package || '—'}</span>
            {!invoiceDraft.dueDate && <span className="ml-3">Brak terminu → +14 dni od dziś</span>}
          </div>
        </div>
      </Modal>

      {/* ── Session Modal ── */}
      <Modal
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title={editingSessionId ? 'Edytuj sesję' : 'Nowa sesja treningowa'}
        footer={sessionFooter}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Data</label>
            <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Typ treningu</label>
              <button onClick={openSessionTypeModal} className="text-xs cursor-pointer hover:opacity-80" style={{ color: 'var(--text-muted)' }}>⚙ Edytuj typy</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSessionTypes.map(t => (
                <button key={t.key} onClick={() => setDraft(d => ({ ...d, type: t.key }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${t.isBuiltin ? intensityColor(t.key as SessionType) : ''}`}
                  style={{
                    opacity: draft.type === t.key ? 1 : 0.4,
                    outline: draft.type === t.key ? '2px solid currentColor' : 'none',
                    outlineOffset: '1px',
                    ...(!t.isBuiltin && t.color ? { background: t.color + '33', color: t.color } : {}),
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Nazwa sesji *</label>
            <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="np. Rozbieganie 10 km"
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Opis / instrukcje</label>
            <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="Szczegóły treningu..." rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Dystans (km)</label>
              <input type="number" value={draft.plannedDistance} onChange={e => setDraft(d => ({ ...d, plannedDistance: e.target.value }))}
                placeholder="np. 10" min="0" step="0.1"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
              <input type="number" value={draft.plannedDuration} onChange={e => setDraft(d => ({ ...d, plannedDuration: e.target.value }))}
                placeholder="np. 60" min="0"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Tempo (/km)</label>
              <input value={draft.plannedPace} onChange={e => setDraft(d => ({ ...d, plannedPace: e.target.value }))}
                placeholder="np. 5:30"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Link (opcjonalny)</label>
            <input value={draft.url} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))}
              placeholder="np. https://www.trainerroad.com/..."
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          {draft.url && (
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Opis linku (opcjonalny)</label>
              <input value={draft.urlLabel} onChange={e => setDraft(d => ({ ...d, urlLabel: e.target.value }))}
                placeholder="np. Plan treningu w TrainerRoad"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          )}

          {/* Wyniki — widoczne przy edycji lub nowej sesji na datę przeszłą */}
          {(editingSessionId || (draftDate && draftDate < today)) && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Wyniki</div>
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, completed: !d.completed }))}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer w-full mb-3"
                style={{
                  background: draft.completed ? 'rgba(46,204,113,0.12)' : 'var(--bg-elevated)',
                  color: draft.completed ? '#2ECC71' : 'var(--text-muted)',
                  border: `1px solid ${draft.completed ? 'rgba(46,204,113,0.3)' : 'var(--border-mid)'}`,
                  justifyContent: 'flex-start',
                }}
              >
                <span>{draft.completed ? '✅' : '○'}</span>
                <span>Sesja wykonana</span>
              </button>
              {draft.completed && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Dystans rzeczywisty (km)</label>
                    <input type="number" value={draft.actualDistance}
                      onChange={e => setDraft(d => ({ ...d, actualDistance: e.target.value }))}
                      placeholder="np. 10.2" min="0" step="0.1"
                      className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
                    <input type="number" value={draft.actualDuration}
                      onChange={e => setDraft(d => ({ ...d, actualDuration: e.target.value }))}
                      placeholder="np. 65" min="0"
                      className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Tempo (/km)</label>
                    <input value={draft.actualPace}
                      onChange={e => setDraft(d => ({ ...d, actualPace: e.target.value }))}
                      placeholder="np. 5:20"
                      className="w-full px-3 py-2 rounded-xl text-sm font-mono" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Tętno śr. (bpm)</label>
                    <input type="number" value={draft.avgHr}
                      onChange={e => setDraft(d => ({ ...d, avgHr: e.target.value }))}
                      placeholder="np. 155" min="0"
                      className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Tętno max (bpm)</label>
                    <input type="number" value={draft.maxHr}
                      onChange={e => setDraft(d => ({ ...d, maxHr: e.target.value }))}
                      placeholder="np. 178" min="0"
                      className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Session Type Editor Modal ── */}
      <Modal
        open={sessionTypeModalOpen}
        onClose={() => setSessionTypeModalOpen(false)}
        title="Rodzaj treningu"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSessionTypeModalOpen(false)}>Anuluj</Button>
            <Button onClick={saveSessionTypeEdits}>Zapisz</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Built-in types — rename only */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Wbudowane typy</div>
            <div className="space-y-2">
              {BUILTIN_SESSION_TYPE_KEYS.map(key => (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${intensityColor(key)}`}
                    style={{ minWidth: 52, textAlign: 'center' }}>
                    ●
                  </span>
                  <input
                    value={editingBuiltinLabels[key] ?? labelOverrides[key] ?? sessionTypeLabel(key)}
                    onChange={e => setEditingBuiltinLabels(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Custom types */}
          {editingCustomTypes.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Własne typy</div>
              <div className="space-y-2">
                {editingCustomTypes.map((t, idx) => (
                  <div key={t.key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                    <input
                      value={t.label}
                      onChange={e => setEditingCustomTypes(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                      className="flex-1 px-3 py-2 rounded-xl text-sm"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={() => setEditingCustomTypes(prev => prev.filter((_, i) => i !== idx))}
                      className="text-xs px-2.5 py-2 rounded-xl cursor-pointer"
                      style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Dodaj własny typ</div>
            <input
              value={newTypeLabel}
              onChange={e => setNewTypeLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomType()}
              placeholder="Nazwa (np. Pływanie)"
              className="w-full px-3 py-2 rounded-xl text-sm mb-2"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_TYPE_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setNewTypeColor(c)}
                    className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
                    style={{ background: c, outline: newTypeColor === c ? '2px solid white' : 'none', outlineOffset: 2, boxShadow: newTypeColor === c ? `0 0 0 3px ${c}` : 'none' }} />
                ))}
              </div>
              <Button size="sm" onClick={addCustomType} disabled={!newTypeLabel.trim()}>+ Dodaj</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
