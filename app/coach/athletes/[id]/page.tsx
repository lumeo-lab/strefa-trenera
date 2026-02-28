'use client'
import { useState } from 'react'
import { use } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { athletes, sessions, feedbacks, invoices } from '@/lib/data'
import { formatDate, formatCurrency, intensityColor, sessionTypeLabel, invoiceStatusColor, invoiceStatusLabel, signalColor } from '@/lib/utils'
import Link from 'next/link'

export default function AthleteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState('plan')

  const athlete = athletes.find(a => a.id === id)
  if (!athlete) return <div className="p-6">Zawodnik nie znaleziony</div>

  const athleteSessions = sessions.filter(s => s.athleteId === id).sort((a, b) => b.date.localeCompare(a.date))
  const athleteFeedbacks = feedbacks.filter(f => f.athleteId === id).sort((a, b) => b.date.localeCompare(a.date))
  const athleteInvoices = invoices.filter(inv => inv.athleteId === id).sort((a, b) => b.date.localeCompare(a.date))

  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'history', label: 'Historia' },
    { id: 'data', label: 'Dane' },
    { id: 'finance', label: 'Finanse' },
  ]

  // Week sessions for plan tab
  const today = '2026-02-28'
  const upcomingSessions = athleteSessions.filter(s => s.date >= today && !s.completed).slice(0, 7)

  // SVG bar chart for km per week
  const completedSessions = athleteSessions.filter(s => s.completed && s.actualDistance)
  const totalKm = completedSessions.reduce((sum, s) => sum + (s.actualDistance || 0), 0)

  const totalPaid = athleteInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const monthsActive = Math.ceil((new Date('2026-02-28').getTime() - new Date(athlete.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))

  return (
    <div>
      <CoachTopbar
        title={athlete.name}
        subtitle={`${athlete.goal} · ${athlete.package}`}
        actions={
          <Link href="/coach/athletes" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← Zawodnicy
          </Link>
        }
      />

      <div className="p-6">
        {/* Profile header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-5">
            <Avatar initials={athlete.avatar} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{athlete.name}</h2>
                <Badge variant={athlete.package === 'Pro' ? 'orange' : athlete.package === 'Standard' ? 'blue' : 'gray'}>{athlete.package} — {formatCurrency(athlete.packagePrice)}/mies.</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>🎯 {athlete.goal}</span>
                <span>📍 {athlete.city}</span>
                <span>🎂 {athlete.age} lat</span>
                <span>📅 Od {formatDate(athlete.joinDate, { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-2xl font-bold">{formatCurrency(totalKm)}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>km łącznie</div>
            </div>
          </div>
        </Card>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Plan tab */}
        {activeTab === 'plan' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Nadchodzące sesje</h3>
              <div className="space-y-2">
                {upcomingSessions.length === 0 && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak zaplanowanych sesji</div>}
                {upcomingSessions.map(session => (
                  <div key={session.id} className={`p-3 rounded-xl border text-sm ${intensityColor(session.type)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{session.title}</span>
                      <span className="text-xs opacity-70">{formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex gap-3 text-xs opacity-70">
                      {session.plannedDistance && <span>{session.plannedDistance} km</span>}
                      {session.plannedDuration && <span>{session.plannedDuration} min</span>}
                      {session.plannedPace && <span>@{session.plannedPace}/km</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Notatki trenera</h3>
              <Card className="p-4">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{athlete.coachNotes}</p>
              </Card>
              {athlete.injuries.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-3">Historia kontuzji</h3>
                  <div className="space-y-2">
                    {athlete.injuries.map(injury => (
                      <div key={injury} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                        ⚠️ {injury}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Łącznie sesji', value: athleteSessions.filter(s => s.completed).length },
                { label: 'Łącznie km', value: `${totalKm.toFixed(0)} km` },
                { label: 'Feedbacków', value: athleteFeedbacks.length },
                { label: 'Ukończenie', value: `${Math.round((athleteSessions.filter(s => s.completed).length / Math.max(athleteSessions.length, 1)) * 100)}%` },
              ].map(stat => (
                <Card key={stat.label} className="p-4 text-center">
                  <div className="text-xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                </Card>
              ))}
            </div>

            {/* Session table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Data</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Sesja</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Typ</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Dystans</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Tempo</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>HR</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {athleteSessions.slice(0, 20).map((session, i) => (
                    <tr key={session.id} style={{ borderBottom: i < athleteSessions.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(session.date, { day: 'numeric', month: 'short' })}</td>
                      <td className="px-4 py-3 font-medium text-xs">{session.title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${intensityColor(session.type)}`}>{sessionTypeLabel(session.type)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {session.actualDistance ? `${session.actualDistance} km` : session.plannedDistance ? `(${session.plannedDistance} km)` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {session.actualPace || session.plannedPace || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {session.avgHR ? `${session.avgHR} bpm` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {session.completed
                          ? <span className="text-xs text-green-400">✓ Wykonany</span>
                          : session.date < '2026-02-28'
                          ? <span className="text-xs text-red-400">✗ Pominięty</span>
                          : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Planowany</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Data tab */}
        {activeTab === 'data' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Dane osobowe</h3>
                <div className="space-y-3 text-sm">
                  {[
                    ['Imię i nazwisko', athlete.name],
                    ['Email', athlete.email],
                    ['Telefon', athlete.phone],
                    ['Wiek', `${athlete.age} lat`],
                    ['Miasto', athlete.city],
                    ['Dołączył/a', formatDate(athlete.joinDate)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-4">Rekordy osobiste</h3>
                <div className="space-y-2">
                  {Object.entries(athlete.personalBests).map(([dist, time]) => (
                    <div key={dist} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{dist}</span>
                      <span className="font-semibold text-sm" style={{ color: '#FF5C1B' }}>{time}</span>
                    </div>
                  ))}
                  {Object.keys(athlete.personalBests).length === 0 && (
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Brak rekordów</div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-3">Notatki trenera</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{athlete.coachNotes}</p>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-3">Historia kontuzji</h3>
                {athlete.injuries.length === 0 ? (
                  <p className="text-sm text-green-400">Brak odnotowanych kontuzji</p>
                ) : (
                  <div className="space-y-2">
                    {athlete.injuries.map(injury => (
                      <div key={injury} className="px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                        ⚠️ {injury}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-3">Ostatnie feedbacki</h3>
                <div className="space-y-2">
                  {athleteFeedbacks.slice(0, 3).map(fb => (
                    <div key={fb.id} className={`p-3 rounded-xl border-l-2 text-sm ${signalColor(fb.signal)}`} style={{ background: 'var(--bg-subtle)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{formatDate(fb.date, { day: 'numeric', month: 'short' })}</div>
                      <div>{fb.aiSummary}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Finance tab */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Pakiet', value: `${athlete.package} — ${formatCurrency(athlete.packagePrice)}/mies.` },
                { label: 'Łącznie zapłacono', value: formatCurrency(totalPaid) },
                { label: 'Miesięcy aktywny/a', value: monthsActive },
              ].map(kpi => (
                <Card key={kpi.label} className="p-4">
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
                  <div className="text-xl font-bold">{kpi.value}</div>
                </Card>
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Nr faktury</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Opis</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Data</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Kwota</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {athleteInvoices.map((inv, i) => (
                    <tr key={inv.id} style={{ borderBottom: i < athleteInvoices.length - 1 ? '1px solid var(--bg-subtle)' : 'none' }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{inv.number}</td>
                      <td className="px-4 py-3 text-xs">{inv.description}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(inv.date, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(inv.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${invoiceStatusColor(inv.status)}`}>{invoiceStatusLabel(inv.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
