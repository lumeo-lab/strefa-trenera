'use client'
import { useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { athletes, sessions as initialSessions } from '@/lib/data'
import { Session, SessionType } from '@/lib/types'
import { getWeekDays, toISODate, dayName, intensityColor, sessionTypeLabel, formatDate, isToday } from '@/lib/utils'

const SESSION_TYPES: SessionType[] = ['easy', 'interval', 'tempo', 'long', 'rest', 'gym']

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedAthleteId, setSelectedAthleteId] = useState('a1')
  const [sessions, setSessions] = useState(initialSessions)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [form, setForm] = useState({ type: 'easy' as SessionType, title: '', description: '', plannedDistance: '', plannedDuration: '', plannedPace: '' })

  const weekDays = getWeekDays(weekOffset)
  const weekStart = toISODate(weekDays[0])
  const weekEnd = toISODate(weekDays[6])

  const weekSessions = sessions.filter(s => s.athleteId === selectedAthleteId && s.date >= weekStart && s.date <= weekEnd)

  function openCreateModal(date: string) {
    setEditSession(null)
    setSelectedDate(date)
    setForm({ type: 'easy', title: '', description: '', plannedDistance: '', plannedDuration: '', plannedPace: '' })
    setModalOpen(true)
  }

  function openEditModal(session: Session) {
    setEditSession(session)
    setForm({
      type: session.type,
      title: session.title,
      description: session.description,
      plannedDistance: session.plannedDistance?.toString() || '',
      plannedDuration: session.plannedDuration?.toString() || '',
      plannedPace: session.plannedPace || '',
    })
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.title) return
    if (editSession) {
      setSessions(prev => prev.map(s => s.id === editSession.id ? {
        ...s, ...form,
        plannedDistance: form.plannedDistance ? parseFloat(form.plannedDistance) : undefined,
        plannedDuration: form.plannedDuration ? parseInt(form.plannedDuration) : undefined,
        plannedPace: form.plannedPace || undefined,
      } : s))
    } else {
      const newSession: Session = {
        id: `s${Date.now()}`, athleteId: selectedAthleteId, date: selectedDate,
        type: form.type, title: form.title, description: form.description,
        plannedDistance: form.plannedDistance ? parseFloat(form.plannedDistance) : undefined,
        plannedDuration: form.plannedDuration ? parseInt(form.plannedDuration) : undefined,
        plannedPace: form.plannedPace || undefined,
        completed: false,
      }
      setSessions(prev => [...prev, newSession])
    }
    setModalOpen(false)
  }

  function handleDelete() {
    if (!editSession) return
    setSessions(prev => prev.filter(s => s.id !== editSession.id))
    setModalOpen(false)
  }

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId)

  return (
    <div>
      <CoachTopbar
        title="Planer treningowy"
        subtitle={selectedAthlete?.name}
        actions={
          <select
            value={selectedAthleteId}
            onChange={e => setSelectedAthleteId(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl cursor-pointer"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
          >
            {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        }
      />

      <div className="p-6">
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
                {/* Day header */}
                <div className={`text-center mb-2 py-2 rounded-xl ${todayFlag ? 'text-orange-400' : ''}`}
                  style={{ background: todayFlag ? 'rgba(255,92,27,0.1)' : undefined }}>
                  <div className="text-xs uppercase font-semibold" style={{ color: todayFlag ? '#FF5C1B' : 'var(--text-muted)' }}>
                    {dayName(day, true)}
                  </div>
                  <div className={`text-lg font-bold ${todayFlag ? 'text-orange-400' : ''}`}>{day.getDate()}</div>
                </div>

                {/* Sessions */}
                <div className="space-y-2">
                  {daySessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => openEditModal(session)}
                      className={`w-full text-left p-2 rounded-xl border text-xs transition-all hover:opacity-90 cursor-pointer ${intensityColor(session.type)}`}
                    >
                      <div className="font-semibold truncate">{session.title}</div>
                      {session.plannedDistance && <div className="opacity-70">{session.plannedDistance} km</div>}
                      {session.plannedDuration && !session.plannedDistance && <div className="opacity-70">{session.plannedDuration} min</div>}
                      {session.completed && <div className="text-green-400 text-xs">✓ wykonany</div>}
                    </button>
                  ))}

                  {/* Add button */}
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
      </div>

      {/* Session Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSession ? 'Edytuj sesję' : `Nowa sesja — ${selectedDate ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Typ sesji</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as SessionType }))}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
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
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
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
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Dystans (km)</label>
              <input
                type="number"
                value={form.plannedDistance}
                onChange={e => setForm(f => ({ ...f, plannedDistance: e.target.value }))}
                placeholder="np. 12"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
              <input
                type="number"
                value={form.plannedDuration}
                onChange={e => setForm(f => ({ ...f, plannedDuration: e.target.value }))}
                placeholder="np. 70"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Tempo (min/km)</label>
              <input
                value={form.plannedPace}
                onChange={e => setForm(f => ({ ...f, plannedPace: e.target.value }))}
                placeholder="np. 5:00"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              {editSession && <Button variant="danger" size="sm" onClick={handleDelete}>Usuń sesję</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Anuluj</Button>
              <Button onClick={handleSave} disabled={!form.title}>Zapisz</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
