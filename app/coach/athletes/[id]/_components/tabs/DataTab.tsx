'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { formatDate, formatCurrency } from '@/lib/utils'
import { DbRow } from '@/lib/types'
import { updateAthlete } from '@/lib/actions/athletes'
import { INPUT_STYLE } from '@/lib/styles'

const inputStyle = INPUT_STYLE
const DEFAULT_PB_DISTANCES = ['5 km', '10 km', 'Półmaraton', 'Maraton']

type Package = { id: string; name: string; description: string | null; price: number }

interface DataTabProps {
  athlete: DbRow
  packages: Package[]
}

export function DataTab({ athlete, packages }: DataTabProps) {
  const router = useRouter()

  // ── Data edit state ──
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

  // ── Personal bests state ──
  const savedDistances = Object.keys(athlete.personal_bests ?? {})
  const initialDistances = [
    ...DEFAULT_PB_DISTANCES,
    ...savedDistances.filter(d => !DEFAULT_PB_DISTANCES.includes(d)),
  ]
  const [pbDistances, setPbDistances] = useState(initialDistances)
  const [newPbDistance, setNewPbDistance] = useState('')
  const [pbEditing, setPbEditing] = useState(false)
  const [pbEdit, setPbEdit] = useState<Record<string, string>>(
    Object.fromEntries(initialDistances.map(d => [d, (athlete.personal_bests ?? {})[d] ?? '']))
  )
  const [pbSaving, setPbSaving] = useState(false)
  const [pbSaved, setPbSaved] = useState(false)

  // ── Injuries state ──
  const [localInjuries, setLocalInjuries] = useState<string[]>((athlete.injuries as string[] | null) ?? [])
  const [injuriesEditing, setInjuriesEditing] = useState(false)
  const [injuriesSaving, setInjuriesSaving] = useState(false)
  const [injuriesSaved, setInjuriesSaved] = useState(false)
  const [injuryInput, setInjuryInput] = useState('')

  async function saveData() {
    if (dataSaving) return
    setDataSaving(true)
    const fd = new FormData()
    fd.set('id', athlete.id)
    Object.entries(dataEdit).forEach(([k, v]) => fd.set(k, v))
    await updateAthlete(null, fd)
    setDataSaving(false)
    setDataSaved(true)
    setDataEditing(false)
    setTimeout(() => setDataSaved(false), 2000)
    startTransition(() => router.refresh())
  }

  async function savePb() {
    if (pbSaving) return
    setPbSaving(true)
    const fd = new FormData()
    fd.set('id', athlete.id)
    const personalBests = Object.fromEntries(Object.entries(pbEdit).filter(([, v]) => v.trim()))
    fd.set('personal_bests', JSON.stringify(personalBests))
    await updateAthlete(null, fd)
    setPbSaving(false)
    setPbSaved(true)
    setPbEditing(false)
    setTimeout(() => setPbSaved(false), 2000)
    startTransition(() => router.refresh())
  }

  async function saveInjuries() {
    if (injuriesSaving) return
    setInjuriesSaving(true)
    const fd = new FormData()
    fd.set('id', athlete.id)
    fd.set('injuries', JSON.stringify(localInjuries))
    await updateAthlete(null, fd)
    setInjuriesSaving(false)
    setInjuriesSaved(true)
    setInjuriesEditing(false)
    setTimeout(() => setInjuriesSaved(false), 2000)
    startTransition(() => router.refresh())
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Dane zawodnika</h3>
          {!dataEditing ? (
            <button
              onClick={() => setDataEditing(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
            >
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
              <button
                onClick={saveData}
                disabled={dataSaving}
                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: dataSaved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: dataSaved ? '#2ECC71' : 'white' }}
              >
                {dataSaved ? '✓ Zapisano' : dataSaving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          )}
        </div>

        {!dataEditing ? (
          <div className="space-y-3 text-sm">
            {([
              ['Imię i nazwisko', dataEdit.name],
              ['Email', dataEdit.email],
              ['Telefon', dataEdit.phone],
              ['Wiek', dataEdit.age ? `${dataEdit.age} lat` : ''],
              ['Wzrost', dataEdit.height ? `${dataEdit.height} cm` : ''],
              ['Waga', dataEdit.weight ? `${dataEdit.weight} kg` : ''],
              ['Miasto', dataEdit.city],
              ['Cel treningowy', dataEdit.goal],
              ['Pakiet', dataEdit.package],
              ['Cena', dataEdit.package_price ? `${formatCurrency(Number(dataEdit.package_price))}/mies.` : ''],
              ['Dołączył/a', dataEdit.join_date ? formatDate(dataEdit.join_date, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
            ] as [string, string][]).map(([label, value]) => (
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
                <input
                  type={type}
                  value={dataEdit[field]}
                  onChange={e => setDataEdit(d => ({ ...d, [field]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
            ))}
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Pakiet</label>
              {packages.length === 0 ? (
                <div className="px-3 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}>
                  Brak pakietów — <a href="/coach/packages" className="underline" style={{ color: '#FF5C1B' }}>dodaj pakiet w zakładce Pakiety</a>
                </div>
              ) : (
                <select
                  value={dataEdit.package}
                  onChange={e => {
                    const pkg = packages.find(p => p.name === e.target.value)
                    setDataEdit(d => ({
                      ...d,
                      package: e.target.value,
                      package_price: pkg ? pkg.price.toString() : d.package_price,
                    }))
                  }}
                  className="w-full px-3 py-2 rounded-xl text-sm cursor-pointer"
                  style={inputStyle}
                >
                  {!packages.some(p => p.name === dataEdit.package) && dataEdit.package && (
                    <option value={dataEdit.package} disabled>{dataEdit.package} (nieaktywny)</option>
                  )}
                  {packages.map(p => <option key={p.id} value={p.name}>{p.name} — {formatCurrency(p.price)}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Data dołączenia</label>
              <input
                type="date"
                value={dataEdit.join_date}
                onChange={e => setDataEdit(d => ({ ...d, join_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Rekordy życiowe</h3>
          {!pbEditing ? (
            <button
              onClick={() => setPbEditing(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
            >Edytuj</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => {
                setPbEditing(false)
                setPbDistances(initialDistances)
                setPbEdit(Object.fromEntries(initialDistances.map(d => [d, (athlete.personal_bests ?? {})[d] ?? ''])))
                setNewPbDistance('')
              }}
                className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Anuluj</button>
              <button onClick={savePb} disabled={pbSaving}
                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: pbSaved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: pbSaved ? '#2ECC71' : 'white' }}>
                {pbSaved ? '✓ Zapisano' : pbSaving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          )}
        </div>

        {!pbEditing ? (
          <div className="space-y-3 text-sm">
            {pbDistances.map(dist => (
              <div key={dist} className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>{dist}</span>
                <span className="font-mono font-medium">{pbEdit[dist] || '—'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Format: 3:52:00 lub 22:30</p>
            {pbDistances.map(dist => (
              <div key={dist}>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{dist}</label>
                <input
                  value={pbEdit[dist] ?? ''}
                  onChange={e => setPbEdit(p => ({ ...p, [dist]: e.target.value }))}
                  placeholder="np. 22:30"
                  className="w-full px-3 py-2 rounded-xl text-sm font-mono"
                  style={inputStyle}
                />
              </div>
            ))}
            <div>
              <input
                value={newPbDistance}
                onChange={e => setNewPbDistance(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newPbDistance.trim()) {
                    e.preventDefault()
                    const dist = newPbDistance.trim()
                    if (!pbDistances.includes(dist)) {
                      setPbDistances(d => [...d, dist])
                      setPbEdit(p => ({ ...p, [dist]: '' }))
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

      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Kontuzje / historia</h3>
          {!injuriesEditing ? (
            <button
              onClick={() => setInjuriesEditing(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}
            >Edytuj</button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setInjuriesEditing(false)
                  setLocalInjuries((athlete.injuries as string[] | null) ?? [])
                  setInjuryInput('')
                }}
                className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >Anuluj</button>
              <button
                onClick={saveInjuries}
                disabled={injuriesSaving}
                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: injuriesSaved ? 'rgba(46,204,113,0.15)' : '#FF5C1B', color: injuriesSaved ? '#2ECC71' : 'white' }}
              >
                {injuriesSaved ? '✓ Zapisano' : injuriesSaving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          )}
        </div>

        {!injuriesEditing ? (
          localInjuries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {localInjuries.map(inj => (
                <span key={inj} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{inj}</span>
              ))}
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Brak kontuzji</span>
          )
        ) : (
          <div>
            {localInjuries.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {localInjuries.map(inj => (
                  <span key={inj} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                    {inj}
                    <button type="button" onClick={() => setLocalInjuries(ls => ls.filter(i => i !== inj))} className="hover:opacity-70 leading-none">✕</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={injuryInput}
                onChange={e => setInjuryInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && injuryInput.trim()) {
                    e.preventDefault()
                    const val = injuryInput.trim()
                    if (!localInjuries.includes(val)) setLocalInjuries(ls => [...ls, val])
                    setInjuryInput('')
                  }
                }}
                placeholder="np. Kolano lewe, ból pleców..."
                className="flex-1 px-3 py-2 rounded-xl text-sm"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => {
                  const val = injuryInput.trim()
                  if (!val) return
                  if (!localInjuries.includes(val)) setLocalInjuries(ls => [...ls, val])
                  setInjuryInput('')
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >+ Dodaj</button>
            </div>
          </div>
        )}
      </Card>
      </div>
    </div>
  )
}
