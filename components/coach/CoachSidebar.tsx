'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import { Logo, LogoMark } from '@/components/ui/Logo'
import { GRADIENT_MAP } from '@/lib/constants'
import { getInitials, planLabel } from '@/lib/utils'

const navSections = [
  {
    label: 'Zawodnicy',
    items: [
      { href: '/coach/athletes', icon: '👟', label: 'Zawodnicy', badgeKey: null },
      { href: '/coach/planner', icon: '📅', label: 'Planer', badgeKey: null },
      { href: '/coach/feedback', icon: '📥', label: 'Feedback', badgeKey: 'feedback' as const },
      { href: '/coach/chat', icon: '💬', label: 'Czat', badgeKey: 'messages' as const },
    ],
  },
  {
    label: 'Finanse',
    items: [
      { href: '/coach/invoices', icon: '💳', label: 'Faktury', badgeKey: null },
      { href: '/coach/analytics', icon: '📊', label: 'Analityka', badgeKey: null },
    ],
  },
]

const bottomItems = [
  { href: '/coach/settings', icon: '⚙️', label: 'Ustawienia' },
  { href: '/coach/help', icon: '❓', label: 'Pomoc' },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  coachName: string
  coachPlan: string
  coachAvatar: string
  unreadFeedback: number
  unreadMessages: number
  mobileOpen: boolean
  onMobileClose: () => void
}

function CoachAvatarEl({ avatar, name, size }: { avatar: string; name: string; size: 'sm' | 'lg' }) {
  const wh = size === 'sm' ? 'w-9 h-9' : 'w-16 h-16'
  const font = size === 'sm' ? 'text-sm' : 'text-xl'
  const emojiSize = size === 'sm' ? 'text-xl' : 'text-4xl'
  if (avatar.startsWith('http')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} className={`${wh} rounded-full object-cover shrink-0`} />
  }
  if (avatar.startsWith('emoji:')) {
    const emoji = avatar.slice(6)
    return (
      <div className={`${wh} rounded-full flex items-center justify-center shrink-0 ${emojiSize}`}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        {emoji}
      </div>
    )
  }
  const color = avatar.startsWith('color:') ? avatar.slice(6) : 'orange'
  const gradient = GRADIENT_MAP[color] ?? GRADIENT_MAP.orange
  return (
    <div className={`${wh} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold ${font} text-white shrink-0`}>
      {getInitials(name)}
    </div>
  )
}

function NavLink({ href, icon, label, collapsed, badge, onNavigate }: {
  href: string; icon: string; label: string; collapsed: boolean; badge?: number; onNavigate?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center rounded-xl transition-all relative"
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
      {badge !== undefined && badge > 0 && (
        <span
          className="absolute flex items-center justify-center text-white font-bold rounded-full"
          style={{
            top: collapsed ? 2 : 6,
            right: collapsed ? 8 : 8,
            minWidth: 18, height: 18,
            fontSize: 10,
            background: '#FF5C1B',
            lineHeight: 1,
            padding: '0 4px',
          }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}

export function CoachSidebar({
  collapsed, onToggle, coachName, coachPlan, coachAvatar,
  unreadFeedback, unreadMessages, mobileOpen, onMobileClose,
}: Props) {
  const w = collapsed ? '64px' : '256px'
  const isExpanded = !collapsed || mobileOpen

  const badgeMap: Record<string, number> = {
    feedback: unreadFeedback,
    messages: unreadMessages,
  }

  return (
    <aside
      role="navigation"
      aria-label="Menu główne"
      className={`h-screen flex flex-col fixed left-0 top-0 z-50 transition-all duration-200 overflow-hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      style={{ width: mobileOpen ? '256px' : w, background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className={`flex border-b shrink-0 ${!isExpanded ? 'flex-col items-center justify-center gap-2 py-3 px-2' : 'items-center justify-between px-4 py-5'}`}
        style={{ borderColor: 'var(--border)', minHeight: '72px' }}
      >
        {isExpanded && (
          <Link href="/" onClick={onMobileClose}>
            <Logo size="md" />
          </Link>
        )}
        {!isExpanded && <LogoMark size={28} />}
        <button
          onClick={mobileOpen ? onMobileClose : onToggle}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          title={mobileOpen ? 'Zamknij menu' : collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
          aria-label={mobileOpen ? 'Zamknij menu' : collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
        >
          <span className="text-sm leading-none">{mobileOpen ? '✕' : collapsed ? '→' : '←'}</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
        <ul className="space-y-0.5">
          <li><NavLink href="/coach/dashboard" icon="🏠" label="Dashboard" collapsed={!isExpanded} onNavigate={onMobileClose} /></li>
        </ul>

        <div className="space-y-4">
          {navSections.map(section => (
            <div key={section.label}>
              {isExpanded && (
                <div className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  {section.label}
                </div>
              )}
              {!isExpanded && <div className="border-t mx-2 mb-1" style={{ borderColor: 'var(--border)' }} />}
              <ul className="space-y-0.5">
                {section.items.map(item => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      collapsed={!isExpanded}
                      badge={item.badgeKey ? badgeMap[item.badgeKey] : undefined}
                      onNavigate={onMobileClose}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-auto">
          {isExpanded && <div className="border-t mb-2 mx-1" style={{ borderColor: 'var(--border)' }} />}
          <ul className="space-y-0.5">
            {bottomItems.map(item => (
              <li key={item.href}>
                <NavLink href={item.href} icon={item.icon} label={item.label} collapsed={!isExpanded} onNavigate={onMobileClose} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
        {!isExpanded ? (
          <div className="flex flex-col items-center gap-2">
            <Link href="/coach/settings" title="Ustawienia profilu" className="hover:opacity-80 transition-opacity cursor-pointer">
              <CoachAvatarEl avatar={coachAvatar} name={coachName} size="sm" />
            </Link>
            <form action={logout}>
              <button
                type="submit"
                title="Wyloguj"
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:opacity-80"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '12px' }}
              >
                ↩
              </button>
            </form>
          </div>
        ) : (
          <>
            <Link href="/coach/settings" onClick={onMobileClose} className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-subtle)' }}>
              <CoachAvatarEl avatar={coachAvatar} name={coachName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{coachName}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Plan {planLabel(coachPlan)}</div>
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
