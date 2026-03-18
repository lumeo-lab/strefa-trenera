'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { INPUT_STYLE } from '@/lib/styles'
import { BUILTIN_ATHLETE_STATUS_KEYS, StatusDef } from '@/lib/athlete-status-defs'

const PRESET_COLORS = ['#2ECC71', '#F1C40F', '#E74C3C', '#6B7280', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316']

interface StatusEditorModalProps {
  open: boolean
  statuses: StatusDef[]
  onClose: () => void
  onSave: (statuses: StatusDef[]) => void | Promise<void>
}

export function StatusEditorModal({ open, statuses, onClose, onSave }: StatusEditorModalProps) {
  const [editingStatuses, setEditingStatuses] = useState<StatusDef[]>(statuses)
  const [newStatusLabel, setNewStatusLabel] = useState('')
  const [newStatusColor, setNewStatusColor] = useState(PRESET_COLORS[4])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setEditingStatuses(statuses)
  }, [open, statuses])

  function addStatus() {
    if (!newStatusLabel.trim()) return
    const key = `custom_${Date.now()}`
    setEditingStatuses(prev => [...prev, { key, label: newStatusLabel.trim(), color: newStatusColor }])
    setNewStatusLabel('')
    setNewStatusColor(PRESET_COLORS[4])
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edytuj statusy"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Anuluj</Button>
          <Button onClick={async () => {
            setSaving(true)
            try {
              await onSave(editingStatuses)
            } finally {
              setSaving(false)
            }
          }} disabled={saving}>{saving ? 'Zapisywanie...' : 'Zapisz'}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {editingStatuses.map((s, idx) => (
            <div
              key={s.key}
              className="rounded-2xl p-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start gap-2">
                <input
                  value={s.label}
                  onChange={e => setEditingStatuses(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm"
                  style={INPUT_STYLE}
                />
                {!BUILTIN_ATHLETE_STATUS_KEYS.includes(s.key as (typeof BUILTIN_ATHLETE_STATUS_KEYS)[number]) && (
                  <button
                    type="button"
                    onClick={() => setEditingStatuses(prev => prev.filter((_, i) => i !== idx))}
                    className="text-xs px-2.5 py-2 rounded-xl cursor-pointer shrink-0"
                    style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}
                  >
                    Usuń
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={`${s.key}-${color}`}
                    type="button"
                    onClick={() => setEditingStatuses(prev => prev.map((item, itemIdx) => itemIdx === idx ? { ...item, color } : item))}
                    className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-105"
                    title={`Ustaw kolor ${color}`}
                    style={{
                      background: color,
                      outline: s.color === color ? '2px solid white' : 'none',
                      outlineOffset: '1px',
                      boxShadow: s.color === color ? `0 0 0 2px ${color}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Dodaj nowy status</div>
          <div className="flex items-center gap-2 mb-2">
            <input
              value={newStatusLabel}
              onChange={e => setNewStatusLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStatus()}
              placeholder="Nazwa statusu (np. Kontuzja)"
              className="flex-1 px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewStatusColor(c)}
                  className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
                  style={{ background: c, outline: newStatusColor === c ? '2px solid white' : 'none', outlineOffset: '2px', boxShadow: newStatusColor === c ? `0 0 0 3px ${c}` : 'none' }} />
              ))}
            </div>
            <Button size="sm" onClick={addStatus} disabled={!newStatusLabel.trim()}>+ Dodaj</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
