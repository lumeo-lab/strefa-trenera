'use client'
import { useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { athletes, sessions } from '@/lib/data'
import { statusColor, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function AthletesPage() {
  const [search, setSearch] = useState('')

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.goal.toLowerCase().includes(search.toLowerCase()) ||
    a.package.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <CoachTopbar title="Zawodnicy" subtitle={`${athletes.length} aktywnych`} />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj zawodnika..."
            className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', color: '#E8EAF0' }}
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Zawodnik</th>
                <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Cel</th>
                <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Pakiet</th>
                <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Ostatni trening</th>
                <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Kontakt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((athlete, i) => {
                const lastSession = sessions.filter(s => s.athleteId === athlete.id && s.completed).sort((a, b) => b.date.localeCompare(a.date))[0]
                return (
                  <tr
                    key={athlete.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--bg-subtle)' : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : undefined }}
                  >
                    <td className="px-5 py-4">
                      <Link href={`/coach/athletes/${athlete.id}`} className="flex items-center gap-3 hover:text-orange-400 transition-colors">
                        <Avatar initials={athlete.avatar} size="sm" />
                        <div>
                          <div className="font-medium">{athlete.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{athlete.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--text-muted)' }}>{athlete.goal}</td>
                    <td className="px-5 py-4">
                      <Badge variant={athlete.package === 'Pro' ? 'orange' : athlete.package === 'Standard' ? 'blue' : 'gray'}>
                        {athlete.package}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusColor(athlete.status)}`} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {athlete.status === 'ok' ? 'OK' : athlete.status === 'warning' ? 'Uwaga' : athlete.status === 'alert' ? 'Alert' : 'Nieaktywny'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--text-muted)' }}>
                      {lastSession ? formatDate(lastSession.date, { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs ${athlete.lastContact > 5 ? 'text-red-400' : athlete.lastContact > 2 ? 'text-yellow-400' : ''}`} style={{ color: athlete.lastContact <= 2 ? 'var(--text-muted)' : undefined }}>
                        {athlete.lastContact === 0 ? 'dziś' : `${athlete.lastContact} dni temu`}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
