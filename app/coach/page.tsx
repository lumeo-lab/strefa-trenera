'use client'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { athletes, sessions, feedbacks, businessKpis } from '@/lib/data'
import { formatDate, statusColor } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const alertAthletes = athletes.filter(a => a.status === 'alert' || a.status === 'warning')
  const unreadFeedbacks = feedbacks.filter(f => !f.read).length

  return (
    <div>
      <CoachTopbar title="Dashboard" subtitle="Przegląd wszystkich zawodników" />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'MRR', value: `${businessKpis.mrr.toLocaleString('pl-PL')} zł`, trend: '+12%', up: true },
            { label: 'Aktywni zawodnicy', value: businessKpis.activeAthletes, trend: '+1 ten miesiąc', up: true },
            { label: 'Rate feedbacku', value: `${businessKpis.feedbackRate}%`, trend: 'Ostatnie 7 dni', up: true },
          ].map(kpi => (
            <Card key={kpi.label} className="p-5">
              <div className="text-sm mb-1" style={{ color: '#8A92A8' }}>{kpi.label}</div>
              <div className="text-2xl font-bold mb-1">{kpi.value}</div>
              <div className="text-xs" style={{ color: kpi.up ? '#2ECC71' : '#E74C3C' }}>{kpi.trend}</div>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        {alertAthletes.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,92,27,0.08)', border: '1px solid rgba(255,92,27,0.2)' }}>
            <div className="text-sm font-semibold mb-3" style={{ color: '#FF5C1B' }}>⚠️ Alerty priorytetowe</div>
            <div className="space-y-2">
              {alertAthletes.map(a => (
                <Link key={a.id} href={`/coach/athletes/${a.id}`} className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5">
                  <Avatar initials={a.avatar} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs" style={{ color: '#8A92A8' }}>{a.alertMessage}</div>
                  </div>
                  <Badge variant={a.status === 'alert' ? 'red' : 'yellow'}>{a.status === 'alert' ? 'Alert' : 'Uwaga'}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Athletes grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Zawodnicy</h2>
            <div className="flex items-center gap-2">
              {unreadFeedbacks > 0 && (
                <Link href="/coach/feedback">
                  <Badge variant="orange">{unreadFeedbacks} nowych feedbacków</Badge>
                </Link>
              )}
              <Link href="/coach/athletes" className="text-sm transition-colors hover:text-white" style={{ color: '#8A92A8' }}>
                Zobacz wszystkich →
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {athletes.map(athlete => {
              const lastSession = sessions.filter(s => s.athleteId === athlete.id && s.completed).sort((a, b) => b.date.localeCompare(a.date))[0]
              const nextSession = sessions.filter(s => s.athleteId === athlete.id && !s.completed && s.date >= '2026-02-28').sort((a, b) => a.date.localeCompare(b.date))[0]
              const recentFeedbacks = feedbacks.filter(f => f.athleteId === athlete.id).slice(0, 1)

              return (
                <Link key={athlete.id} href={`/coach/athletes/${athlete.id}`}>
                  <Card className="p-5 hover:border-white/20 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={athlete.avatar} />
                        <div>
                          <div className="font-medium text-sm group-hover:text-orange-400 transition-colors">{athlete.name}</div>
                          <div className="text-xs" style={{ color: '#8A92A8' }}>{athlete.package}</div>
                        </div>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${statusColor(athlete.status)}`} />
                    </div>

                    <div className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: '#8A92A8' }}>
                      🎯 {athlete.goal}
                    </div>

                    <div className="space-y-1.5 text-xs" style={{ color: '#8A92A8' }}>
                      {lastSession && (
                        <div className="flex items-center justify-between">
                          <span>Ostatni trening</span>
                          <span>{formatDate(lastSession.date, { day: 'numeric', month: 'short' })}</span>
                        </div>
                      )}
                      {nextSession && (
                        <div className="flex items-center justify-between">
                          <span>Następny</span>
                          <span>{formatDate(nextSession.date, { day: 'numeric', month: 'short' })}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Ostatni kontakt</span>
                        <span>{athlete.lastContact === 0 ? 'dziś' : `${athlete.lastContact} dni temu`}</span>
                      </div>
                    </div>

                    {athlete.alertMessage && (
                      <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                        ⚠️ {athlete.alertMessage}
                      </div>
                    )}

                    {recentFeedbacks.length > 0 && (
                      <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: '#8A92A8' }}>
                        💬 {recentFeedbacks[0].aiSummary}
                      </div>
                    )}
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
