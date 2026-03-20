'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  slug: string
}

export function AthleteBottomNav({ slug }: Props) {
  const pathname = usePathname()

  const items = [
    { href: `/u/${slug}`, icon: '🏠', label: 'Dziś' },
    { href: `/u/${slug}/plan`, icon: '📅', label: 'Plan' },
    { href: `/u/${slug}/history`, icon: '📊', label: 'Wykonanie' },
    { href: `/u/${slug}/chat`, icon: '💬', label: 'Czat' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20"
      style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div className="flex items-center justify-around max-w-sm mx-auto py-1.5">
        {items.map(item => {
          const isActive = item.href === `/u/${slug}` ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all"
              style={{ color: isActive ? '#FF5C1B' : 'var(--text-muted)' }}>
              <span className="text-lg">{item.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
