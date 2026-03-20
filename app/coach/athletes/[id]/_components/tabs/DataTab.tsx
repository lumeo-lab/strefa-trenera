'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { archiveAthlete, updateAthlete } from '@/lib/actions/athletes'
import { getActiveAthleteInjuries, parseAthleteInjuryHistory } from '@/lib/athlete-injuries'
import { INPUT_STYLE } from '@/lib/styles'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PersonalBestsEditor } from './data/PersonalBestsEditor'
import { InjuryEditor } from './data/InjuryEditor'
import type { CoachAthleteRow, CoachPackageRow } from '../types'
import type { HrZoneMethod } from '@/lib/types'

const inputStyle = INPUT_STYLE

interface DataTabProps {
  athlete: CoachAthleteRow
  packages: CoachPackageRow[]
  accessInfo: {
    inviteUsedAt: string | null
    hasActiveSession: boolean
    lastSeenAt: string | null
    sessionCreatedAt: string | null
  }
}

export function DataTab({
  athlete,
  packages,
  accessInfo,
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
    hr_zone_method: athlete.hr_zone_method ?? 'custom',
    threshold_hr: athlete.threshold_hr?.toString() ?? '',
    hr_zone_z1_max: athlete.hr_zone_z1_max?.toString() ?? '',
    hr_zone_z2_max: athlete.hr_zone_z2_max?.toString() ?? '',
    hr_zone_z3_max: athlete.hr_zone_z3_max?.toString() ?? '',
    hr_zone_z4_max: athlete.hr_zone_z4_max?.toString() ?? '',
  })
  const [dataSaving, setDataSaving] = useState(false)
  const [dataSaved, setDataSaved] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const accessTone = accessInfo.hasActiveSession ? '#2ECC71' : accessInfo.inviteUsedAt ? '#F1C40F' : '#6B7280'
  const accessLabel = accessInfo.hasActiveSession
    ? 'Dostęp aktywowany'
    : accessInfo.inviteUsedAt
      ? 'Link użyty, brak aktywnej sesji'
      : 'Dostęp jeszcze nieaktywowany'

  const initialInjuryHistory = parseAthleteInjuryHistory(athlete.injury_history, athlete.injuries)
  const activeInjuriesCount = getActiveAthleteInjuries(initialInjuryHistory).length

  const [goalEditing, setGoalEditing] = useState(false)
  const [goalValue, setGoalValue] = useState(athlete.goal ?? '')
  const [goalSaving, setGoalSaving] = useState(false)

  const personalRows: [string, string][] = [
    ['Imię i nazwisko', dataEdit.name],
    ['Email', dataEdit.email],
    ['Telefon', dataEdit.phone],
    ['Wiek', dataEdit.age ? `${dataEdit.age} lat` : ''],
    ['Wzrost', dataEdit.height ? `${dataEdit.height} cm` : ''],
    ['Waga', dataEdit.weight ? `${dataEdit.weight} kg` : ''],
    ['Miasto', dataEdit.city],
  ]

  const collaborationRows: [string, string][] = [
    ['Pakiet', dataEdit.package],
    ['Cena miesięczna', dataEdit.package_price ? `${formatCurrency(Number(dataEdit.package_price))}/mies.` : ''],
    ['Status zawodnika', athlete.status || '—'],
    ['Data dołączenia', dataEdit.join_date ? formatDate(dataEdit.join_date, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
  ]

  const hrZoneRows: [string, string][] = [
    ['Metoda stref', dataEdit.hr_zone_method === 'threshold_hr' ? 'Threshold HR' : 'Ręczna'],
    ['Threshold HR', dataEdit.threshold_hr ? `${dataEdit.threshold_hr} bpm` : '—'],
    ['Z1 max', dataEdit.hr_zone_z1_max ? `${dataEdit.hr_zone_z1_max} bpm` : '—'],
    ['Z2 max', dataEdit.hr_zone_z2_max ? `${dataEdit.hr_zone_z2_max} bpm` : '—'],
    ['Z3 max', dataEdit.hr_zone_z3_max ? `${dataEdit.hr_zone_z3_max} bpm` : '—'],
    ['Z4 max', dataEdit.hr_zone_z4_max ? `${dataEdit.hr_zone_z4_max} bpm` : '—'],
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          {/* ── Dane osobowe ── */}
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
                        hr_zone_method: athlete.hr_zone_method ?? 'custom',
                        threshold_hr: athlete.threshold_hr?.toString() ?? '',
                        hr_zone_z1_max: athlete.hr_zone_z1_max?.toString() ?? '',
                        hr_zone_z2_max: athlete.hr_zone_z2_max?.toString() ?? '',
                        hr_zone_z3_max: athlete.hr_zone_z3_max?.toString() ?? '',
                        hr_zone_z4_max: athlete.hr_zone_z4_max?.toString() ?? '',
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
                ] as const).map(([label, field, type]) => (
                  <div key={field}>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                    <input type={type} value={dataEdit[field]} onChange={(e) => setDataEdit((d) => ({ ...d, [field]: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Współpraca ── */}
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

        {/* ── Sport i zdrowie ── */}
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
              <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <h4 className="text-sm font-semibold">Strefy tętna pod analizę</h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      To jest fundament pod kolejne etapy analizy: czas w Z1-Z5, obciążenie i recommendation layer.
                    </p>
                  </div>
                </div>

                {!dataEditing ? (
                  <div className="space-y-3 text-sm">
                    {hrZoneRows.map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                        <span className="font-medium text-right">{value || '—'}</span>
                      </div>
                    ))}
                    <div className="text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
                      Z5 jest liczone jako wszystko powyżej Z4 max. Jeśli dane są niepełne, późniejsze insighty muszą to uczciwie oznaczać.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Metoda stref HR</label>
                      <select
                        value={dataEdit.hr_zone_method}
                        onChange={(e) => setDataEdit((d) => ({ ...d, hr_zone_method: e.target.value as HrZoneMethod }))}
                        className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
                        style={inputStyle}
                      >
                        <option value="custom">Ręczna</option>
                        <option value="threshold_hr">Threshold HR</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Threshold HR</label>
                      <input type="number" min="80" max="240" value={dataEdit.threshold_hr} onChange={(e) => setDataEdit((d) => ({ ...d, threshold_hr: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Z1 max</label>
                        <input type="number" min="80" max="240" value={dataEdit.hr_zone_z1_max} onChange={(e) => setDataEdit((d) => ({ ...d, hr_zone_z1_max: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Z2 max</label>
                        <input type="number" min="80" max="240" value={dataEdit.hr_zone_z2_max} onChange={(e) => setDataEdit((d) => ({ ...d, hr_zone_z2_max: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Z3 max</label>
                        <input type="number" min="80" max="240" value={dataEdit.hr_zone_z3_max} onChange={(e) => setDataEdit((d) => ({ ...d, hr_zone_z3_max: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Z4 max</label>
                        <input type="number" min="80" max="240" value={dataEdit.hr_zone_z4_max} onChange={(e) => setDataEdit((d) => ({ ...d, hr_zone_z4_max: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cel treningowy */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Cel treningowy</span>
                  {!goalEditing && (
                    <button onClick={() => { setGoalEditing(true); setGoalValue(athlete.goal ?? '') }}
                      className="text-xs cursor-pointer hover:opacity-80" style={{ color: '#FF5C1B' }}>
                      Edytuj
                    </button>
                  )}
                </div>
                {goalEditing ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={goalValue} onChange={(e) => setGoalValue(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl text-sm" style={inputStyle} placeholder="np. maraton poniżej 3:30" autoFocus />
                    <button onClick={() => setGoalEditing(false)}
                      className="px-2 py-2 rounded-xl text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                      Anuluj
                    </button>
                    <button
                      disabled={goalSaving}
                      onClick={async () => {
                        setGoalSaving(true)
                        const fd = new FormData()
                        fd.set('id', athlete.id)
                        fd.set('goal', goalValue)
                        const result = await updateAthlete(null, fd)
                        setGoalSaving(false)
                        if (result && 'error' in result) return
                        setGoalEditing(false)
                        startTransition(() => router.refresh())
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ background: '#FF5C1B', color: 'white' }}>
                      {goalSaving ? '...' : 'Zapisz'}
                    </button>
                  </div>
                ) : (
                  <div className="text-sm font-medium">{athlete.goal || '—'}</div>
                )}
              </div>

              <PersonalBestsEditor
                athleteId={athlete.id}
                personalBests={athlete.personal_bests as Record<string, string> | null}
              />
              <InjuryEditor
                athleteId={athlete.id}
                injuryHistory={athlete.injury_history}
                legacyInjuries={athlete.injuries}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* ── Konto i administracja ── */}
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

        <div className="space-y-3 text-sm max-w-md">
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
