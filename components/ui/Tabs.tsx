'use client'

interface Tab { id: string; label: string }

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 p-1 rounded-xl overflow-x-auto ${className}`} style={{ background: 'var(--bg-elevated)' }}>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className="flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
          style={{
            background: active === tab.id ? 'var(--bg-raised)' : undefined,
            color: active === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
          }}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
