'use client'

import React, { startTransition, useEffect, useState } from 'react'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { createRace, deleteRace, updateRace } from '@/lib/actions/races'
import type { CoachRaceRow } from '../types'
import { ProfileEmptyState, ProfileStatusNotice } from '../ProfileStates'
import { RaceModal } from './races/RaceModal'

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

const RACE_TABLE_COLUMNS = [
  { key: 'date', label: 'Data', width: '16%' },
  { key: 'name', label: 'Zawody', width: '24%' },
  { key: 'distance', label: 'Dystans', width: '12%' },
  { key: 'goal', label: 'Cel czasowy', width: '12%' },
  { key: 'result', label: 'Wynik', width: '12%' },
  { key: 'status', label: 'Status', width: '12%' },
  { key: 'notes', label: 'Notatki', width: '6%' },
  { key: 'actions', label: '', width: '6%' },
] as const

function RaceTable({ races: tableRaces, renderRow }: {
  races: CoachRaceRow[]
  renderRow: (race: CoachRaceRow, i: number) => React.ReactNode
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full text-sm table-fixed">
        <colgroup>
          {RACE_TABLE_COLUMNS.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
            {RACE_TABLE_COLUMNS.map((column) => (
              <th key={column.key} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRaces.map((race, i) => renderRow(race, i))}
        </tbody>
      </table>
    </div>
  )
}

interface RacesTabProps {
  athleteId: string
  races: CoachRaceRow[]
  today: string
}

export function RacesTab({ athleteId, races, today }: RacesTabProps) {
  const router = useRouter()
  const [localRaces, setLocalRaces] = useState(races)
  const [raceModalOpen, setRaceModalOpen] = useState(false)
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null)
  const [raceDraft, setRaceDraft] = useState<RaceDraft>({ name: '', date: '', distance: '', goalTime: '', result: '', status: 'planned', notes: '' })
  const [raceSaving, setRaceSaving] = useState(false)
  const [noteModalText, setNoteModalText] = useState<string | null>(null)
  const [plannedOpen, setPlannedOpen] = useState(true)
  const [finishedOpen, setFinishedOpen] = useState(true)
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()

  useEffect(() => {
    setLocalRaces(races)
  }, [races])

  function openNewRace() {
    setRaceDraft({ name: '', date: '', distance: '', goalTime: '', result: '', status: 'planned', notes: '' })
    setEditingRaceId(null)
    setRaceModalOpen(true)
  }

  function openEditRace(race: CoachRaceRow) {
    setRaceDraft({ name: race.name, date: race.date, distance: race.distance ?? '', goalTime: race.goal_time ?? '', result: race.result ?? '', status: race.status ?? 'planned', notes: race.notes ?? '' })
    setEditingRaceId(race.id)
    setRaceModalOpen(true)
  }

  async function saveRace() {
    if (!raceDraft.name.trim() || !raceDraft.date || raceSaving) return
    setRaceSaving(true)
    clearStatus()
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
      let result
      if (editingRaceId) {
        fd.set('id', editingRaceId)
        result = await updateRace(null, fd)
      } else {
        result = await createRace(null, fd)
      }

      if (result && 'error' in result) {
        showStatus('error', result.error ?? 'Nie udało się zapisać startu.')
        return
      }

      showStatus('success', editingRaceId ? 'Zmiany startu zostały zapisane.' : 'Start został dodany.')
      setRaceModalOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setRaceSaving(false)
    }
  }

  async function handleDeleteRace(id: string) {
    clearStatus()
    const result = await deleteRace(id, athleteId)
    if (result && 'error' in result) {
      showStatus('error', result.error ?? 'Nie udało się usunąć startu.')
      return
    }
    showStatus('success', 'Start został usunięty.')
    setRaceModalOpen(false)
    startTransition(() => router.refresh())
  }

  const plannedRaces = localRaces
    .filter(r => !r.status || r.status === 'planned')
    .slice().sort((a, b) => a.date.localeCompare(b.date))
  const finishedRaces = localRaces
    .filter(r => r.status && r.status !== 'planned')
    .slice().sort((a, b) => b.date.localeCompare(a.date))
  const nextRace = plannedRaces[0] ?? null
  const latestFinishedRace = finishedRaces[0] ?? null
  const daysToNextRace = nextRace
    ? Math.ceil((new Date(nextRace.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <>
      <div className="space-y-4">
        {statusMessage && (
          <ProfileStatusNotice tone={statusMessage.tone} text={statusMessage.text} />
        )}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h3 className="font-semibold">Podsumowanie startów</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Najbliższy planowany start i szybki kontekst sezonu zawodnika.
              </p>
            </div>
            <button onClick={openNewRace}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
              + Dodaj start
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.8fr)_minmax(200px,1fr)]">
            <div className="rounded-2xl px-4 py-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Najbliższy start
              </div>
              {nextRace ? (
                <>
                  <div className="text-base font-semibold">{nextRace.name}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(nextRace.date, { day: 'numeric', month: 'long', year: 'numeric' })}
                    {nextRace.distance ? ` • ${nextRace.distance}` : ''}
                  </div>
                  <div className="text-sm mt-2" style={{ color: '#FFB38F' }}>
                    {daysToNextRace !== null && daysToNextRace > 0 ? `Do startu zostało ${daysToNextRace} ${daysToNextRace === 1 ? 'dzień' : 'dni'}.` : 'Start jest dziś albo termin już minął.'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-base font-semibold">Brak zaplanowanego startu</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Dodaj najbliższe zawody, aby trener miał pełniejszy kontekst przygotowań.
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl px-4 py-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Cel czasowy
              </div>
              <div className="text-base font-semibold font-mono">
                {nextRace?.goal_time || '—'}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {nextRace ? 'Cel dla najbliższego startu.' : 'Dodaj start, aby ustawić cel czasowy.'}
              </div>
            </div>

            <div className="rounded-2xl px-4 py-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Kontekst sezonu
              </div>
              <div className="text-sm font-semibold">
                {plannedRaces.length} {plannedRaces.length === 1 ? 'planowany start' : plannedRaces.length < 5 ? 'planowane starty' : 'planowanych startów'}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {finishedRaces.length} {finishedRaces.length === 1 ? 'start zamknięty wynikiem' : finishedRaces.length < 5 ? 'starty zamknięte wynikiem' : 'startów zamkniętych wynikiem'}
              </div>
              {latestFinishedRace && (
                <div className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  Ostatni zamknięty: <span style={{ color: 'var(--text-primary)' }}>{latestFinishedRace.name}</span>
                  {latestFinishedRace.result ? ` • ${latestFinishedRace.result}` : ''}
                </div>
              )}
            </div>
          </div>
        </Card>
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
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {plannedRaces.length === 0 ? 'Dodaj pierwszy planowany start.' : 'Najbliższe zawody do monitorowania.'}
            </div>
          </div>
          {plannedOpen && (plannedRaces.length === 0 ? (
            <ProfileEmptyState
              icon="🏁"
              title="Brak zaplanowanych startów"
              description="Dodaj nadchodzące zawody, aby śledzić cele i przygotowania zawodnika."
              action={
                <button onClick={openNewRace}
                  className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                  + Dodaj pierwszy start
                </button>
              }
            />
          ) : (
            <RaceTable
              races={plannedRaces}
              renderRow={(race, i) => {
                const isPastDate = race.date < today
                const st = RACE_STATUS_INFO[(race.status as RaceStatus) || 'planned'] ?? RACE_STATUS_INFO.planned
                return (
                  <tr key={race.id} style={{ borderBottom: i < plannedRaces.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      <div className="text-xs" style={{ color: isPastDate ? '#F39C12' : 'var(--text-muted)' }}>
                        {formatDate(race.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {isPastDate && <div className="text-xs mt-0.5" style={{ color: '#F39C12', opacity: 0.8 }}>brak wyniku</div>}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium align-top break-words">{race.name}</td>
                    <td className="px-4 py-3 text-xs align-top" style={{ color: 'var(--text-muted)' }}>{race.distance || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono align-top" style={{ color: 'var(--text-muted)' }}>{race.goal_time || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono align-top" style={{ color: 'var(--text-muted)' }}>—</td>
                    <td className="px-4 py-3 text-xs align-top">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${st.color}22`, color: st.color }}>
                        {st.label}
                      </span>
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
            <ProfileEmptyState
              icon="📋"
              title="Brak zamkniętych startów"
              description="Po zawodach zmień status startu na ukończony, DNS albo DNF, aby historia była kompletna."
            />
          ) : (
            <RaceTable
              races={finishedRaces}
              renderRow={(race, i) => {
                const st = RACE_STATUS_INFO[(race.status as RaceStatus)] ?? RACE_STATUS_INFO.completed
                return (
                  <tr key={race.id} style={{ borderBottom: i < finishedRaces.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap align-top" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(race.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium align-top break-words">{race.name}</td>
                    <td className="px-4 py-3 text-xs align-top" style={{ color: 'var(--text-muted)' }}>{race.distance || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono align-top" style={{ color: 'var(--text-muted)' }}>{race.goal_time || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono font-medium align-top">{race.result || '—'}</td>
                    <td className="px-4 py-3 text-xs align-top">
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

      <RaceModal
        open={raceModalOpen}
        onClose={() => setRaceModalOpen(false)}
        editingRaceId={editingRaceId}
        draft={raceDraft}
        onDraftChange={setRaceDraft}
        saving={raceSaving}
        onSave={saveRace}
        onDelete={(id) => void handleDeleteRace(id)}
      />
    </>
  )
}
