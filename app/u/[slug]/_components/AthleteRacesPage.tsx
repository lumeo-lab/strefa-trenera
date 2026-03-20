'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AthleteSession } from '@/lib/athlete-auth'
import type { AthleteRaceRow } from '@/lib/athlete-data'
import { createAthleteRace, deleteAthleteRace, updateAthleteRace } from '@/lib/actions/athlete-races'
import { Modal } from '@/components/ui/Modal'
import { INPUT_STYLE } from '@/lib/styles'
import { AthleteBottomNav } from './AthleteBottomNav'
import { getBusinessToday } from '@/lib/date'
import { formatDate } from '@/lib/utils'

interface Props {
  athlete: AthleteSession
  races: AthleteRaceRow[]
}

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Zaplanowane' },
  { value: 'confirmed', label: 'Potwierdzone' },
  { value: 'completed', label: 'Ukończone' },
  { value: 'dns', label: 'DNS' },
  { value: 'dnf', label: 'DNF' },
]

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.label ?? status
}

function statusColor(status: string): { bg: string; color: string } {
  switch (status) {
    case 'completed': return { bg: 'rgba(46,204,113,0.1)', color: '#2ECC71' }
    case 'dns': case 'dnf': return { bg: 'rgba(248,113,113,0.08)', color: '#f87171' }
    case 'confirmed': return { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' }
    default: return { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' }
  }
}

export function AthleteRacesPage({ athlete, races }: Props) {
  const router = useRouter()
  const today = getBusinessToday()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRace, setEditingRace] = useState<AthleteRaceRow | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const upcoming = races.filter(r => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = races.filter(r => r.date < today)

  function openNew() {
    setEditingRace(null)
    setModalOpen(true)
  }

  function openEdit(race: AthleteRaceRow) {
    setEditingRace(race)
    setModalOpen(true)
  }

  async function handleDelete(raceId: string) {
    if (!confirm('Na pewno usunąć te zawody?')) return
    setDeleting(raceId)
    await deleteAthleteRace(athlete.slug, raceId)
    setDeleting(null)
    router.refresh()
  }

  function handleSaved() {
    setModalOpen(false)
    setEditingRace(null)
    router.refresh()
  }

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/u/${athlete.slug}/profile`} className="text-sm" style={{ color: 'var(--text-muted)' }}>← Profil</Link>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Zawody</h1>
          <button onClick={openNew}
            className="text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold"
            style={{ background: '#FF5C1B', color: '#fff', border: 'none' }}>
            + Dodaj
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {races.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3">🏆</div>
            <div className="font-medium mb-1">Brak zawodów</div>
            <div className="text-sm">Dodaj swoje nadchodzące zawody</div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Nadchodzące ({upcoming.length})
            </div>
            <div className="space-y-2">
              {upcoming.map(r => (
                <RaceCard key={r.id} race={r} onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)} deleting={deleting === r.id} />
              ))}
            </div>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Zakończone ({past.length})
            </div>
            <div className="space-y-2">
              {past.map(r => (
                <RaceCard key={r.id} race={r} onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)} deleting={deleting === r.id} />
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <RaceFormModal
          slug={athlete.slug}
          race={editingRace}
          onClose={() => { setModalOpen(false); setEditingRace(null) }}
          onSaved={handleSaved}
        />
      )}

      <AthleteBottomNav slug={athlete.slug} athleteName={athlete.name} athleteAvatar={athlete.avatar} />
    </div>
  )
}

function RaceCard({ race, onEdit, onDelete, deleting }: {
  race: AthleteRaceRow
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const sc = statusColor(race.status)
  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(race.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div className="font-semibold text-sm mt-0.5">{race.name}</div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 font-medium" style={{ background: sc.bg, color: sc.color }}>
          {statusLabel(race.status)}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {race.distance && <span>📏 {race.distance}</span>}
        {race.goal_time && <span>🎯 Cel: {race.goal_time}</span>}
        {race.result && <span>🏁 Wynik: {race.result}</span>}
      </div>
      {race.notes && <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{race.notes}</p>}
      <div className="flex gap-2 mt-3">
        <button onClick={onEdit} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: 'none' }}>
          Edytuj
        </button>
        <button onClick={onDelete} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
          style={{ background: 'none', color: '#f87171', border: 'none' }}>
          {deleting ? '...' : 'Usuń'}
        </button>
      </div>
    </div>
  )
}

function RaceFormModal({ slug, race, onClose, onSaved }: {
  slug: string
  race: AthleteRaceRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(race?.name ?? '')
  const [date, setDate] = useState(race?.date ?? '')
  const [distance, setDistance] = useState(race?.distance ?? '')
  const [goalTime, setGoalTime] = useState(race?.goal_time ?? '')
  const [result, setResult] = useState(race?.result ?? '')
  const [status, setStatus] = useState(race?.status ?? 'planned')
  const [notes, setNotes] = useState(race?.notes ?? '')

  async function handleSave() {
    if (!name.trim() || !date) return
    setSaving(true)
    setError(null)
    const data = {
      name: name.trim(),
      date,
      distance: distance.trim() || undefined,
      goal_time: goalTime.trim() || undefined,
      result: result.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    }
    const res = race
      ? await updateAthleteRace(slug, race.id, data)
      : await createAthleteRace(slug, data)

    setSaving(false)
    if ('error' in res) { setError(res.error); return }
    onSaved()
  }

  const footer = (
    <div>
      {error && (
        <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)' }}>{error}</p>
      )}
      <button onClick={handleSave} disabled={saving || !name.trim() || !date}
        className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
        style={{ background: '#FF5C1B', color: '#fff', border: 'none' }}>
        {saving ? 'Zapisywanie...' : race ? 'Zaktualizuj' : 'Dodaj zawody'}
      </button>
    </div>
  )

  return (
    <Modal open onClose={onClose} title={race ? 'Edytuj zawody' : 'Nowe zawody'} size="sm" footer={footer}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Nazwa *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="np. Maraton Warszawski"
            className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Data *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Dystans</label>
            <input value={distance} onChange={e => setDistance(e.target.value)} placeholder="np. 42.195 km"
              className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Cel czasowy</label>
            <input value={goalTime} onChange={e => setGoalTime(e.target.value)} placeholder="np. 3:30:00"
              className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Wynik</label>
            <input value={result} onChange={e => setResult(e.target.value)} placeholder="np. 3:28:15"
              className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setStatus(s.value)}
                className="px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                style={{
                  background: status === s.value ? 'rgba(255,92,27,0.12)' : 'var(--bg-subtle)',
                  border: status === s.value ? '1px solid rgba(255,92,27,0.4)' : '1px solid transparent',
                  color: status === s.value ? '#FF5C1B' : 'var(--text-muted)',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Notatki</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dodatkowe informacje..."
            rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" style={INPUT_STYLE} />
        </div>
      </div>
    </Modal>
  )
}
