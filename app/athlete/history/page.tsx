'use client'
import { sessions, feedbacks } from '@/lib/data'
import { formatDate, intensityColor, sessionTypeLabel } from '@/lib/utils'

const ATHLETE_ID = 'a1'

export default function AthleteHistoryPage() {
  const completedSessions = sessions
    .filter(s => s.athleteId === ATHLETE_ID && s.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20)

  const totalKm = sessions.filter(s => s.athleteId === ATHLETE_ID && s.actualDistance).reduce((sum, s) => sum + (s.actualDistance || 0), 0)
  const totalSessions = sessions.filter(s => s.athleteId === ATHLETE_ID && s.completed).length
  const avgHR = sessions.filter(s => s.athleteId === ATHLETE_ID && s.avgHR).reduce((sum, s, _, arr) => sum + (s.avgHR || 0) / arr.length, 0)

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold">Historia treningów</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Ostatnie {completedSessions.length} treningów</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        {[
          ['🏃', totalSessions, 'treningów'],
          ['📏', `${totalKm.toFixed(0)} km`, 'łącznie'],
          ['❤️', `${Math.round(avgHR)} bpm`, 'śr. tętno'],
        ].map(([icon, value, label]) => (
          <div key={label as string} className="p-3 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-base font-bold">{value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar chart — last 6 weeks km */}
      <div className="mx-5 mb-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>km tygodniowo</div>
        <div className="flex items-end gap-2 h-16">
          {['tyg-6', 'tyg-5', 'tyg-4', 'tyg-3', 'tyg-2', 'tyg-1'].map((label, i) => {
            const heights = [35, 45, 52, 60, 68, 75]
            const h = heights[i]
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg transition-all" style={{ height: `${h}%`, background: i === 5 ? '#FF5C1B' : 'var(--border-strong)' }} />
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{`-${6 - i}W`}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session list */}
      <div className="px-5 space-y-3">
        {completedSessions.map(session => {
          const fb = feedbacks.find(f => f.sessionId === session.id)
          return (
            <div key={session.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className={`px-4 py-3 ${intensityColor(session.type)}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{session.title}</span>
                  <span className="text-xs opacity-70">{formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex gap-3 text-xs opacity-70">
                  {session.actualDistance && <span>📏 {session.actualDistance} km</span>}
                  {session.actualDuration && <span>⏱️ {session.actualDuration} min</span>}
                  {session.actualPace && <span>⚡ {session.actualPace}/km</span>}
                  {session.avgHR && <span>❤️ {session.avgHR} bpm</span>}
                </div>
              </div>

              {fb && (
                <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--bg-subtle)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    {fb.source === 'voice' ? '🎤' : fb.source === 'text' ? '✏️' : '⌚'} Twój feedback
                  </div>
                  <div className="text-xs line-clamp-2" style={{ color: 'var(--text-primary)' }}>{fb.aiSummary}</div>
                  {fb.coachReply && (
                    <div className="mt-2 text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(46,204,113,0.08)', color: '#2ECC71' }}>
                      💬 Trener: {fb.coachReply}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
