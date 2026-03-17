'use client'

import React, { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate, sessionTypeLabel } from '@/lib/utils'
import { createSession, deleteSession as deleteSessionAction, updateSession } from '@/lib/actions/sessions'
import { BUILTIN_SESSION_TYPE_KEYS, SessionTypeDef } from '@/lib/session-type-defs'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'
import { INPUT_STYLE } from '@/lib/styles'
import type { CoachTrainingSessionRow } from '../types'

const inputStyle = INPUT_STYLE
const PRESET_TYPE_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#EF4444', '#F59E0B', '#06B6D4']

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
  today: string
  editSession?: CoachTrainingSessionRow | null
  initialDate?: string
  onActionComplete?: (notice: { tone: 'success' | 'error'; text: string }) => void
}

function shiftISODate(date: string, days: number): string {
  if (!date) return ''
  const dt = new Date(`${date}T12:00:00`)
  dt.setDate(dt.getDate() + days)
  return dt.toISOString().slice(0, 10)
}

export function SessionModal({ open, onClose, athleteId, today, editSession, initialDate, onActionComplete }: SessionModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { all: allSessionTypes, builtins: builtinSessionTypes, custom: customSessionTypes, saveAll: saveSessionTypes } = useCustomSessionTypes()

  // Session type editor modal
  const [sessionTypeModalOpen, setSessionTypeModalOpen] = useState(false)
  const [editingBuiltinTypes, setEditingBuiltinTypes] = useState<SessionTypeDef[]>([])
  const [editingCustomTypes, setEditingCustomTypes] = useState<SessionTypeDef[]>([])
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [newTypeColor, setNewTypeColor] = useState(PRESET_TYPE_COLORS[0])
  const [openBuiltinColorKey, setOpenBuiltinColorKey] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [savingTypeDefs, setSavingTypeDefs] = useState(false)
  const [sessionTypeError, setSessionTypeError] = useState<string | null>(null)

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

  function openSessionTypeModal() {
    setEditingBuiltinTypes(builtinSessionTypes.map(t => ({ ...t })))
    setEditingCustomTypes(customSessionTypes.map(t => ({ ...t })))
    setNewTypeLabel('')
    setNewTypeColor(PRESET_TYPE_COLORS[0])
    setOpenBuiltinColorKey(null)
    setSessionTypeError(null)
    setSessionTypeModalOpen(true)
  }
  async function saveSessionTypeEdits() {
    if (savingTypeDefs) return
    setSavingTypeDefs(true)
    setSessionTypeError(null)
    try {
      await saveSessionTypes(editingBuiltinTypes, editingCustomTypes)
      setSessionTypeModalOpen(false)
      onActionComplete?.({ tone: 'success', text: 'Typy treningów zostały zapisane.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się zapisać typów treningów.'
      setSessionTypeError(message)
      onActionComplete?.({ tone: 'error', text: message })
    } finally {
      setSavingTypeDefs(false)
    }
  }
  function addCustomType() {
    if (!newTypeLabel.trim()) return
    const key = `custom_${Date.now()}`
    setEditingCustomTypes(prev => [...prev, { key, label: newTypeLabel.trim(), color: newTypeColor, isBuiltin: false }])
    setNewTypeLabel('')
  }

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
      {editingSessionId && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => persistSession({ date: shiftISODate(draftDate || today, 1), successText: 'Sesja została przeniesiona na kolejny dzień.' })}
            disabled={saving}
            className="whitespace-nowrap"
          >
            Przenieś na jutro
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => persistSession({ date: shiftISODate(draftDate || today, 7), duplicate: true, successText: 'Sesja została skopiowana na kolejny tydzień.' })}
            disabled={saving}
            className="whitespace-nowrap"
          >
            Kopiuj na za tydzień
          </Button>
        </div>
      )}
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
              <button onClick={openSessionTypeModal} className="text-xs cursor-pointer hover:opacity-80" style={{ color: 'var(--text-muted)' }}>⚙ Edytuj typy</button>
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

      {/* Session Type Editor Modal */}
      <Modal
        open={sessionTypeModalOpen}
        onClose={() => setSessionTypeModalOpen(false)}
        title="Rodzaj treningu"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSessionTypeModalOpen(false)} disabled={savingTypeDefs}>Anuluj</Button>
            <Button onClick={saveSessionTypeEdits} disabled={savingTypeDefs}>{savingTypeDefs ? 'Zapisywanie...' : 'Zapisz'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Built-in types */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Wbudowane typy</div>
            <div className="space-y-2">
              {BUILTIN_SESSION_TYPE_KEYS.map(key => {
                const builtin = editingBuiltinTypes.find((item) => item.key === key)
                return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenBuiltinColorKey((current) => current === key ? null : key)}
                      className="inline-flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer shrink-0"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}
                      aria-label={`Zmień kolor typu ${builtin?.label ?? sessionTypeLabel(key)}`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ background: builtin?.color ?? '#3B82F6' }}
                      />
                      <span className="text-[11px] font-semibold">{openBuiltinColorKey === key ? 'Ukryj' : 'Kolor'}</span>
                    </button>
                    <input
                      value={builtin?.label ?? sessionTypeLabel(key)}
                      onChange={e => setEditingBuiltinTypes(prev => prev.map((item) => item.key === key ? { ...item, label: e.target.value } : item))}
                      className="flex-1 px-3 py-2 rounded-xl text-sm"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  {openBuiltinColorKey === key && (
                    <div className="ml-0 sm:ml-[110px] flex gap-1.5 flex-wrap rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      {PRESET_TYPE_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setEditingBuiltinTypes(prev => prev.map((item) => item.key === key ? { ...item, color } : item))
                            setOpenBuiltinColorKey(null)
                          }}
                          className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110"
                          style={{
                            background: color,
                            outline: builtin?.color === color ? '2px solid white' : 'none',
                            outlineOffset: 2,
                            boxShadow: builtin?.color === color ? `0 0 0 3px ${color}` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>

          {sessionTypeError && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)', color: '#DC2626' }}
            >
              {sessionTypeError}
            </div>
          )}

          {/* Custom types */}
          {editingCustomTypes.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Własne typy</div>
              <div className="space-y-2">
                {editingCustomTypes.map((t, idx) => (
                  <div key={t.key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                    <input
                      value={t.label}
                      onChange={e => setEditingCustomTypes(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                      className="flex-1 px-3 py-2 rounded-xl text-sm"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={() => setEditingCustomTypes(prev => prev.filter((_, i) => i !== idx))}
                      className="text-xs px-2.5 py-2 rounded-xl cursor-pointer"
                      style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Dodaj własny typ</div>
            <input
              value={newTypeLabel}
              onChange={e => setNewTypeLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomType()}
              placeholder="Nazwa (np. Pływanie)"
              className="w-full px-3 py-2 rounded-xl text-sm mb-2"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_TYPE_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setNewTypeColor(c)}
                    className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
                    style={{ background: c, outline: newTypeColor === c ? '2px solid white' : 'none', outlineOffset: 2, boxShadow: newTypeColor === c ? `0 0 0 3px ${c}` : 'none' }} />
                ))}
              </div>
              <Button size="sm" onClick={addCustomType} disabled={!newTypeLabel.trim()}>+ Dodaj</Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
