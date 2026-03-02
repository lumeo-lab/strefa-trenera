'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const navItems = [
  { href: '/coach/athletes', icon: '👟', label: 'Zawodnicy' },
  { href: '/coach/feedback', icon: '📥', label: 'Feedback' },
  { href: '/coach/invoices', icon: '💳', label: 'Faktury' },
  { href: '/coach/analytics', icon: '📊', label: 'Analityka' },
  { href: '/coach/chat', icon: '💬', label: 'Czat' },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  coachName: string
  coachPlan: string
}

function initials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function planLabel(plan: string) {
  const map: Record<string, string> = { starter: 'Plan Starter', pro: 'Plan Pro', standard: 'Plan Standard' }
  return map[plan] ?? plan
}

export function CoachSidebar({ collapsed, onToggle, coachName, coachPlan }: Props) {
  const pathname = usePathname()
  const w = collapsed ? '64px' : '256px'
  const avatarLetters = initials(coachName)

  return (
    <aside
      className="h-screen flex flex-col fixed left-0 top-0 z-30 transition-all duration-200 overflow-hidden"
      style={{ width: w, background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b shrink-0" style={{ borderColor: 'var(--border)', minHeight: '72px' }}>
        {!collapsed && (
          <Link href="/" className="text-lg font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
            Strefa<span style={{ color: '#FF5C1B' }}> Trenera</span>
            <div className="text-xs font-normal mt-0.5" style={{ color: 'var(--text-muted)' }}>Panel trenera</div>
          </Link>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <span className="text-lg font-black" style={{ color: '#FF5C1B' }}>ST</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ml-1"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          title={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
        >
          <span className="text-sm leading-none">{collapsed ? '→' : '←'}</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center rounded-xl transition-all"
                  style={{
                    gap: collapsed ? '0' : '10px',
                    padding: collapsed ? '10px 0' : '10px 12px',
                    justifyContent: collapsed ? 'center' : undefined,
                    background: isActive ? 'rgba(255,92,27,0.12)' : undefined,
                    color: isActive ? '#FF5C1B' : 'var(--text-muted)',
                    borderLeft: isActive ? '2px solid #FF5C1B' : '2px solid transparent',
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-sm text-white">
              {avatarLetters}
            </div>
            <form action={logout}>
              <button
                type="submit"
                title="Wyloguj"
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '12px' }}
              >
                ↩
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {avatarLetters}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{coachName}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{planLabel(coachPlan)}</div>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 mt-1 w-full px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer text-left"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
              >
                <span>↩</span> Wyloguj się
              </button>
            </form>
          </>
        )}
      </div>
    </aside>
  )
}
