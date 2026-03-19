'use client'

import { startTransition, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import DOMPurify from 'dompurify'
import { Card } from '@/components/ui/Card'
import { updateAthlete } from '@/lib/actions/athletes'
import { ProfileEmptyState, ProfileStatusNotice } from '../ProfileStates'

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'h3', 'h4', 'p', 'br', 'div']
const ALLOWED_ATTR: string[] = []

function sanitize(html: string): string {
  if (typeof window === 'undefined') return html
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

interface NotesTabProps {
  athleteId: string
  initialNotes: string
}

// Toolbar button for the rich editor
function ToolbarBtn({ label, icon, command, active, onClick, bold, italic, underline, children }: {
  label: string; icon?: string; command?: string; active?: boolean; onClick?: () => void
  bold?: boolean; italic?: boolean; underline?: boolean; children?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        if (command) document.execCommand(command)
        if (onClick) onClick()
      }}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm cursor-pointer transition-all hover:bg-[var(--bg-hover)] shrink-0"
      style={{
        background: active ? 'rgba(255,92,27,0.12)' : 'transparent',
        color: active ? '#FF5C1B' : 'var(--text-muted)',
        fontWeight: bold ? 700 : undefined,
        fontStyle: italic ? 'italic' : undefined,
        textDecoration: underline ? 'underline' : undefined,
      }}
      title={label}
    >
      {children ?? icon}
    </button>
  )
}

export function NotesTab({ athleteId, initialNotes }: NotesTabProps) {
  const router = useRouter()
  const [coachNotes, setCoachNotes] = useState(initialNotes)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const getEditorContent = useCallback(() => {
    return editorRef.current?.innerHTML ?? ''
  }, [])

  async function saveNotes() {
    if (saving) return false
    const content = editing ? getEditorContent() : coachNotes
    setSaving(true)
    setError(null)
    const fd = new FormData()
    fd.set('id', athleteId)
    fd.set('coach_notes', content)
    try {
      const result = await updateAthlete(null, fd)
      if (result && 'error' in result) {
        setError(result.error ?? 'Nie udało się zapisać notatek.')
        return false
      }
      setCoachNotes(content)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      startTransition(() => router.refresh())
      return true
    } finally {
      setSaving(false)
    }
  }

  // Check if content has any visible text (strip tags)
  const hasContent = coachNotes.replace(/<[^>]*>/g, '').trim().length > 0

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
            <button onClick={() => { setEditing(false); setCoachNotes(initialNotes) }}
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
        hasContent ? (
          <div className="rounded-2xl p-4 min-h-32" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div
              className="text-sm prose-notes"
              style={{ color: 'var(--text-primary)', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: sanitize(coachNotes) }}
            />
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
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-t-2xl flex-wrap" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderBottom: 'none' }}>
            <ToolbarBtn label="Pogrubienie" icon="B" command="bold" bold />
            <ToolbarBtn label="Kursywa" icon="I" command="italic" italic />
            <ToolbarBtn label="Podkreślenie" icon="U" command="underline" underline />
            <div className="w-px h-5" style={{ background: 'var(--border)' }} />
            <ToolbarBtn label="Lista punktowa" icon="" onClick={() => document.execCommand('insertUnorderedList')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="4" r="1.5"/><rect x="6" y="3" width="8" height="2" rx="1"/><circle cx="3" cy="8" r="1.5"/><rect x="6" y="7" width="8" height="2" rx="1"/><circle cx="3" cy="12" r="1.5"/><rect x="6" y="11" width="8" height="2" rx="1"/></svg>
            </ToolbarBtn>
            <ToolbarBtn label="Lista numerowana" icon="" onClick={() => document.execCommand('insertOrderedList')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><text x="1" y="5.5" fontSize="5" fontWeight="700">1</text><rect x="6" y="3" width="8" height="2" rx="1"/><text x="1" y="9.5" fontSize="5" fontWeight="700">2</text><rect x="6" y="7" width="8" height="2" rx="1"/><text x="1" y="13.5" fontSize="5" fontWeight="700">3</text><rect x="6" y="11" width="8" height="2" rx="1"/></svg>
            </ToolbarBtn>
            <div className="w-px h-5" style={{ background: 'var(--border)' }} />
            <ToolbarBtn label="Nagłówek duży" icon="H1" onClick={() => document.execCommand('formatBlock', false, 'h3')} bold />
            <ToolbarBtn label="Nagłówek mały" icon="H2" onClick={() => document.execCommand('formatBlock', false, 'h4')} bold />
            <ToolbarBtn label="Zwykły tekst" icon="T" onClick={() => document.execCommand('formatBlock', false, 'p')} />
          </div>
          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="w-full px-4 py-3 rounded-b-2xl text-sm min-h-[280px] focus:outline-none prose-notes overflow-visible"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              lineHeight: 1.8,
            }}
            dangerouslySetInnerHTML={{ __html: sanitize(coachNotes) }}
          />
        </div>
      )}
      <style>{`
        .prose-notes ul, .prose-notes ol { padding-left: 1.5em; margin: 0.5em 0; }
        .prose-notes ul { list-style: disc; }
        .prose-notes ol { list-style: decimal; }
        .prose-notes li { margin: 0.2em 0; }
        .prose-notes h3 { font-size: 1.15em; font-weight: 700; margin: 1em 0 0.4em; }
        .prose-notes h4 { font-size: 1em; font-weight: 700; margin: 0.8em 0 0.3em; }
        .prose-notes p { margin: 0.3em 0; }
        .prose-notes b, .prose-notes strong { font-weight: 700; }
        .prose-notes i, .prose-notes em { font-style: italic; }
        .prose-notes u { text-decoration: underline; }
      `}</style>
    </Card>
  )
}
