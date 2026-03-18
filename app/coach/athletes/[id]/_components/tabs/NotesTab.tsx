'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { updateAthlete } from '@/lib/actions/athletes'
import { INPUT_STYLE } from '@/lib/styles'
import { ProfileEmptyState, ProfileStatusNotice } from '../ProfileStates'

const inputStyle = INPUT_STYLE

interface NotesTabProps {
  athleteId: string
  initialNotes: string
}

export function NotesTab({ athleteId, initialNotes }: NotesTabProps) {
  const router = useRouter()
  const [coachNotes, setCoachNotes] = useState(initialNotes)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveNotes() {
    if (saving) return false
    setSaving(true)
    setError(null)
    const fd = new FormData()
    fd.set('id', athleteId)
    fd.set('coach_notes', coachNotes)
    try {
      const result = await updateAthlete(null, fd)
      if (result && 'error' in result) {
        setError(result.error ?? 'Nie udało się zapisać notatek.')
        return false
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      startTransition(() => router.refresh())
      return true
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Notatki trenera</h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
          >Edytuj</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)}
              className="px-3 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Anuluj</button>
            <button
              onClick={async () => {
                const ok = await saveNotes()
                if (ok) setEditing(false)
              }}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: saved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: saved ? '#2ECC71' : 'white' }}
            >{saved ? '✓ Zapisano' : saving ? 'Zapisywanie...' : 'Zapisz'}</button>
          </div>
        )}
      </div>
      {error && (
        <div className="mb-4">
          <ProfileStatusNotice tone="error" text={error} />
        </div>
      )}
      {!editing ? (
        coachNotes ? (
          <div className="text-sm whitespace-pre-wrap min-h-16" style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}>
            {coachNotes}
          </div>
        ) : (
          <ProfileEmptyState
            icon="📝"
            title="Brak notatek trenera"
            description="Dodaj najważniejsze obserwacje, ustalenia i kontekst współpracy, żeby mieć je zawsze pod ręką."
          />
        )
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
  )
}
