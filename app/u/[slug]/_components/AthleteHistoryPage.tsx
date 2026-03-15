'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { intensityColor, sessionTypeLabel, formatDate } from '@/lib/utils'
import { AthleteBottomNav } from './AthleteBottomNav'
import { AthleteSession } from '@/lib/athlete-auth'
import { DbRow } from '@/lib/types'

interface Props {
  athlete: AthleteSession
  sessions: DbRow[]
  stravaConnected: boolean
  stravaActivities: DbRow[]
  stravaStatus?: string
  stravaMsg?: string
}

function shiftMonth(m: string, d: number): string {
  const [y, mo] = m.split('-').map(Number)
  const dt = new Date(y, mo - 1 + d, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

function formatPace(metersPerSec: number): string {
  if (!metersPerSec) return ''
  const secPerKm = 1000 / metersPerSec
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${String(sec).padStart(2, '0')}/km`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

export function AthleteHistoryPage({ athlete, sessions, stravaConnected, stravaActivities, stravaStatus, stravaMsg }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [tab, setTab] = useState<'plan' | 'strava'>('plan')
  const [syncing, setSyncing] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/strava/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athlete.id }),
      })
      startTransition(() => router.refresh())
    } finally {
      setSyncing(false)
    }
  }

  const monthSessions = sessions.filter(s => s.date.slice(0, 7) === selectedMonth)
  const monthStrava = stravaActivities.filter(a => a.start_date.slice(0, 7) === selectedMonth)

  const totalKm = sessions.reduce((s, sess) => s + (sess.actual_distance || 0), 0)
  const totalMin = sessions.reduce((s, sess) => s + (sess.actual_duration || 0), 0)

  const stravaAuthUrl = `/api/strava/auth?slug=${athlete.slug}`

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{athlete.name}</div>
        <h1 className="text-xl font-bold">Historia treningów</h1>
      </div>

      <div className="p-5 space-y-4">

        {/* Strava status banners */}
        {stravaStatus === 'connected' && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(252,76,2,0.1)', border: '1px solid rgba(252,76,2,0.3)', color: '#FC4C02' }}>
            ✓ Strava połączona! Twoje aktywności zostały zsynchronizowane.
          </div>
        )}
        {stravaStatus === 'denied' && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            Odmówiłeś dostępu do Stravy.
          </div>
        )}
        {stravaStatus === 'error' && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            <div className="font-medium">Błąd połączenia ze Stravą</div>
            {stravaMsg && <div className="mt-1 text-xs opacity-80 break-all">{stravaMsg}</div>}
          </div>
        )}

        {/* Connect Strava */}
        {!stravaConnected && (
          <a href={stravaAuthUrl}
            className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
            style={{ background: '#FC4C02', color: 'white', textDecoration: 'none' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Strava_Logo.svg/120px-Strava_Logo.svg.png"
              alt="Strava" style={{ height: '20px', filter: 'brightness(0) invert(1)' }} />
            <div>
              <div className="font-semibold text-sm">Połącz ze Stravą</div>
              <div className="text-xs opacity-80">Automatycznie importuj swoje biegi</div>
            </div>
          </a>
        )}

        {/* Connected Strava badge + sync button */}
        {stravaConnected && (
          <div className="flex items-center justify-between px-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(252,76,2,0.08)', border: '1px solid rgba(252,76,2,0.2)', color: '#FC4C02' }}>
            <div className="flex items-center gap-2">
              <span>🟠</span>
              <span className="font-medium">Strava połączona</span>
            </div>
            <button onClick={handleSync} disabled={syncing}
              className="text-xs px-3 py-1 rounded-lg cursor-pointer"
              style={{ background: '#FC4C02', color: 'white', border: 'none', opacity: syncing ? 0.6 : 1 }}>
              {syncing ? 'Synchronizuję...' : '↻ Odśwież'}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sesji', value: sessions.length },
            { label: 'Łącznie km', value: `${totalKm.toFixed(0)}` },
            { label: 'Łącznie godz.', value: `${Math.floor(totalMin / 60)}h ${totalMin % 60}min` },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xl font-bold mb-0.5">{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        {stravaConnected && (
          <div className="flex gap-2">
            {(['plan', 'strava'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                style={{
                  background: tab === t ? '#FF5C1B' : 'var(--bg-card)',
                  color: tab === t ? 'white' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}>
                {t === 'plan' ? 'Plan trenera' : 'Strava'}
              </button>
            ))}
          </div>
        )}

        {/* Month navigation */}
        <div className="flex items-center justify-between py-2 px-1">
          <button onClick={() => setSelectedMonth(m => shiftMonth(m, -1))}
            className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>←</button>
          <span className="text-sm font-bold capitalize">{monthLabel(selectedMonth)}</span>
          <button onClick={() => setSelectedMonth(m => shiftMonth(m, 1))}
            className="px-3 py-1.5 rounded-xl text-sm cursor-pointer"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>→</button>
        </div>

        {/* Plan sessions */}
        {tab === 'plan' && (
          monthSessions.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <div className="text-5xl mb-3">📊</div>
              <div>Brak sesji w tym miesiącu</div>
            </div>
          ) : (
            <div className="space-y-2">
              {monthSessions.map(s => (
                <div key={s.id} className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                      <div className="font-semibold text-sm mt-0.5">{s.title}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${intensityColor(s.type)}`}>{sessionTypeLabel(s.type)}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {s.actual_distance && <span>📏 {s.actual_distance} km</span>}
                    {s.actual_duration && <span>⏱️ {s.actual_duration} min</span>}
                    {s.actual_pace && <span>⚡ {s.actual_pace}/km</span>}
                    {s.avg_hr && <span>❤️ {s.avg_hr} bpm</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Strava activities */}
        {tab === 'strava' && (
          monthStrava.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <div className="text-5xl mb-3">🟠</div>
              <div>Brak aktywności Strava w tym miesiącu</div>
            </div>
          ) : (
            <div className="space-y-2">
              {monthStrava.map(a => (
                <div key={a.id} className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(a.start_date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div className="font-semibold text-sm mt-0.5">{a.name}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(252,76,2,0.12)', color: '#FC4C02' }}>
                      Strava
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {a.distance && <span>📏 {(a.distance / 1000).toFixed(2)} km</span>}
                    {a.moving_time && <span>⏱️ {formatDuration(a.moving_time)}</span>}
                    {a.average_speed && <span>⚡ {formatPace(a.average_speed)}</span>}
                    {a.average_heartrate && <span>❤️ {Math.round(a.average_heartrate)} bpm</span>}
                    {a.total_elevation_gain != null && <span>⛰️ {Math.round(a.total_elevation_gain)} m</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>

      <AthleteBottomNav slug={athlete.slug} />
    </div>
  )
}
