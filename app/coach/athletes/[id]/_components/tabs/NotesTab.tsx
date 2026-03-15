'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { updateAthlete } from '@/lib/actions/athletes'

const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }

interface NotesTabProps {
  athleteId: string
  initialNotes: string
}

export function NotesTab({ athleteId, initialNotes }: NotesTabProps) {
  const router = useRouter()
  const [coachNotes, setCoachNotes] = useState(initialNotes)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveNotes() {
    const fd = new FormData()
    fd.set('id', athleteId)
    fd.set('coach_notes', coachNotes)
    await updateAthlete(null, fd)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    startTransition(() => router.refresh())
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
              onClick={async () => { await saveNotes(); setEditing(false) }}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: saved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: saved ? '#2ECC71' : 'white' }}
            >{saved ? '✓ Zapisano' : 'Zapisz'}</button>
          </div>
        )}
      </div>
      {!editing ? (
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
  )
}
