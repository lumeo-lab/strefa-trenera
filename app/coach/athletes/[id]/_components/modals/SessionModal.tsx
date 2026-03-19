'use client'

import React, { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { createSession, deleteSession as deleteSessionAction, updateSession } from '@/lib/actions/sessions'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'
import { INPUT_STYLE } from '@/lib/styles'
import { SessionTypeEditor } from './SessionTypeEditor'
import type { CoachTrainingSessionRow } from '../types'

const inputStyle = INPUT_STYLE

interface SessionDraft {
  title: string; type: string; description: string
  plannedDistance: string; plannedDuration: string; plannedPace: string; url: string; urlLabel: string
}

const emptyDraft = (): SessionDraft => ({
  title: '', type: 'easy', description: '', plannedDistance: '', plannedDuration: '', plannedPace: '', url: '', urlLabel: '',
})

interface SessionModalProps {
  open: boolean
  onClose: () => void
  athleteId: string
  editSession?: CoachTrainingSessionRow | null
  initialDate?: string
  onActionComplete?: (notice: { tone: 'success' | 'error'; text: string }) => void
}

export function SessionModal({ open, onClose, athleteId, editSession, initialDate, onActionComplete }: SessionModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { all: allSessionTypes } = useCustomSessionTypes()

  const [sessionTypeModalOpen, setSessionTypeModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [editingSessionId] = useState<string | null>(editSession?.id ?? null)
  const [draftDate] = useState(editSession?.date ?? initialDate ?? '')
  const [draft, setDraft] = useState<SessionDraft>(() => {
    if (editSession) {
      return {
        title: editSession.title,
        type: editSession.type,
        description: editSession.description || '',
        plannedDistance: editSession.planned_distance?.toString() ?? '',
        plannedDuration: editSession.planned_duration?.toString() ?? '',
        plannedPace: editSession.planned_pace ?? '',
        url: editSession.url ?? '',
        urlLabel: editSession.url_label ?? '',
      }
    }
    return emptyDraft()
  })

  async function persistSession(options?: {
    date?: string
    duplicate?: boolean
    successText?: string
  }) {
    if (saving) return
    const targetDate = options?.date ?? draftDate
    const duplicate = options?.duplicate ?? false

    if (!targetDate) {
      setError('Wybierz datę sesji.')
      return
    }
    if (!draft.title.trim()) {
      setError('Podaj nazwę sesji.')
      return
    }
    setError(null)
    setSaving(true)

    const fd = new FormData()
    fd.set('athlete_id', athleteId)
    fd.set('date', targetDate)
    fd.set('type', draft.type || 'easy')
    fd.set('title', draft.title)
    fd.set('description', draft.description)

    if (editingSessionId && !duplicate) {
      fd.set('id', editingSessionId)
    }

    if (editingSessionId && !duplicate) {
      fd.set('planned_distance', draft.plannedDistance)
      fd.set('planned_duration', draft.plannedDuration)
      fd.set('planned_pace', draft.plannedPace)
      fd.set('url', draft.url)
      fd.set('url_label', draft.urlLabel)
    } else {
      if (draft.plannedDistance) fd.set('planned_distance', draft.plannedDistance)
      if (draft.plannedDuration) fd.set('planned_duration', draft.plannedDuration)
      if (draft.plannedPace) fd.set('planned_pace', draft.plannedPace)
      if (draft.url) fd.set('url', draft.url)
      if (draft.urlLabel) fd.set('url_label', draft.urlLabel)
    }

    const result = editingSessionId && !duplicate
      ? await updateSession(null, fd)
      : await createSession(null, fd)

    if (result && 'error' in result) {
      setError(result.error ?? 'Nie udało się zapisać sesji.')
      onActionComplete?.({ tone: 'error', text: result.error ?? 'Nie udało się zapisać sesji.' })
      setSaving(false)
      return
    }

    onClose()
    setSaving(false)
    setDeleteConfirm(false)
    onActionComplete?.({
      tone: 'success',
      text: options?.successText ?? (editingSessionId && !duplicate ? 'Zmiany sesji zostały zapisane.' : 'Sesja została dodana.'),
    })
    startTransition(() => router.refresh())
  }

  async function saveSession() {
    await persistSession()
  }

  async function handleDeleteSession() {
    if (!editingSessionId || saving) return
    setError(null)
    setSaving(true)
    const result = await deleteSessionAction(editingSessionId, athleteId)
    if (result && 'error' in result) {
      setError(result.error ?? 'Nie udało się usunąć sesji.')
      onActionComplete?.({ tone: 'error', text: result.error ?? 'Nie udało się usunąć sesji.' })
      setSaving(false)
      return
    }
    onClose()
    setSaving(false)
    setDeleteConfirm(false)
    onActionComplete?.({ tone: 'success', text: 'Sesja została usunięta.' })
    startTransition(() => router.refresh())
  }

  const sessionFooter = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {editingSessionId && (
          deleteConfirm ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Na pewno usunąć?</span>
              <Button variant="danger" size="sm" onClick={handleDeleteSession} disabled={saving}>
                {saving ? 'Usuwanie...' : 'Potwierdź'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(false)} disabled={saving}>
                Anuluj
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)} disabled={saving}>
              Usuń
            </Button>
          )
        )}
        <div className="ml-auto">
          <Button className="whitespace-nowrap" onClick={saveSession} disabled={!draft.title.trim() || !draftDate || saving}>
            {saving ? 'Zapisywanie...' : editingSessionId ? 'Zapisz zmiany' : 'Dodaj sesję'}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editingSessionId ? 'Edytuj sesję' : 'Nowa sesja treningowa'}
        footer={sessionFooter}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Data</label>
            <div
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ ...inputStyle, opacity: 0.85 }}
            >
              {draftDate ? formatDate(draftDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Brak daty'}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Typ treningu</label>
              <button onClick={() => setSessionTypeModalOpen(true)} className="text-xs cursor-pointer hover:opacity-80" style={{ color: 'var(--text-muted)' }}>⚙ Edytuj typy</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSessionTypes.map(t => (
                <button key={t.key} onClick={() => setDraft(d => ({ ...d, type: t.key }))}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
                  style={{
                    opacity: draft.type === t.key ? 1 : 0.4,
                    outline: draft.type === t.key ? '2px solid currentColor' : 'none',
                    outlineOffset: '1px',
                    ...(t.color ? { background: `${t.color}33`, color: t.color } : {}),
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Nazwa sesji *</label>
            <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="np. Rozbieganie 10 km"
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)', color: '#DC2626' }}
            >
              {error}
            </div>
          )}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Opis / instrukcje</label>
            <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="Szczegóły treningu..." rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Dystans (km)</label>
              <input type="number" value={draft.plannedDistance} onChange={e => setDraft(d => ({ ...d, plannedDistance: e.target.value }))}
                placeholder="np. 10" min="0" step="0.1"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
              <input type="number" value={draft.plannedDuration} onChange={e => setDraft(d => ({ ...d, plannedDuration: e.target.value }))}
                placeholder="np. 60" min="0"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Tempo (/km)</label>
              <input value={draft.plannedPace} onChange={e => setDraft(d => ({ ...d, plannedPace: e.target.value }))}
                placeholder="np. 5:30"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Link (opcjonalny)</label>
            <input value={draft.url} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))}
              placeholder="np. https://www.trainerroad.com/..."
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          {draft.url && (
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Opis linku (opcjonalny)</label>
              <input value={draft.urlLabel} onChange={e => setDraft(d => ({ ...d, urlLabel: e.target.value }))}
                placeholder="np. Plan treningu w TrainerRoad"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
          )}
        </div>
      </Modal>

      <SessionTypeEditor
        open={sessionTypeModalOpen}
        onClose={() => setSessionTypeModalOpen(false)}
        onResult={onActionComplete}
      />
    </>
  )
}
