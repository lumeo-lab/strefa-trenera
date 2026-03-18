'use client'

import type { ReactNode } from 'react'

// Re-export StatusMessage as ProfileStatusNotice for backward compatibility
export { StatusMessage as ProfileStatusNotice } from '@/components/ui/StatusMessage'

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
