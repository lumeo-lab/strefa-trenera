'use client'

import React, { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { intensityColor, sessionTypeLabel } from '@/lib/utils'
import { SessionType, DbRow } from '@/lib/types'
import { createSession, updateSession, deleteSession as deleteSessionAction } from '@/lib/actions/sessions'
import { useCustomSessionTypes, BUILTIN_SESSION_TYPE_KEYS, SessionTypeDef } from '@/lib/useCustomSessionTypes'
import { INPUT_STYLE } from '@/lib/styles'

const inputStyle = INPUT_STYLE
const PRESET_TYPE_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#EF4444', '#F59E0B', '#06B6D4']

interface SessionDraft {
  title: string; type: string; description: string
  plannedDistance: string; plannedDuration: string; plannedPace: string; url: string; urlLabel: string
  completed: boolean; actualDistance: string; actualDuration: string; actualPace: string; avgHr: string; maxHr: string
}

const emptyDraft = (): SessionDraft => ({
  title: '', type: 'easy', description: '', plannedDistance: '', plannedDuration: '', plannedPace: '', url: '', urlLabel: '',
  completed: false, actualDistance: '', actualDuration: '', actualPace: '', avgHr: '', maxHr: '',
})

interface SessionModalProps {
  open: boolean
  onClose: () => void
  athleteId: string
  today: string
  editSession?: DbRow | null
  initialDate?: string
}

export function SessionModal({ open, onClose, athleteId, today, editSession, initialDate }: SessionModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const { all: allSessionTypes, custom: customSessionTypes, labelOverrides, saveAll: saveSessionTypes } = useCustomSessionTypes()

  // Session type editor modal
  const [sessionTypeModalOpen, setSessionTypeModalOpen] = useState(false)
  const [editingBuiltinLabels, setEditingBuiltinLabels] = useState<Record<string, string>>({})
  const [editingCustomTypes, setEditingCustomTypes] = useState<SessionTypeDef[]>([])
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [newTypeColor, setNewTypeColor] = useState(PRESET_TYPE_COLORS[0])

  const [editingSessionId, setEditingSessionId] = useState<string | null>(editSession?.id ?? null)
  const [draftDate, setDraftDate] = useState(editSession?.date ?? initialDate ?? '')
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
        completed: editSession.completed ?? false,
        actualDistance: editSession.actual_distance?.toString() ?? '',
        actualDuration: editSession.actual_duration?.toString() ?? '',
        actualPace: editSession.actual_pace ?? '',
        avgHr: editSession.avg_hr?.toString() ?? '',
        maxHr: editSession.max_hr?.toString() ?? '',
      }
    }
    return emptyDraft()
  })

  function openSessionTypeModal() {
    setEditingBuiltinLabels({ ...labelOverrides })
    setEditingCustomTypes(customSessionTypes.map(t => ({ ...t })))
    setNewTypeLabel('')
    setNewTypeColor(PRESET_TYPE_COLORS[0])
    setSessionTypeModalOpen(true)
  }
  function saveSessionTypeEdits() {
    saveSessionTypes(editingBuiltinLabels, editingCustomTypes)
    setSessionTypeModalOpen(false)
  }
  function addCustomType() {
    if (!newTypeLabel.trim()) return
    const key = `custom_${Date.now()}`
    setEditingCustomTypes(prev => [...prev, { key, label: newTypeLabel.trim(), color: newTypeColor, isBuiltin: false }])
    setNewTypeLabel('')
  }

  async function saveSession() {
    if (!draft.title.trim() || saving) return
    setSaving(true)

    const fd = new FormData()
    fd.set('athlete_id', athleteId)
    fd.set('date', draftDate)
    fd.set('type', draft.type)
    fd.set('title', draft.title)
    fd.set('description', draft.description)

    if (editingSessionId) {
      fd.set('planned_distance', draft.plannedDistance)
      fd.set('planned_duration', draft.plannedDuration)
      fd.set('planned_pace', draft.plannedPace)
      fd.set('url', draft.url)
      fd.set('url_label', draft.urlLabel)
      fd.set('completed', draft.completed.toString())
      fd.set('actual_distance', draft.actualDistance)
      fd.set('actual_duration', draft.actualDuration)
      fd.set('actual_pace', draft.actualPace)
      fd.set('avg_hr', draft.avgHr)
      fd.set('max_hr', draft.maxHr)
    } else {
      if (draft.plannedDistance) fd.set('planned_distance', draft.plannedDistance)
      if (draft.plannedDuration) fd.set('planned_duration', draft.plannedDuration)
      if (draft.plannedPace) fd.set('planned_pace', draft.plannedPace)
      if (draft.url) fd.set('url', draft.url)
      if (draft.urlLabel) fd.set('url_label', draft.urlLabel)
      if (draft.completed) fd.set('completed', 'true')
      if (draft.actualDistance) fd.set('actual_distance', draft.actualDistance)
      if (draft.actualDuration) fd.set('actual_duration', draft.actualDuration)
      if (draft.actualPace) fd.set('actual_pace', draft.actualPace)
      if (draft.avgHr) fd.set('avg_hr', draft.avgHr)
      if (draft.maxHr) fd.set('max_hr', draft.maxHr)
    }

    if (editingSessionId) {
      fd.set('id', editingSessionId)
      fd.set('athlete_id', athleteId)
      await updateSession(null, fd)
    } else {
      await createSession(null, fd)
    }

    onClose()
    setSaving(false)
    startTransition(() => router.refresh())
  }

  async function handleDeleteSession() {
    if (!editingSessionId || saving) return
    setSaving(true)
    await deleteSessionAction(editingSessionId, athleteId)
    onClose()
    setSaving(false)
    startTransition(() => router.refresh())
  }

  const sessionFooter = (
    <div className="flex gap-3">
      {editingSessionId && (
        <button
          onClick={handleDeleteSession}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}
        >🗑 Usuń</button>
      )}
      {editingSessionId && (
        <button
          onClick={() => {
            const cur = { ...draft }
            setEditingSessionId(null)
            setDraftDate('')
            setDraft({ ...cur, completed: false, actualDistance: '', actualDuration: '', actualPace: '', avgHr: '', maxHr: '' })
          }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
        >📋 Duplikuj</button>
      )}
      <Button className="flex-1" onClick={saveSession} disabled={!draft.title.trim() || saving}>
        {saving ? 'Zapisywanie...' : editingSessionId ? 'Zapisz zmiany' : 'Dodaj sesję'}
      </Button>
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
            <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Typ treningu</label>
              <button onClick={openSessionTypeModal} className="text-xs cursor-pointer hover:opacity-80" style={{ color: 'var(--text-muted)' }}>⚙ Edytuj typy</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSessionTypes.map(t => (
                <button key={t.key} onClick={() => setDraft(d => ({ ...d, type: t.key }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${t.isBuiltin ? intensityColor(t.key as SessionType) : ''}`}
                  style={{
                    opacity: draft.type === t.key ? 1 : 0.4,
                    outline: draft.type === t.key ? '2px solid currentColor' : 'none',
                    outlineOffset: '1px',
                    ...(!t.isBuiltin && t.color ? { background: t.color + '33', color: t.color } : {}),
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

          {/* Wyniki */}
          {(editingSessionId || (draftDate && draftDate < today)) && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Wyniki</div>
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, completed: !d.completed }))}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer w-full mb-3"
                style={{
                  background: draft.completed ? 'rgba(46,204,113,0.12)' : 'var(--bg-elevated)',
                  color: draft.completed ? '#2ECC71' : 'var(--text-muted)',
                  border: `1px solid ${draft.completed ? 'rgba(46,204,113,0.3)' : 'var(--border-mid)'}`,
                  justifyContent: 'flex-start',
                }}
              >
                <span>{draft.completed ? '✅' : '○'}</span>
                <span>Sesja wykonana</span>
              </button>
              {draft.completed && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Dystans rzeczywisty (km)</label>
                    <input type="number" value={draft.actualDistance}
                      onChange={e => setDraft(d => ({ ...d, actualDistance: e.target.value }))}
                      placeholder="np. 10.2" min="0" step="0.1"
                      className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
                    <input type="number" value={draft.actualDuration}
                      onChange={e => setDraft(d => ({ ...d, actualDuration: e.target.value }))}
                      placeholder="np. 65" min="0"
                      className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Tempo (/km)</label>
                    <input value={draft.actualPace}
                      onChange={e => setDraft(d => ({ ...d, actualPace: e.target.value }))}
                      placeholder="np. 5:20"
                      className="w-full px-3 py-2 rounded-xl text-sm font-mono" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Tętno śr. (bpm)</label>
                    <input type="number" value={draft.avgHr}
                      onChange={e => setDraft(d => ({ ...d, avgHr: e.target.value }))}
                      placeholder="np. 155" min="0"
                      className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Tętno max (bpm)</label>
                    <input type="number" value={draft.maxHr}
                      onChange={e => setDraft(d => ({ ...d, maxHr: e.target.value }))}
                      placeholder="np. 178" min="0"
                      className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                </div>
              )}
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
            <Button variant="secondary" onClick={() => setSessionTypeModalOpen(false)}>Anuluj</Button>
            <Button onClick={saveSessionTypeEdits}>Zapisz</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Built-in types */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Wbudowane typy</div>
            <div className="space-y-2">
              {BUILTIN_SESSION_TYPE_KEYS.map(key => (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${intensityColor(key)}`}
                    style={{ minWidth: 52, textAlign: 'center' }}>
                    ●
                  </span>
                  <input
                    value={editingBuiltinLabels[key] ?? labelOverrides[key] ?? sessionTypeLabel(key)}
                    onChange={e => setEditingBuiltinLabels(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
            </div>
          </div>

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
