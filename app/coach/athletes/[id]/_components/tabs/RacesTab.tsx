'use client'

import React, { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { DbRow } from '@/lib/types'
import { createRace, updateRace, deleteRace } from '@/lib/actions/races'

const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }

type RaceStatus = 'planned' | 'completed' | 'dns' | 'dnf'

const RACE_STATUS_INFO: Record<RaceStatus, { label: string; color: string }> = {
  planned:   { label: 'Planowany', color: 'var(--text-muted)' },
  completed: { label: 'Ukończony', color: '#2ECC71' },
  dns:       { label: 'DNS',       color: '#E74C3C' },
  dnf:       { label: 'DNF',       color: '#F39C12' },
}

function RaceNoteCell({ notes, onOpen }: { notes?: string | null; onOpen: () => void }) {
  return (
    <td className="px-4 py-3 text-xs">
      {notes
        ? <button onClick={onOpen} className="cursor-pointer text-base leading-none" title="Pokaż notatkę">📝</button>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>
      }
    </td>
  )
}

interface RaceDraft { name: string; date: string; distance: string; goalTime: string; result: string; status: RaceStatus; notes: string }

interface RacesTabProps {
  athleteId: string
  races: DbRow[]
  today: string
}

export function RacesTab({ athleteId, races, today }: RacesTabProps) {
  const router = useRouter()
  const [raceModalOpen, setRaceModalOpen] = useState(false)
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null)
  const [raceDraft, setRaceDraft] = useState<RaceDraft>({ name: '', date: '', distance: '', goalTime: '', result: '', status: 'planned', notes: '' })
  const [raceSaving, setRaceSaving] = useState(false)
  const [confirmDeleteRaceId, setConfirmDeleteRaceId] = useState<string | null>(null)
  const [noteModalText, setNoteModalText] = useState<string | null>(null)
  const [plannedOpen, setPlannedOpen] = useState(true)
  const [finishedOpen, setFinishedOpen] = useState(true)

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
      fd.set('athlete_id', athleteId)
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
    await deleteRace(id, athleteId)
    setConfirmDeleteRaceId(null)
    setRaceModalOpen(false)
    startTransition(() => router.refresh())
  }

  const plannedRaces = races
    .filter(r => !r.status || r.status === 'planned')
    .slice().sort((a, b) => a.date.localeCompare(b.date))
  const finishedRaces = races
    .filter(r => r.status && r.status !== 'planned')
    .slice().sort((a, b) => b.date.localeCompare(a.date))

  const RaceTable = ({ races: tableRaces, columns, renderRow }: {
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
          {tableRaces.map((race, i) => renderRow(race, i))}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      <div className="space-y-4">
        {/* Planowane */}
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
                    <RaceNoteCell notes={race.notes} onOpen={() => setNoteModalText(race.notes ?? '')} />
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

        {/* Ukończone */}
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
                    <RaceNoteCell notes={race.notes} onOpen={() => setNoteModalText(race.notes ?? '')} />
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

      {/* Race note modal */}
      {noteModalText !== null && (
        <Modal open={true} onClose={() => setNoteModalText(null)} title="Notatka" size="sm">
          <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {noteModalText}
          </div>
        </Modal>
      )}

      {/* Race Modal */}
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
    </>
  )
}
