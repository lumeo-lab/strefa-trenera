'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import { restoreAthlete } from '@/lib/actions/athletes'
import { formatDate } from '@/lib/utils'
import { INPUT_STYLE } from '@/lib/styles'
import type { ArchivedAthlete } from './SettingsClient'

interface SettingsArchiveTabProps {
  archivedAthletes: ArchivedAthlete[]
}

export function SettingsArchiveTab({ archivedAthletes }: SettingsArchiveTabProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()

  const filtered = archivedAthletes.filter((athlete) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return athlete.name.toLowerCase().includes(q) || (athlete.email ?? '').toLowerCase().includes(q) || athlete.package.toLowerCase().includes(q)
  })

  const confirmAthlete = archivedAthletes.find(a => a.id === confirmRestoreId)

  async function handleRestore(id: string, athleteName: string) {
    setRestoringId(id)
    setConfirmRestoreId(null)
    clearStatus()
    try {
      const result = await restoreAthlete(id)
      if (result && 'error' in result) {
        showStatus('error', result.error ?? 'Nie udało się przywrócić zawodnika.')
        return
      }
      showStatus('success', `Przywrócono zawodnika: ${athleteName}.`)
      router.refresh()
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <>
      {statusMessage && (
        <StatusMessage tone={statusMessage.tone} text={statusMessage.text} className="mb-6" />
      )}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-5">
          <div>
            <h3 className="font-semibold">Archiwum zawodników</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Tutaj trafiają zawodnicy przeniesieni z aktywnej bazy. Nie są już widoczni w bieżącej pracy trenera.
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj w archiwum..."
            className="w-full sm:w-72 px-3 py-2.5 rounded-xl text-sm"
            style={INPUT_STYLE}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl px-4 py-10 text-sm text-center" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {archivedAthletes.length === 0 ? 'Archiwum jest puste.' : 'Brak zawodników pasujących do wyszukiwania.'}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-3" style={{ color: 'var(--text-muted)' }}>Zawodnik</th>
                  <th className="text-left px-4 py-3" style={{ color: 'var(--text-muted)' }}>Pakiet</th>
                  <th className="text-left px-4 py-3" style={{ color: 'var(--text-muted)' }}>Dołączył</th>
                  <th className="text-left px-4 py-3" style={{ color: 'var(--text-muted)' }}>Zarchiwizowano</th>
                  <th className="text-right px-4 py-3" style={{ color: 'var(--text-muted)' }}>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((athlete, index) => (
                  <tr key={athlete.id} style={{ borderBottom: index < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{athlete.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{athlete.email || 'Brak emaila'}</div>
                    </td>
                    <td className="px-4 py-3">{athlete.package || '—'}</td>
                    <td className="px-4 py-3">{athlete.join_date ? formatDate(athlete.join_date, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="px-4 py-3">{athlete.archived_at ? formatDate(athlete.archived_at, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/coach/athletes/${athlete.id}`}
                          className="px-3 py-2 rounded-xl text-sm"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          Profil
                        </Link>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={restoringId === athlete.id}
                          onClick={() => setConfirmRestoreId(athlete.id)}
                        >
                          {restoringId === athlete.id ? 'Przywracanie...' : 'Przywróć'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirmRestoreId}
        onClose={() => setConfirmRestoreId(null)}
        onConfirm={() => {
          if (confirmRestoreId && confirmAthlete) {
            void handleRestore(confirmRestoreId, confirmAthlete.name)
          }
        }}
        title="Przywracanie zawodnika"
        message={`Czy na pewno chcesz przywrócić zawodnika ${confirmAthlete?.name ?? ''} do aktywnej bazy?`}
        confirmLabel="Tak, przywróć"
      />
    </>
  )
}
