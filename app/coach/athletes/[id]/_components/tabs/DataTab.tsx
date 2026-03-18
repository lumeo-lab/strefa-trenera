'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { archiveAthlete, updateAthlete } from '@/lib/actions/athletes'
import { type AthleteInjuryRecord, getActiveAthleteInjuries, parseAthleteInjuryHistory } from '@/lib/athlete-injuries'
import { getBusinessToday } from '@/lib/date'
import { INPUT_STYLE } from '@/lib/styles'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { CoachAthleteRow, CoachPackageRow } from '../types'

const inputStyle = INPUT_STYLE
const DEFAULT_PB_DISTANCES = ['5 km', '10 km', 'Półmaraton', 'Maraton']

function todayInputValue(): string {
  return getBusinessToday()
}

function formatInjuryRange(startedAt: string | null, endedAt: string | null): string {
  const from = startedAt ? formatDate(startedAt, { day: 'numeric', month: 'short', year: 'numeric' }) : 'brak daty startu'
  if (!endedAt) return `od ${from}`
  return `${from} → ${formatDate(endedAt, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

interface DataTabProps {
  athlete: CoachAthleteRow
  packages: CoachPackageRow[]
  accessInfo: {
    inviteUsedAt: string | null
    hasActiveSession: boolean
    lastSeenAt: string | null
    sessionCreatedAt: string | null
  }
  inviteUrl: string
  inviteError: string | null
  linkCopied: boolean
  onCopyInviteLink: () => Promise<void>
}

export function DataTab({
  athlete,
  packages,
  accessInfo,
  inviteUrl,
  inviteError,
  linkCopied,
  onCopyInviteLink,
}: DataTabProps) {
  const router = useRouter()

  const [dataEditing, setDataEditing] = useState(false)
  const [dataEdit, setDataEdit] = useState({
    name: athlete.name ?? '',
    email: athlete.email ?? '',
    phone: athlete.phone ?? '',
    age: athlete.age?.toString() ?? '',
    city: athlete.city ?? '',
    goal: athlete.goal ?? '',
    package: athlete.package ?? 'Starter',
    package_price: athlete.package_price?.toString() ?? '',
    status: athlete.status ?? 'ok',
    height: athlete.height?.toString() ?? '',
    weight: athlete.weight?.toString() ?? '',
    join_date: athlete.join_date ?? '',
  })
  const [dataSaving, setDataSaving] = useState(false)
  const [dataSaved, setDataSaved] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const savedDistances = Object.keys(athlete.personal_bests ?? {})
  const initialDistances = [
    ...DEFAULT_PB_DISTANCES,
    ...savedDistances.filter((d) => !DEFAULT_PB_DISTANCES.includes(d)),
  ]
  const [pbDistances, setPbDistances] = useState(initialDistances)
  const [newPbDistance, setNewPbDistance] = useState('')
  const [pbEditing, setPbEditing] = useState(false)
  const [pbEdit, setPbEdit] = useState<Record<string, string>>(
    Object.fromEntries(initialDistances.map((d) => [d, (athlete.personal_bests ?? {})[d] ?? ''])),
  )
  const [pbSaving, setPbSaving] = useState(false)
  const [pbSaved, setPbSaved] = useState(false)
  const [pbError, setPbError] = useState<string | null>(null)

  const initialInjuryHistory = parseAthleteInjuryHistory(athlete.injury_history, athlete.injuries)
  const [localInjuries, setLocalInjuries] = useState<AthleteInjuryRecord[]>(initialInjuryHistory)
  const [injuriesEditing, setInjuriesEditing] = useState(false)
  const [injuriesSaving, setInjuriesSaving] = useState(false)
  const [injuriesSaved, setInjuriesSaved] = useState(false)
  const [injuriesError, setInjuriesError] = useState<string | null>(null)
  const [injuryInput, setInjuryInput] = useState('')
  const [injuryStartDate, setInjuryStartDate] = useState(todayInputValue())

  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const accessTone = accessInfo.hasActiveSession ? '#2ECC71' : accessInfo.inviteUsedAt ? '#F1C40F' : '#6B7280'
  const accessLabel = accessInfo.hasActiveSession
    ? 'Dostęp aktywowany'
    : accessInfo.inviteUsedAt
      ? 'Link użyty, brak aktywnej sesji'
      : 'Dostęp jeszcze nieaktywowany'

  const activeInjuries = getActiveAthleteInjuries(localInjuries)
  const activeInjuriesCount = activeInjuries.length
  const closedInjuries = localInjuries.filter((injury) => !!injury.ended_at)

  const personalRows: [string, string][] = [
    ['Imię i nazwisko', dataEdit.name],
    ['Email', dataEdit.email],
    ['Telefon', dataEdit.phone],
    ['Wiek', dataEdit.age ? `${dataEdit.age} lat` : ''],
    ['Wzrost', dataEdit.height ? `${dataEdit.height} cm` : ''],
    ['Waga', dataEdit.weight ? `${dataEdit.weight} kg` : ''],
    ['Miasto', dataEdit.city],
    ['Cel treningowy', dataEdit.goal],
  ]

  const collaborationRows: [string, string][] = [
    ['Pakiet', dataEdit.package],
    ['Cena miesięczna', dataEdit.package_price ? `${formatCurrency(Number(dataEdit.package_price))}/mies.` : ''],
    ['Status zawodnika', athlete.status || '—'],
    ['Data dołączenia', dataEdit.join_date ? formatDate(dataEdit.join_date, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
  ]

  async function saveData() {
    if (dataSaving) return
    setDataSaving(true)
    setDataError(null)
    setDataSaved(false)
    const fd = new FormData()
    fd.set('id', athlete.id)
    Object.entries(dataEdit).forEach(([k, v]) => fd.set(k, v))
    try {
      const result = await updateAthlete(null, fd)
      if (result && 'error' in result) {
        setDataError(result.error ?? 'Nie udało się zapisać danych zawodnika.')
        return
      }
      setDataSaved(true)
      setDataEditing(false)
      setTimeout(() => setDataSaved(false), 2000)
      startTransition(() => router.refresh())
    } finally {
      setDataSaving(false)
    }
  }

  async function savePb() {
    if (pbSaving) return
    setPbSaving(true)
    setPbError(null)
    setPbSaved(false)
    const fd = new FormData()
    fd.set('id', athlete.id)
    fd.set('personal_bests', JSON.stringify(Object.fromEntries(Object.entries(pbEdit).filter(([, v]) => v.trim()))))
    try {
      const result = await updateAthlete(null, fd)
      if (result && 'error' in result) {
        setPbError(result.error ?? 'Nie udało się zapisać rekordów życiowych.')
        return
      }
      setPbSaved(true)
      setPbEditing(false)
      setTimeout(() => setPbSaved(false), 2000)
      startTransition(() => router.refresh())
    } finally {
      setPbSaving(false)
    }
  }

  async function saveInjuries() {
    if (injuriesSaving) return
    setInjuriesSaving(true)
    setInjuriesError(null)
    setInjuriesSaved(false)
    const fd = new FormData()
    fd.set('id', athlete.id)
    fd.set('injuries', JSON.stringify(activeInjuries.map((injury) => injury.name)))
    fd.set('injury_history', JSON.stringify(localInjuries))
    try {
      const result = await updateAthlete(null, fd)
      if (result && 'error' in result) {
        setInjuriesError(result.error ?? 'Nie udało się zapisać historii kontuzji.')
        return
      }
      setInjuriesSaved(true)
      setInjuriesEditing(false)
      setInjuryInput('')
      setInjuryStartDate(todayInputValue())
      setTimeout(() => setInjuriesSaved(false), 2000)
      startTransition(() => router.refresh())
    } finally {
      setInjuriesSaving(false)
    }
  }

  function addInjury() {
    const name = injuryInput.trim()
    if (!name) return
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    setLocalInjuries((current) => [
      ...current,
      {
        id,
        name,
        started_at: injuryStartDate || todayInputValue(),
        ended_at: null,
      },
    ])
    setInjuryInput('')
    setInjuryStartDate(todayInputValue())
  }

  function removeInjury(id: string) {
    setLocalInjuries((current) => current.filter((injury) => injury.id !== id))
  }

  function setInjuryEndDate(id: string, endedAt: string) {
    setLocalInjuries((current) => current.map((injury) => injury.id === id ? { ...injury, ended_at: endedAt || null } : injury))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Dane osobowe</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Podstawowe informacje kontaktowe i profil zawodnika.
                </p>
              </div>
              {!dataEditing ? (
                <button onClick={() => setDataEditing(true)} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                  Edytuj
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDataEditing(false)
                      setDataEdit({
                        name: athlete.name ?? '',
                        email: athlete.email ?? '',
                        phone: athlete.phone ?? '',
                        age: athlete.age?.toString() ?? '',
                        city: athlete.city ?? '',
                        goal: athlete.goal ?? '',
                        package: athlete.package ?? 'Starter',
                        package_price: athlete.package_price?.toString() ?? '',
                        status: athlete.status ?? 'ok',
                        height: athlete.height?.toString() ?? '',
                        weight: athlete.weight?.toString() ?? '',
                        join_date: athlete.join_date ?? '',
                      })
                    }}
                    className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                  >
                    Anuluj
                  </button>
                  <button onClick={saveData} disabled={dataSaving} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: dataSaved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: dataSaved ? '#2ECC71' : 'white' }}>
                    {dataSaved ? '✓ Zapisano' : dataSaving ? 'Zapisywanie...' : 'Zapisz'}
                  </button>
                </div>
              )}
            </div>
            {dataError && (
              <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: '#E74C3C' }}>
                {dataError}
              </div>
            )}

            {!dataEditing ? (
              <div className="space-y-3 text-sm">
                {personalRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-medium text-right ml-4">{value || '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {([
                  ['Imię i nazwisko', 'name', 'text'],
                  ['Email', 'email', 'email'],
                  ['Telefon', 'phone', 'text'],
                  ['Wiek', 'age', 'number'],
                  ['Wzrost (cm)', 'height', 'number'],
                  ['Waga (kg)', 'weight', 'number'],
                  ['Miasto', 'city', 'text'],
                  ['Cel treningowy', 'goal', 'text'],
                ] as const).map(([label, field, type]) => (
                  <div key={field}>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                    <input type={type} value={dataEdit[field]} onChange={(e) => setDataEdit((d) => ({ ...d, [field]: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4">
              <h3 className="font-semibold">Współpraca</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Pakiet, rozliczenie i podstawowy kontekst współpracy z zawodnikiem.
              </p>
            </div>

            {!dataEditing ? (
              <div className="space-y-3 text-sm">
                {collaborationRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-medium text-right">{value || '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Pakiet</label>
                  {packages.length === 0 ? (
                    <div className="px-3 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}>
                      Brak pakietów — <a href="/coach/packages" className="underline" style={{ color: '#FF5C1B' }}>dodaj pakiet w zakładce Pakiety</a>
                    </div>
                  ) : (
                    <select
                      value={dataEdit.package}
                      onChange={(e) => {
                        const pkg = packages.find((p) => p.name === e.target.value)
                        setDataEdit((d) => ({
                          ...d,
                          package: e.target.value,
                          package_price: pkg ? pkg.price.toString() : d.package_price,
                        }))
                      }}
                      className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
                      style={inputStyle}
                    >
                      {!packages.some((p) => p.name === dataEdit.package) && dataEdit.package && (
                        <option value={dataEdit.package} disabled>{dataEdit.package} (nieaktywny)</option>
                      )}
                      {packages.map((p) => <option key={p.id} value={p.name}>{p.name} — {formatCurrency(p.price)}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Cena miesięczna</label>
                  <input type="number" min="0" step="0.01" value={dataEdit.package_price} onChange={(e) => setDataEdit((d) => ({ ...d, package_price: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Data dołączenia</label>
                  <input type="date" value={dataEdit.join_date} onChange={(e) => setDataEdit((d) => ({ ...d, join_date: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="font-semibold">Sport i zdrowie</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Rekordy życiowe i aktualny kontekst zdrowotny zawodnika.
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ background: activeInjuriesCount > 0 ? 'rgba(241,196,15,0.14)' : 'rgba(46,204,113,0.12)', color: activeInjuriesCount > 0 ? '#F1C40F' : '#2ECC71' }}>
                {activeInjuriesCount > 0 ? `${activeInjuriesCount} ${activeInjuriesCount === 1 ? 'aktywna kontuzja' : activeInjuriesCount < 5 ? 'aktywne kontuzje' : 'aktywnych kontuzji'}` : 'Brak aktywnych kontuzji'}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Rekordy życiowe</h4>
                  {!pbEditing ? (
                    <button onClick={() => setPbEditing(true)} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                      Edytuj
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPbEditing(false)
                          setPbDistances(initialDistances)
                          setPbEdit(Object.fromEntries(initialDistances.map((d) => [d, (athlete.personal_bests ?? {})[d] ?? ''])))
                          setNewPbDistance('')
                        }}
                        className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                      >
                        Anuluj
                      </button>
                      <button onClick={savePb} disabled={pbSaving} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: pbSaved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: pbSaved ? '#2ECC71' : 'white' }}>
                        {pbSaved ? '✓ Zapisano' : pbSaving ? 'Zapisywanie...' : 'Zapisz'}
                      </button>
                    </div>
                  )}
                </div>
                {pbError && (
                  <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: '#E74C3C' }}>
                    {pbError}
                  </div>
                )}

                {!pbEditing ? (
                  <div className="space-y-3 text-sm">
                    {pbDistances.map((dist) => (
                      <div key={dist} className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>{dist}</span>
                        <span className="font-mono font-medium">{pbEdit[dist] || '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Format: 3:52:00 lub 22:30</p>
                    {pbDistances.map((dist) => (
                      <div key={dist}>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{dist}</label>
                        <input value={pbEdit[dist] ?? ''} onChange={(e) => setPbEdit((p) => ({ ...p, [dist]: e.target.value }))} placeholder="np. 22:30" className="w-full px-3 py-2 rounded-xl text-sm font-mono" style={inputStyle} />
                      </div>
                    ))}
                    <div>
                      <input
                        value={newPbDistance}
                        onChange={(e) => setNewPbDistance(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPbDistance.trim()) {
                            e.preventDefault()
                            const dist = newPbDistance.trim()
                            if (!pbDistances.includes(dist)) {
                              setPbDistances((d) => [...d, dist])
                              setPbEdit((p) => ({ ...p, [dist]: '' }))
                            }
                            setNewPbDistance('')
                          }
                        }}
                        placeholder="+ Dodaj dystans (np. 3 km) — Enter"
                        className="w-full px-3 py-2 rounded-xl text-sm"
                        style={{ ...inputStyle, borderStyle: 'dashed' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">Zdrowie i kontuzje</h4>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Dodawaj kontuzje z datą rozpoczęcia i zamykaj je datą zakończenia, żeby mieć pełną historię urazów.
                    </p>
                  </div>
                  {!injuriesEditing ? (
                    <button onClick={() => setInjuriesEditing(true)} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                      Edytuj
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setInjuriesEditing(false)
                          setLocalInjuries(parseAthleteInjuryHistory(athlete.injury_history, athlete.injuries))
                          setInjuryInput('')
                          setInjuryStartDate(todayInputValue())
                        }}
                        className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                      >
                        Anuluj
                      </button>
                      <button onClick={saveInjuries} disabled={injuriesSaving} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: injuriesSaved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: injuriesSaved ? '#2ECC71' : 'white' }}>
                        {injuriesSaved ? '✓ Zapisano' : injuriesSaving ? 'Zapisywanie...' : 'Zapisz'}
                      </button>
                    </div>
                  )}
                </div>

                {injuriesError && (
                  <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: '#E74C3C' }}>
                    {injuriesError}
                  </div>
                )}

                {!injuriesEditing ? (
                  localInjuries.length > 0 ? (
                    <div className="space-y-4">
                      {activeInjuries.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>Aktywne kontuzje</div>
                          <div className="space-y-2">
                            {activeInjuries.map((injury) => (
                              <div key={injury.id} className="rounded-xl px-3 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                                <div className="text-sm font-semibold" style={{ color: '#FCA5A5' }}>{injury.name}</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatInjuryRange(injury.started_at, injury.ended_at)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {closedInjuries.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-muted)' }}>Historia kontuzji</div>
                          <div className="space-y-2">
                            {closedInjuries.map((injury) => (
                              <div key={injury.id} className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                <div className="text-sm font-semibold">{injury.name}</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatInjuryRange(injury.started_at, injury.ended_at)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Brak kontuzji w historii zawodnika</span>
                  )
                ) : (
                  <div className="space-y-4">
                    {localInjuries.length > 0 && (
                      <div className="space-y-3">
                        {localInjuries.map((injury) => (
                          <div key={injury.id} className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <div className="text-sm font-semibold">{injury.name}</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{injury.ended_at ? 'Kontuzja zakończona' : 'Kontuzja aktywna'}</div>
                              </div>
                              <button type="button" onClick={() => removeInjury(injury.id)} className="text-xs px-2.5 py-1 rounded-lg cursor-pointer" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                                Usuń
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Data rozpoczęcia</label>
                                <input type="date" value={injury.started_at ?? ''} onChange={(e) => setLocalInjuries((current) => current.map((item) => item.id === injury.id ? { ...item, started_at: e.target.value || null } : item))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                              </div>
                              <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Data zakończenia</label>
                                <input type="date" value={injury.ended_at ?? ''} onChange={(e) => setInjuryEndDate(injury.id, e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border)' }}>
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: 'var(--text-muted)' }}>Dodaj kontuzję</div>
                      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                        <input
                          value={injuryInput}
                          onChange={(e) => setInjuryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && injuryInput.trim()) {
                              e.preventDefault()
                              addInjury()
                            }
                          }}
                          placeholder="np. Kolano lewe, ból pleców..."
                          className="w-full px-3 py-2 rounded-xl text-sm"
                          style={inputStyle}
                        />
                        <input type="date" value={injuryStartDate} onChange={(e) => setInjuryStartDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                        <button type="button" onClick={addInjury} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                          + Dodaj
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold">Konto i administracja</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Status dostępu zawodnika, stały link do panelu i działania administracyjne.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ background: `${accessTone}22`, color: accessTone }}>
            {accessLabel}
          </span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span style={{ color: 'var(--text-muted)' }}>Ostatnia aktywność</span>
              <span className="font-medium text-right">{accessInfo.lastSeenAt ? formatDate(accessInfo.lastSeenAt, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: 'var(--text-muted)' }}>Link użyty</span>
              <span className="font-medium text-right">{accessInfo.inviteUsedAt ? formatDate(accessInfo.inviteUsedAt, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Jeszcze nie'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: 'var(--text-muted)' }}>Ważność linku</span>
              <span className="font-medium text-right" style={{ color: 'var(--text-primary)' }}>Bezterminowo</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Link zaproszenia</div>
            <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Wyślij zawodnikowi ten link, aby mógł wejść do swojego prywatnego profilu.
            </div>
            {inviteError && (
              <div className="text-xs mb-2" style={{ color: '#E74C3C' }}>{inviteError}</div>
            )}
            <code className="block w-full px-3 py-2 rounded-xl text-xs font-mono select-all overflow-x-auto" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {inviteUrl}
            </code>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => void onCopyInviteLink()} className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0" style={{ background: linkCopied ? 'rgba(46,204,113,0.15)' : 'rgba(255,92,27,0.1)', color: linkCopied ? '#2ECC71' : '#FF5C1B' }}>
                {linkCopied ? '✓ Skopiowano' : '📋 Kopiuj'}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(`Cześć! Oto Twój panel treningowy: ${inviteUrl}`)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0" style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}>
                WhatsApp
              </a>
              <a href={`mailto:${athlete.email || ''}?subject=${encodeURIComponent('Twój panel treningowy')}&body=${encodeURIComponent(`Cześć ${athlete.name}!\n\nTutaj znajdziesz swój panel treningowy:\n${inviteUrl}`)}`} className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                Email
              </a>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-semibold">Archiwizacja zawodnika</h4>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Po przeniesieniu do archiwum zawodnik zniknie z aktywnej listy, planera, czatu i dashboardu trenera. Dane historyczne pozostaną dostępne w archiwum.
              </p>
            </div>
            {athlete.archived_at && (
              <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ background: 'rgba(107,114,128,0.14)', color: 'var(--text-muted)' }}>
                Zarchiwizowany
              </span>
            )}
          </div>

          {archiveError && (
            <div className="mt-4 text-sm rounded-xl px-3 py-2" style={{ background: 'rgba(231,76,60,0.12)', color: '#E74C3C', border: '1px solid rgba(231,76,60,0.2)' }}>
              {archiveError}
            </div>
          )}

          {!athlete.archived_at && (
            <div className="mt-5">
              {!archiveConfirm ? (
                <button type="button" onClick={() => { setArchiveConfirm(true); setArchiveError(null) }} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'rgba(231,76,60,0.12)', color: '#E74C3C' }}>
                  Przenieś do archiwum
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    Potwierdź archiwizację. Zawodnik zniknie z aktywnej pracy trenera i trafi do `Ustawienia → Archiwum zawodników`.
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setArchiveConfirm(false)} className="px-3 py-2 rounded-xl text-sm cursor-pointer" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      Anuluj
                    </button>
                    <button
                      type="button"
                      disabled={archiving}
                      onClick={async () => {
                        setArchiving(true)
                        setArchiveError(null)
                        try {
                          const result = await archiveAthlete(athlete.id)
                          if (result && 'error' in result) {
                            setArchiveError(result.error ?? 'Nie udało się zarchiwizować zawodnika.')
                            return
                          }
                          router.push('/coach/athletes')
                          router.refresh()
                        } finally {
                          setArchiving(false)
                        }
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ background: '#E74C3C', color: 'white' }}
                    >
                      {archiving ? 'Przenoszenie...' : 'Tak, przenieś do archiwum'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
