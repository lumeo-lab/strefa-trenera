'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAthlete } from '@/lib/actions/athletes'
import { INPUT_STYLE } from '@/lib/styles'

const inputStyle = INPUT_STYLE
const DEFAULT_PB_DISTANCES = ['5 km', '10 km', 'Półmaraton', 'Maraton']

interface PersonalBestsEditorProps {
  athleteId: string
  personalBests: Record<string, string> | null
}

export function PersonalBestsEditor({ athleteId, personalBests }: PersonalBestsEditorProps) {
  const router = useRouter()
  const savedDistances = Object.keys(personalBests ?? {})
  const initialDistances = [
    ...DEFAULT_PB_DISTANCES,
    ...savedDistances.filter((d) => !DEFAULT_PB_DISTANCES.includes(d)),
  ]

  const [pbDistances, setPbDistances] = useState(initialDistances)
  const [newPbDistance, setNewPbDistance] = useState('')
  const [editing, setEditing] = useState(false)
  const [pbEdit, setPbEdit] = useState<Record<string, string>>(
    Object.fromEntries(initialDistances.map((d) => [d, (personalBests ?? {})[d] ?? ''])),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    setSaved(false)
    const fd = new FormData()
    fd.set('id', athleteId)
    fd.set('personal_bests', JSON.stringify(Object.fromEntries(Object.entries(pbEdit).filter(([, v]) => v.trim()))))
    try {
      const result = await updateAthlete(null, fd)
      if (result && 'error' in result) {
        setError(result.error ?? 'Nie udało się zapisać rekordów życiowych.')
        return
      }
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setEditing(false)
    setPbDistances(initialDistances)
    setPbEdit(Object.fromEntries(initialDistances.map((d) => [d, (personalBests ?? {})[d] ?? ''])))
    setNewPbDistance('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">Rekordy życiowe</h4>
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
        <div className="space-y-3 text-sm">
          {pbDistances.map((dist) => (
            <div key={dist} className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>{dist}</span>
              <span className="font-mono font-medium">{pbEdit[dist] || '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Format: 3:52:00 lub 22:30</p>
          {pbDistances.map((dist) => (
            <div key={dist}>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{dist}</label>
              <input value={pbEdit[dist] ?? ''} onChange={(e) => setPbEdit((p) => ({ ...p, [dist]: e.target.value }))} placeholder="np. 22:30" className="w-full px-3 py-2 rounded-xl text-sm font-mono" style={inputStyle} />
            </div>
          ))}
          <div>
            <input
              value={newPbDistance}
              onChange={(e) => setNewPbDistance(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newPbDistance.trim()) {
                  e.preventDefault()
                  const dist = newPbDistance.trim()
                  if (!pbDistances.includes(dist)) {
                    setPbDistances((d) => [...d, dist])
                    setPbEdit((p) => ({ ...p, [dist]: '' }))
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
    </div>
  )
}
