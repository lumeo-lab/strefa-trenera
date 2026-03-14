'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { InvoiceStatus } from '@/lib/types'
import { invoiceStatusColor, invoiceStatusLabel } from '@/lib/utils'

const ALL_STATUSES: InvoiceStatus[] = ['pending', 'paid', 'overdue', 'cancelled']

interface Props {
  status: InvoiceStatus
  onChange: (next: InvoiceStatus) => void
  loading?: boolean
}

export function InvoiceStatusDropdown({ status, onChange, loading }: Props) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (loading) return
    if (open) { setOpen(false); return }
    const rect = btnRef.current!.getBoundingClientRect()
    let left = rect.left
    if (left + 168 > window.innerWidth) left = rect.right - 168
    setCoords({ top: rect.bottom + 4, left })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function close() { setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-disabled={!!loading}
        className={`text-xs px-2 py-0.5 rounded-full cursor-pointer transition-opacity ${invoiceStatusColor(status)}`}
        style={{ opacity: loading ? 0.5 : 1 }}
      >
        {loading ? '…' : invoiceStatusLabel(status)}
      </button>
      {open && createPortal(
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'fixed', top: coords.top, left: coords.left, zIndex: 9999, minWidth: 168,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden',
          }}
        >
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors hover:bg-[var(--bg-hover)] ${s === status ? 'bg-[var(--bg-elevated)]' : 'bg-transparent'}`}
              style={{ color: 'var(--text-primary)' }}
            >
              <span className={`px-1.5 py-0.5 rounded-full ${invoiceStatusColor(s)}`}>{invoiceStatusLabel(s)}</span>
              {s === status && <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>✓</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
