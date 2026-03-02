'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/lib/theme'

interface Props {
  slug: string
}

export function AthleteBottomNav({ slug }: Props) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  const items = [
    { href: `/u/${slug}`, icon: '🏠', label: 'Dziś' },
    { href: `/u/${slug}/plan`, icon: '📅', label: 'Plan' },
    { href: `/u/${slug}/history`, icon: '📊', label: 'Historia' },
    { href: `/u/${slug}/chat`, icon: '💬', label: 'Czat' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-safe"
      style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="flex items-center justify-around max-w-sm mx-auto py-2">
        {items.map(item => {
          const isActive = item.href === `/u/${slug}` ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all"
              style={{ color: isActive ? '#FF5C1B' : 'var(--text-muted)' }}>
              <span className="text-xl">{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={toggle}
          className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          title={theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
        >
          <span className="text-xl">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span style={{ fontSize: '10px' }}>{theme === 'dark' ? 'Jasny' : 'Ciemny'}</span>
        </button>
      </div>
    </nav>
  )
}
