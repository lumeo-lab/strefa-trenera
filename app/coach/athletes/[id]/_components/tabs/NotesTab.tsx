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
  const noteTemplates = [
    'Cele na najbliższe 2 tygodnie',
    'Ryzyka / sygnały ostrzegawcze',
    'Ustalenia po ostatniej rozmowie',
    'Co monitorować w planie',
  ]

  function insertTemplate(label: string) {
    const section = `${coachNotes.trim() ? '\n\n' : ''}${label}\n- `
    setCoachNotes((current) => `${current}${section}`)
    setEditing(true)
  }

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
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h3 className="font-semibold">Notatki trenera</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Miejsce na ustalenia, obserwacje i priorytety pracy z zawodnikiem.
          </p>
        </div>
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
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.78fr)_minmax(260px,0.22fr)]">
        <div>
          {!editing ? (
            coachNotes ? (
              <div className="rounded-2xl p-4 min-h-32" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)', lineHeight: 1.8 }}>
                  {coachNotes}
                </div>
              </div>
            ) : (
              <ProfileEmptyState
                icon="📝"
                title="Brak notatek trenera"
                description="Dodaj najważniejsze obserwacje, ustalenia i kontekst współpracy, żeby mieć je zawsze pod ręką."
              />
            )
          ) : (
            <div>
              <textarea
                value={coachNotes}
                onChange={e => setCoachNotes(e.target.value)}
                placeholder="Zapisz obserwacje, uwagi, przemyślenia o zawodniku..."
                rows={14}
                className="w-full px-4 py-3 rounded-2xl text-sm resize-none"
                style={inputStyle}
              />
              <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {coachNotes.trim().length} znaków
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>
              Szybkie sekcje
            </div>
            <div className="space-y-2">
              {noteTemplates.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => insertTemplate(template)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  + {template}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>
              Dobre notatki
            </div>
            <div className="text-xs space-y-2" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <p>Zapisuj decyzje, nie tylko luźne myśli.</p>
              <p>Oddzielaj obserwacje od planu działania.</p>
              <p>Po rozmowie z zawodnikiem wpisz krótko: ustalenie, ryzyko, kolejny krok.</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
