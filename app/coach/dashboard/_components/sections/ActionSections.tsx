'use client'

import { Card } from '@/components/ui/Card'
import { formatCurrency, plural } from '@/lib/utils'
import Link from 'next/link'

type ActionItem = {
  id: string
  title: string
  description: string
  tone: 'neutral' | 'warning' | 'danger'
  href: string
  cta: string
}

const TONE_STYLES = {
  neutral: {
    border: 'rgba(255,255,255,0.08)',
    badgeBg: 'rgba(255,255,255,0.08)',
    badgeColor: 'var(--text-primary)',
  },
  warning: {
    border: 'rgba(241,196,15,0.35)',
    badgeBg: 'rgba(241,196,15,0.12)',
    badgeColor: '#F1C40F',
  },
  danger: {
    border: 'rgba(231,76,60,0.35)',
    badgeBg: 'rgba(231,76,60,0.12)',
    badgeColor: '#E74C3C',
  },
} as const

export function TodayActionsSection({
  unreadFeedbackCount,
  unreadMessagesCount,
  overdueInvoiceCount,
  overdueAmount,
  noPlanCount,
  raceSoonCount,
}: {
  unreadFeedbackCount: number
  unreadMessagesCount: number
  overdueInvoiceCount: number
  overdueAmount: number
  noPlanCount: number
  raceSoonCount: number
}) {
  const items: ActionItem[] = []

  if (unreadFeedbackCount > 0) {
    items.push({
      id: 'feedback',
      title: `${unreadFeedbackCount} ${plural(unreadFeedbackCount, 'feedback czeka', 'feedbacki czekają', 'feedbacków czeka')} na przeczytanie`,
      description: 'Warto przejrzeć nowe sygnały od zawodników i odpowiedzieć tam, gdzie trzeba.',
      tone: unreadFeedbackCount >= 3 ? 'warning' : 'neutral',
      href: '/coach/feedback',
      cta: 'Otwórz feedback',
    })
  }

  if (unreadMessagesCount > 0) {
    items.push({
      id: 'messages',
      title: `${unreadMessagesCount} ${plural(unreadMessagesCount, 'wiadomość czeka', 'wiadomości czekają', 'wiadomości czeka')} na odpowiedź`,
      description: 'Zawodnicy napisali i jeszcze nie dostali odpowiedzi.',
      tone: unreadMessagesCount >= 3 ? 'warning' : 'neutral',
      href: '/coach/chat',
      cta: 'Otwórz czat',
    })
  }

  if (overdueInvoiceCount > 0) {
    items.push({
      id: 'payments',
      title: `${overdueInvoiceCount} ${plural(overdueInvoiceCount, 'płatność jest', 'płatności są', 'płatności jest')} po terminie`,
      description: `${formatCurrency(overdueAmount)} wymaga przypomnienia lub kontaktu z zawodnikiem.`,
      tone: 'danger',
      href: '/coach/invoices',
      cta: 'Sprawdź płatności',
    })
  }

  if (noPlanCount > 0) {
    items.push({
      id: 'planning',
      title: `${noPlanCount} ${plural(noPlanCount, 'zawodnik nie ma', 'zawodników nie ma', 'zawodników nie ma')} planu do końca tygodnia`,
      description: 'Uzupełnij plan, żeby nikt nie został bez rozpiski na najbliższe dni.',
      tone: 'warning',
      href: '/coach/planner',
      cta: 'Otwórz planer',
    })
  }

  if (raceSoonCount > 0) {
    items.push({
      id: 'races',
      title: `${raceSoonCount} ${plural(raceSoonCount, 'start jest', 'starty są', 'startów jest')} dziś lub jutro`,
      description: 'Sprawdź, czy zawodnicy mają jasne wskazówki na ostatnie godziny przed startem.',
      tone: 'neutral',
      href: '/coach/athletes',
      cta: 'Zobacz zawodników',
    })
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-semibold">Najważniejsze na dziś</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Ten blok pokazuje sprawy, które najbardziej wymagają reakcji.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/coach/planner" className="px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-elevated)' }}>
            Otwórz planer
          </Link>
          <Link href="/coach/chat" className="px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-elevated)' }}>
            Otwórz czat
          </Link>
          <Link href="/coach/invoices" className="px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-elevated)' }}>
            Otwórz płatności
          </Link>
          <Link href="/coach/athletes" className="px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-elevated)' }}>
            Otwórz zawodników
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl p-5 text-sm"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
          Wszystko wygląda spokojnie. Nie ma dziś pilnych spraw na dashboardzie.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-3">
          {items.map((item) => {
            const styles = TONE_STYLES[item.tone]
            return (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-2xl p-4 hover:opacity-85 transition-opacity"
                style={{ background: 'var(--bg-elevated)', border: `1px solid ${styles.border}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{item.title}</div>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold"
                    style={{ background: styles.badgeBg, color: styles.badgeColor }}>
                    {item.cta}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
