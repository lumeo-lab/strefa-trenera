'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { statusColor, formatDate } from '@/lib/utils'
import { createAthlete } from '@/lib/actions/athletes'
import Link from 'next/link'

interface Athlete {
  id: string
  name: string
  avatar: string
  goal: string
  package: string
  package_price: number
  status: string
  email: string | null
  phone: string | null
  slug: string
  join_date: string
  created_at: string
}

interface Props {
  athletes: Athlete[]
  lastSessionMap: Record<string, string>
  weeklyLoadMap: Record<string, number>
}

export function AthletesClient({ athletes, lastSessionMap, weeklyLoadMap }: Props) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createAthlete, null)

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.goal ?? '').toLowerCase().includes(search.toLowerCase()) ||
    a.package.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <CoachTopbar
        title="Zawodnicy"
        subtitle={`${athletes.length} ${athletes.length === 1 ? 'zawodnik' : 'zawodników'}`}
      />

      <div className="p-6">
        {/* Search + Add */}
        <div className="flex items-center gap-3 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj zawodnika..."
            className="max-w-sm px-4 py-2.5 rounded-xl text-sm flex-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
          />
          <Button size="sm" onClick={() => setModalOpen(true)}>+ Dodaj zawodnika</Button>
        </div>

        {/* Empty state */}
        {athletes.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">👟</div>
            <div className="text-lg font-semibold mb-2">Brak zawodników</div>
            <div className="text-sm mb-6">Dodaj pierwszego zawodnika i wyślij mu link zaproszenia</div>
            <Button onClick={() => setModalOpen(true)}>+ Dodaj zawodnika</Button>
          </div>
        )}

        {/* Table */}
        {athletes.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Zawodnik</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Cel</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Obciążenie (7 dni)</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Pakiet</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Ostatni trening</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((athlete, i) => {
                  const lastSession = lastSessionMap[athlete.id]
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
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{athlete.email ?? '—'}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--text-muted)' }}>{athlete.goal || '—'}</td>
                      <td className="px-5 py-4">
                        {weeklyLoadMap[athlete.id] ? (
                          <span className="text-sm font-medium">{weeklyLoadMap[athlete.id].toFixed(0)} km</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={athlete.package === 'Pro' ? 'orange' : athlete.package === 'Standard' ? 'blue' : 'gray'}>
                          {athlete.package}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${statusColor(athlete.status as 'ok' | 'warning' | 'alert' | 'inactive')}`} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {athlete.status === 'ok' ? 'OK' : athlete.status === 'warning' ? 'Uwaga' : athlete.status === 'alert' ? 'Alert' : 'Nieaktywny'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--text-muted)' }}>
                        {lastSession ? formatDate(lastSession, { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Athlete Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Dodaj zawodnika">
        <form action={async (fd) => {
          await formAction(fd)
          if (!state?.error) setModalOpen(false)
        }}>
          <div className="space-y-4">
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Imię i nazwisko *</label>
              <input name="name" required placeholder="np. Katarzyna Wiśniewska"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input name="email" type="email" placeholder="np. katarzyna@email.com"
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Telefon</label>
                <input name="phone" placeholder="np. 600 123 456"
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Cel treningowy</label>
              <input name="goal" placeholder="np. Maraton sub 4h"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Pakiet</label>
                <select name="package" className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}>
                  <option value="Starter">Starter</option>
                  <option value="Standard">Standard</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Cena (zł/mies.)</label>
                <input name="package_price" type="number" defaultValue="249" min="0"
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            {state?.error && (
              <p className="text-xs text-red-400">{state.error}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Anuluj</Button>
              <Button type="submit" disabled={pending}>{pending ? 'Dodawanie...' : 'Dodaj zawodnika'}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
