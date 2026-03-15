'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { DbRow } from '@/lib/types'
import { SessionType } from '@/lib/types'
import { getWeekDays, toISODate, dayName, intensityColor, sessionTypeLabel, formatDate, isToday } from '@/lib/utils'
import { createSession, updateSession, deleteSession } from '@/lib/actions/sessions'

const SESSION_TYPES: SessionType[] = ['easy', 'interval', 'tempo', 'long', 'rest', 'gym']

const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }

interface Props {
  athletes: DbRow[]
  sessions: DbRow[]
}

export function PlannerClient({ athletes, sessions: initialSessions }: Props) {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id ?? '')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<DbRow | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: 'easy' as SessionType,
    title: '',
    description: '',
    planned_distance: '',
    planned_duration: '',
    planned_pace: '',
  })

  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])

  const weekSessions = initialSessions.filter(
    s => s.athlete_id === selectedAthleteId && s.date >= weekStart && s.date <= weekEnd
  )

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId)

  function openCreateModal(date: string) {
    setEditingSession(null)
    setSelectedDate(date)
    setForm({ type: 'easy', title: '', description: '', planned_distance: '', planned_duration: '', planned_pace: '' })
    setModalOpen(true)
  }

  function openEditModal(session: DbRow) {
    setEditingSession(session)
    setForm({
      type: session.type,
      title: session.title,
      description: session.description ?? '',
      planned_distance: session.planned_distance?.toString() ?? '',
      planned_duration: session.planned_duration?.toString() ?? '',
      planned_pace: session.planned_pace ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title || saving) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set('athlete_id', selectedAthleteId)
      fd.set('date', editingSession ? editingSession.date : selectedDate)
      fd.set('type', form.type)
      fd.set('title', form.title)
      fd.set('description', form.description)
      if (form.planned_distance) fd.set('planned_distance', form.planned_distance)
      if (form.planned_duration) fd.set('planned_duration', form.planned_duration)
      if (form.planned_pace) fd.set('planned_pace', form.planned_pace)

      if (editingSession) {
        fd.set('id', editingSession.id)
        await updateSession(null, fd)
      } else {
        await createSession(null, fd)
      }
      setModalOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingSession || saving) return
    setSaving(true)
    try {
      await deleteSession(editingSession.id, selectedAthleteId)
      setModalOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <CoachTopbar
        title="Planer treningowy"
        subtitle={selectedAthlete?.name}
        actions={
          athletes.length > 0 ? (
            <select
              value={selectedAthleteId}
              onChange={e => setSelectedAthleteId(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl cursor-pointer"
              style={inputStyle}
            >
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          ) : undefined
        }
      />

      <div className="p-6">
        {athletes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👟</div>
            <div className="text-sm font-medium mb-1">Brak zawodników</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Dodaj zawodnika w zakładce Zawodnicy, aby zacząć planować treningi.
            </div>
          </div>
        ) : (
          <>
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setWeekOffset(w => w - 1)}>← Poprzedni</Button>
                <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>Dziś</Button>
                <Button variant="secondary" size="sm" onClick={() => setWeekOffset(w => w + 1)}>Następny →</Button>
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {formatDate(weekStart, { day: 'numeric', month: 'long' })} — {formatDate(weekEnd, { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Week grid */}
            <div className="grid grid-cols-7 gap-3">
              {weekDays.map(day => {
                const dateStr = toISODate(day)
                const daySessions = weekSessions.filter(s => s.date === dateStr)
                const todayFlag = isToday(dateStr)

                return (
                  <div key={dateStr} className="min-h-48">
                    <div className={`text-center mb-2 py-2 rounded-xl ${todayFlag ? 'text-orange-400' : ''}`}
                      style={{ background: todayFlag ? 'rgba(255,92,27,0.1)' : undefined }}>
                      <div className="text-xs uppercase font-semibold" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-muted)' }}>
                        {dayName(day, true)}
                      </div>
                      <div className={`text-lg font-bold ${todayFlag ? 'text-orange-400' : ''}`}>{day.getDate()}</div>
                    </div>

                    <div className="space-y-2">
                      {daySessions.map(session => (
                        <button
                          key={session.id}
                          onClick={() => openEditModal(session)}
                          className={`w-full text-left p-2 rounded-xl border text-xs transition-all hover:opacity-90 cursor-pointer ${intensityColor(session.type)}`}
                        >
                          <div className="font-semibold truncate">{session.title}</div>
                          {session.planned_distance && <div className="opacity-70">{session.planned_distance} km</div>}
                          {session.planned_duration && !session.planned_distance && <div className="opacity-70">{session.planned_duration} min</div>}
                          {session.completed && <div className="text-green-400 text-xs">✓ wykonany</div>}
                        </button>
                      ))}

                      <button
                        onClick={() => openCreateModal(dateStr)}
                        className="w-full py-1.5 rounded-xl text-xs border border-dashed transition-colors hover:border-orange-500/50 hover:text-orange-400 cursor-pointer"
                        style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6 flex-wrap">
              {SESSION_TYPES.map(type => (
                <div key={type} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${intensityColor(type)}`}>
                  {sessionTypeLabel(type)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Session Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSession ? 'Edytuj sesję' : `Nowa sesja — ${selectedDate ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Typ sesji</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as SessionType }))}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={inputStyle}
              >
                {SESSION_TYPES.map(t => <option key={t} value={t}>{sessionTypeLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Tytuł *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="np. Interwały 5x1km"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Opis</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Szczegóły sesji..."
              className="w-full px-3 py-2 rounded-xl text-sm resize-none"
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Dystans (km)</label>
              <input
                type="number"
                value={form.planned_distance}
                onChange={e => setForm(f => ({ ...f, planned_distance: e.target.value }))}
                placeholder="np. 12"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
              <input
                type="number"
                value={form.planned_duration}
                onChange={e => setForm(f => ({ ...f, planned_duration: e.target.value }))}
                placeholder="np. 70"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Tempo (min/km)</label>
              <input
                value={form.planned_pace}
                onChange={e => setForm(f => ({ ...f, planned_pace: e.target.value }))}
                placeholder="np. 5:00"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              {editingSession && <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>Usuń sesję</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Anuluj</Button>
              <Button onClick={handleSave} disabled={!form.title || saving}>
                {saving ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
