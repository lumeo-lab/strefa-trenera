'use client'

import React from 'react'
import { formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { INPUT_STYLE } from '@/lib/styles'

interface WeekTemplateModalsProps {
  // Save template modal
  saveOpen: boolean
  onSaveClose: () => void
  templateName: string
  onTemplateNameChange: (name: string) => void
  onSaveTemplate: () => void
  saving: boolean
  // Use template modal
  useOpen: boolean
  onUseClose: () => void
  templates: Array<{ id: string; name: string; created_at: string; itemCount?: number }>
  templatesLoading: boolean
  onApplyTemplate: (templateId: string) => void
  applying: boolean
}

export function WeekTemplateModals({
  saveOpen,
  onSaveClose,
  templateName,
  onTemplateNameChange,
  onSaveTemplate,
  saving,
  useOpen,
  onUseClose,
  templates,
  templatesLoading,
  onApplyTemplate,
  applying,
}: WeekTemplateModalsProps) {
  return (
    <>
      <Modal
        open={saveOpen}
        onClose={onSaveClose}
        title="Zapisz tydzień jako szablon"
        size="sm"
        footer={
          <div className="flex gap-2">
            <button
              onClick={onSaveClose}
              className="px-4 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
            >
              Anuluj
            </button>
            <button
              onClick={onSaveTemplate}
              disabled={saving || !templateName.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60"
              style={{ background: '#FF5C1B' }}
            >
              {saving ? 'Zapisywanie...' : 'Zapisz szablon'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Zapiszesz układ bieżącego tygodnia jako gotowy szablon do ponownego użycia.
          </p>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>
              Nazwa szablonu
            </label>
            <input
              value={templateName}
              onChange={(e) => onTemplateNameChange(e.target.value)}
              placeholder="np. Tydzień bazowy 10 km"
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={INPUT_STYLE}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={useOpen}
        onClose={onUseClose}
        title="Użyj szablonu tygodnia"
        size="sm"
      >
        <div className="space-y-3">
          {templatesLoading ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Ładowanie szablonów...</div>
          ) : templates.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nie masz jeszcze zapisanych szablonów tygodnia. Zapisz dobry układ tygodnia, żeby potem używać go jednym kliknięciem.
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{template.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {template.itemCount !== undefined && template.itemCount > 0 && `${template.itemCount} ${template.itemCount === 1 ? 'sesja' : template.itemCount < 5 ? 'sesje' : 'sesji'} · `}
                    Zapisano {formatDate(template.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={() => onApplyTemplate(template.id)}
                  disabled={applying}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  style={{ background: '#FF5C1B' }}
                >
                  {applying ? 'Trwa...' : 'Użyj'}
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}
