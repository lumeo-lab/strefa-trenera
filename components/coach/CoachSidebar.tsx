'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const navSections = [
  {
    label: 'Planer treningowy',
    items: [
      { href: '/coach/athletes', icon: '👟', label: 'Zawodnicy' },
      { href: '/coach/feedback', icon: '📥', label: 'Feedback' },
      { href: '/coach/chat', icon: '💬', label: 'Czat' },
    ],
  },
  {
    label: 'Biznes',
    items: [
      { href: '/coach/invoices', icon: '💳', label: 'Faktury' },
      { href: '/coach/analytics', icon: '📊', label: 'Analityka' },
    ],
  },
]

const bottomItems = [
  { href: '/coach/help', icon: '❓', label: 'Pomoc' },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  coachName: string
  coachPlan: string
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function planLabel(plan: string) {
  const map: Record<string, string> = { starter: 'Plan Starter', pro: 'Plan Pro', standard: 'Plan Standard' }
  return map[plan] ?? plan
}

function NavLink({ href, icon, label, collapsed }: { href: string; icon: string; label: string; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className="flex items-center rounded-xl transition-all"
      style={{
        gap: collapsed ? '0' : '10px',
        padding: collapsed ? '10px 0' : '10px 12px',
        justifyContent: collapsed ? 'center' : undefined,
        background: isActive ? 'rgba(255,92,27,0.12)' : undefined,
        color: isActive ? '#FF5C1B' : 'var(--text-muted)',
        borderLeft: isActive ? '2px solid #FF5C1B' : '2px solid transparent',
      }}
      title={collapsed ? label : undefined}
    >
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  )
}

export function CoachSidebar({ collapsed, onToggle, coachName, coachPlan }: Props) {
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
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
        {/* Sections */}
        <div className="space-y-4">
          {navSections.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  {section.label}
                </div>
              )}
              {collapsed && <div className="border-t mx-2 mb-1" style={{ borderColor: 'var(--border)' }} />}
              <ul className="space-y-0.5">
                {section.items.map(item => (
                  <li key={item.href}>
                    <NavLink {...item} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom items: Settings + Help */}
        <div className="mt-auto">
          {!collapsed && <div className="border-t mb-2 mx-1" style={{ borderColor: 'var(--border)' }} />}
          <ul className="space-y-0.5">
            {bottomItems.map(item => (
              <li key={item.href}>
                <NavLink {...item} collapsed={collapsed} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer: user + theme + logout */}
      <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link href="/coach/settings" title="Ustawienia profilu">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-sm text-white cursor-pointer hover:opacity-80 transition-opacity">
                {avatarLetters}
              </div>
            </Link>
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
            <Link href="/coach/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-subtle)' }}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {avatarLetters}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{coachName}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{planLabel(coachPlan)}</div>
              </div>
            </Link>
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
