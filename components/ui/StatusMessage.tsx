'use client'

import type { ReactNode } from 'react'

interface StatusMessageProps {
  tone: 'success' | 'error' | 'info'
  text: string
  action?: ReactNode
  className?: string
}

const TONE_STYLES: Record<StatusMessageProps['tone'], React.CSSProperties> = {
  success: {
    background: 'rgba(46,204,113,0.1)',
    border: '1px solid rgba(46,204,113,0.25)',
    color: '#2ECC71',
  },
  error: {
    background: 'rgba(231,76,60,0.1)',
    border: '1px solid rgba(231,76,60,0.25)',
    color: '#E74C3C',
  },
  info: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
  },
}

export function StatusMessage({ tone, text, action, className = '' }: StatusMessageProps) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3 flex-wrap ${className}`}
      style={TONE_STYLES[tone]}
    >
      <span>{text}</span>
      {action}
    </div>
  )
}
