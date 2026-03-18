'use client'

import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Tak, potwierdź',
  cancelLabel = 'Nie, wróć',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{message}</p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? '...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
