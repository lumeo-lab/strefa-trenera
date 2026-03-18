'use client'

import type { ReactNode } from 'react'

interface ProfileStatusNoticeProps {
  tone: 'success' | 'error' | 'info'
  text: string
  action?: ReactNode
}

export function ProfileStatusNotice({ tone, text, action }: ProfileStatusNoticeProps) {
  const toneStyle = {
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
  }[tone]

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3 flex-wrap"
      style={toneStyle}
    >
      <span>{text}</span>
      {action}
    </div>
  )
}

interface ProfileEmptyStateProps {
  icon: string
  title: string
  description: string
  action?: ReactNode
}

export function ProfileEmptyState({ icon, title, description, action }: ProfileEmptyStateProps) {
  return (
    <div className="text-center py-10 px-4">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
        {description}
      </div>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}
