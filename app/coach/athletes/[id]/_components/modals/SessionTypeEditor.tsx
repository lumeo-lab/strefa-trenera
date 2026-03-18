'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { INPUT_STYLE } from '@/lib/styles'
import { sessionTypeLabel } from '@/lib/utils'
import { BUILTIN_SESSION_TYPE_KEYS, type SessionTypeDef } from '@/lib/session-type-defs'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'

const PRESET_TYPE_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#EF4444', '#F59E0B', '#06B6D4']

interface SessionTypeEditorProps {
  open: boolean
  onClose: () => void
  onResult?: (notice: { tone: 'success' | 'error'; text: string }) => void
}

export function SessionTypeEditor({ open, onClose, onResult }: SessionTypeEditorProps) {
  const { builtins, custom, saveAll } = useCustomSessionTypes()

  const [editingBuiltinTypes, setEditingBuiltinTypes] = useState<SessionTypeDef[]>(() =>
    builtins.map(t => ({ ...t })),
  )
  const [editingCustomTypes, setEditingCustomTypes] = useState<SessionTypeDef[]>(() =>
    custom.map(t => ({ ...t })),
  )
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [newTypeColor, setNewTypeColor] = useState(PRESET_TYPE_COLORS[0])
  const [openBuiltinColorKey, setOpenBuiltinColorKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens
  function handleOpen() {
    setEditingBuiltinTypes(builtins.map(t => ({ ...t })))
    setEditingCustomTypes(custom.map(t => ({ ...t })))
    setNewTypeLabel('')
    setNewTypeColor(PRESET_TYPE_COLORS[0])
    setOpenBuiltinColorKey(null)
    setError(null)
  }

  if (open && editingBuiltinTypes.length === 0 && builtins.length > 0) {
    handleOpen()
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await saveAll(editingBuiltinTypes, editingCustomTypes)
      onClose()
      onResult?.({ tone: 'success', text: 'Typy treningów zostały zapisane.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się zapisać typów treningów.'
      setError(message)
      onResult?.({ tone: 'error', text: message })
    } finally {
      setSaving(false)
    }
  }

  function addCustomType() {
    if (!newTypeLabel.trim()) return
    const key = `custom_${Date.now()}`
    setEditingCustomTypes(prev => [...prev, { key, label: newTypeLabel.trim(), color: newTypeColor, isBuiltin: false }])
    setNewTypeLabel('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rodzaj treningu"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Anuluj</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Zapisywanie...' : 'Zapisz'}</Button>
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
                      style={INPUT_STYLE}
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
              )
            })}
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)', color: '#DC2626' }}
          >
            {error}
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
                    style={INPUT_STYLE}
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
            style={INPUT_STYLE}
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
  )
}
