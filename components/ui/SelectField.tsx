'use client'

import { SELECT_STYLE } from '@/lib/styles'

interface SelectFieldProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function SelectField({ value, onChange, children, className = '' }: SelectFieldProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2 pr-11 text-sm cursor-pointer appearance-none"
        style={SELECT_STYLE}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        ▾
      </span>
    </div>
  )
}
