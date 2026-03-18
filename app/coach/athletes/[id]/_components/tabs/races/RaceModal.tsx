'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { INPUT_STYLE } from '@/lib/styles'

const inputStyle = INPUT_STYLE

type RaceStatus = 'planned' | 'completed' | 'dns' | 'dnf'

interface RaceDraft {
  name: string; date: string; distance: string; goalTime: string
  result: string; status: RaceStatus; notes: string
}

interface RaceModalProps {
  open: boolean
  onClose: () => void
  editingRaceId: string | null
  draft: RaceDraft
  onDraftChange: (updater: (d: RaceDraft) => RaceDraft) => void
  saving: boolean
  onSave: () => void
  onDelete: (id: string) => void
}

export function RaceModal({ open, onClose, editingRaceId, draft, onDraftChange, saving, onSave, onDelete }: RaceModalProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setConfirmDeleteId(null) }}
      title={editingRaceId ? 'Edytuj start' : 'Nowy start'}
      footer={
        <div className="flex gap-3">
          {editingRaceId && (
            confirmDeleteId === editingRaceId ? (
              <div className="flex gap-2 items-center">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Na pewno usunąć?</span>
                <button onClick={() => onDelete(editingRaceId)}
                  className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer"
                  style={{ background: 'rgba(231,76,60,0.15)', color: '#E74C3C' }}>Tak, usuń</button>
                <button onClick={() => setConfirmDeleteId(null)}
                  className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Nie</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDeleteId(editingRaceId)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>🗑 Usuń</button>
            )
          )}
          <Button className="flex-1" onClick={onSave} disabled={!draft.name.trim() || !draft.date || saving}>
            {saving ? 'Zapisywanie...' : editingRaceId ? 'Zapisz zmiany' : 'Dodaj start'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Nazwa zawodów *</label>
          <input value={draft.name} onChange={e => onDraftChange(d => ({ ...d, name: e.target.value }))}
            placeholder="np. Maraton Warszawski 2026"
            className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Data *</label>
            <input type="date" value={draft.date} onChange={e => onDraftChange(d => ({ ...d, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Dystans</label>
            <input value={draft.distance} onChange={e => onDraftChange(d => ({ ...d, distance: e.target.value }))}
              placeholder="np. Maraton, 10 km"
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Cel czasowy</label>
            <input value={draft.goalTime} onChange={e => onDraftChange(d => ({ ...d, goalTime: e.target.value }))}
              placeholder="np. 3:30:00"
              className="w-full px-3 py-2 rounded-xl text-sm font-mono" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Status</label>
            <select value={draft.status} onChange={e => onDraftChange(d => ({ ...d, status: e.target.value as RaceStatus }))}
              className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}>
              <option value="planned">Planowany</option>
              <option value="completed">Ukończony</option>
              <option value="dns">DNS</option>
              <option value="dnf">DNF</option>
            </select>
          </div>
        </div>
        {draft.status === 'completed' && (
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Wynik</label>
            <input value={draft.result} onChange={e => onDraftChange(d => ({ ...d, result: e.target.value }))}
              placeholder="np. 3:24:15"
              className="w-full px-3 py-2 rounded-xl text-sm font-mono" style={inputStyle} />
          </div>
        )}
        <div>
          <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Notatki</label>
          <textarea value={draft.notes} onChange={e => onDraftChange(d => ({ ...d, notes: e.target.value }))}
            placeholder="Dodatkowe informacje..."
            rows={3} className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={inputStyle} />
        </div>
      </div>
    </Modal>
  )
}
