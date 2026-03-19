'use client'

import { startTransition, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAthlete } from '@/lib/actions/athletes'
import { type AthleteInjuryRecord, getActiveAthleteInjuries, parseAthleteInjuryHistory } from '@/lib/athlete-injuries'
import { getBusinessToday } from '@/lib/date'
import { INPUT_STYLE } from '@/lib/styles'
import { formatDate } from '@/lib/utils'

const inputStyle = INPUT_STYLE

function todayInputValue(): string {
  return getBusinessToday()
}

function formatInjuryRange(startedAt: string | null, endedAt: string | null): string {
  const from = startedAt ? formatDate(startedAt, { day: 'numeric', month: 'short', year: 'numeric' }) : 'brak daty startu'
  if (!endedAt) return `od ${from}`
  return `${from} → ${formatDate(endedAt, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

interface InjuryEditorProps {
  athleteId: string
  injuryHistory: unknown
  legacyInjuries: string[] | null
}

export function InjuryEditor({ athleteId, injuryHistory, legacyInjuries }: InjuryEditorProps) {
  const router = useRouter()
  const initialHistory = parseAthleteInjuryHistory(injuryHistory, legacyInjuries)

  const [localInjuries, setLocalInjuries] = useState<AthleteInjuryRecord[]>(initialHistory)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [injuryInput, setInjuryInput] = useState('')
  const [injuryStartDate, setInjuryStartDate] = useState(todayInputValue())
  const injuryInputRef = useRef<HTMLInputElement>(null)

  const activeInjuries = getActiveAthleteInjuries(localInjuries)
  const closedInjuries = localInjuries.filter((injury) => !!injury.ended_at)

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    setSaved(false)
    const fd = new FormData()
    fd.set('id', athleteId)
    fd.set('injuries', JSON.stringify(activeInjuries.map((injury) => injury.name)))
    fd.set('injury_history', JSON.stringify(localInjuries))
    try {
      const result = await updateAthlete(null, fd)
      if (result && 'error' in result) {
        setError(result.error ?? 'Nie udało się zapisać historii kontuzji.')
        return
      }
      setSaved(true)
      setEditing(false)
      setInjuryInput('')
      setInjuryStartDate(todayInputValue())
      setTimeout(() => setSaved(false), 2000)
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setEditing(false)
    setLocalInjuries(parseAthleteInjuryHistory(injuryHistory, legacyInjuries))
    setInjuryInput('')
    setInjuryStartDate(todayInputValue())
  }

  function addInjury() {
    const name = injuryInput.trim()
    if (!name) return
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    setLocalInjuries((current) => [
      ...current,
      { id, name, started_at: injuryStartDate || todayInputValue(), ended_at: null },
    ])
    setInjuryInput('')
    setInjuryStartDate(todayInputValue())
    setTimeout(() => injuryInputRef.current?.focus(), 0)
  }

  function removeInjury(id: string) {
    setLocalInjuries((current) => current.filter((injury) => injury.id !== id))
  }

  function setInjuryEndDate(id: string, endedAt: string) {
    setLocalInjuries((current) => current.map((injury) => injury.id === id ? { ...injury, ended_at: endedAt || null } : injury))
  }

  return (
    <div className="pt-5" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold">Zdrowie i kontuzje</h4>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Dodawaj kontuzje z datą rozpoczęcia i zamykaj je datą zakończenia, żeby mieć pełną historię urazów.
          </p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
            Edytuj
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancel}
              className="px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              Anuluj
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: saved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: saved ? '#2ECC71' : 'white' }}>
              {saved ? '✓ Zapisano' : saving ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: '#E74C3C' }}>
          {error}
        </div>
      )}

      {!editing ? (
        localInjuries.length > 0 ? (
          <div className="space-y-4">
            {activeInjuries.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>Aktywne kontuzje</div>
                <div className="space-y-2">
                  {activeInjuries.map((injury) => (
                    <div key={injury.id} className="rounded-xl px-3 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                      <div className="text-sm font-semibold" style={{ color: '#FCA5A5' }}>{injury.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatInjuryRange(injury.started_at, injury.ended_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {closedInjuries.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>Historia kontuzji</div>
                <div className="space-y-2">
                  {closedInjuries.map((injury) => (
                    <div key={injury.id} className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div className="text-sm font-semibold">{injury.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatInjuryRange(injury.started_at, injury.ended_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Brak kontuzji w historii zawodnika</span>
        )
      ) : (
        <div className="space-y-4">
          {localInjuries.length > 0 && (
            <div className="space-y-3">
              {localInjuries.map((injury) => (
                <div key={injury.id} className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm font-semibold">{injury.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{injury.ended_at ? 'Kontuzja zakończona' : 'Kontuzja aktywna'}</div>
                    </div>
                    <button type="button" onClick={() => removeInjury(injury.id)} className="text-xs px-2.5 py-1 rounded-lg cursor-pointer" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                      Usuń
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Data rozpoczęcia</label>
                      <input type="date" value={injury.started_at ?? ''} onChange={(e) => setLocalInjuries((current) => current.map((item) => item.id === injury.id ? { ...item, started_at: e.target.value || null } : item))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Data zakończenia</label>
                      <input type="date" value={injury.ended_at ?? ''} onChange={(e) => setInjuryEndDate(injury.id, e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: 'var(--text-muted)' }}>Dodaj kontuzję</div>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_auto]">
              <input
                value={injuryInput}
                onChange={(e) => setInjuryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && injuryInput.trim()) {
                    e.preventDefault()
                    addInjury()
                  }
                }}
                ref={injuryInputRef}
                placeholder="np. Kolano lewe, ból pleców..."
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={inputStyle}
              />
              <input type="date" value={injuryStartDate} onChange={(e) => setInjuryStartDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
              <button type="button" onClick={addInjury} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                + Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
