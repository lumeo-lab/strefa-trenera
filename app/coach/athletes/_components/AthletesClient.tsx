'use client'

import { useState, useEffect, useActionState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatCurrency } from '@/lib/utils'
import { createAthlete, updateAthlete } from '@/lib/actions/athletes'
import { useCustomStatuses, StatusDef } from '@/lib/useCustomStatuses'
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

interface Package {
  id: string
  name: string
  price: number
}

interface Props {
  athletes: Athlete[]
  lastSessionMap: Record<string, string>
  weeklyLoadMap: Record<string, number>
  packages: Package[]
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-mid)',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 5,
}

type SortKey = 'name' | 'package' | 'status' | 'join_date' | 'last_session' | null

const ORDER_KEY = 'coach_athlete_order'

const PRESET_COLORS = ['#2ECC71', '#F1C40F', '#E74C3C', '#6B7280', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316']

export function AthletesClient({ athletes, lastSessionMap, weeklyLoadMap, packages }: Props) {
  const router = useRouter()
  const { all: allStatuses, saveAll } = useCustomStatuses()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [masterOrder, setMasterOrder] = useState<string[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Add athlete modal
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(packages[0] ?? null)
  const [state, formAction, pending] = useActionState(createAthlete, null)

  // Status editor modal
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [editingStatuses, setEditingStatuses] = useState<StatusDef[]>([])
  const [newStatusLabel, setNewStatusLabel] = useState('')
  const [newStatusColor, setNewStatusColor] = useState(PRESET_COLORS[4])

  // Inline status edit
  const [editingStatusFor, setEditingStatusFor] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  function openStatusModal() {
    setEditingStatuses(allStatuses.map(s => ({ ...s })))
    setNewStatusLabel('')
    setNewStatusColor(PRESET_COLORS[4])
    setStatusModalOpen(true)
  }

  function saveStatuses() {
    saveAll(editingStatuses)
    setStatusModalOpen(false)
  }

  async function handleStatusChange(athleteId: string, newStatus: string) {
    setUpdatingStatus(true)
    const fd = new FormData()
    fd.set('id', athleteId)
    fd.set('status', newStatus)
    await updateAthlete(null, fd)
    setEditingStatusFor(null)
    setUpdatingStatus(false)
    startTransition(() => router.refresh())
  }

  function addStatus() {
    if (!newStatusLabel.trim()) return
    const key = `custom_${Date.now()}`
    setEditingStatuses(prev => [...prev, { key, label: newStatusLabel.trim(), color: newStatusColor }])
    setNewStatusLabel('')
  }

  // Load custom order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ORDER_KEY)
      if (saved) setMasterOrder(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // Apply filters
  const filtered = athletes.filter(a => {
    const matchesText = a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.goal ?? '').toLowerCase().includes(search.toLowerCase()) ||
      a.package.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesText && matchesStatus
  })

  // Apply sort or custom order
  let displayed: Athlete[]
  if (sortKey) {
    displayed = [...filtered].sort((a, b) => {
      let av = '', bv = ''
      if (sortKey === 'name') { av = a.name; bv = b.name }
      else if (sortKey === 'package') { av = a.package; bv = b.package }
      else if (sortKey === 'status') { av = a.status; bv = b.status }
      else if (sortKey === 'join_date') { av = a.join_date; bv = b.join_date }
      else if (sortKey === 'last_session') { av = lastSessionMap[a.id] ?? ''; bv = lastSessionMap[b.id] ?? '' }
      const cmp = av.localeCompare(bv)
      return sortDir === 'asc' ? cmp : -cmp
    })
  } else {
    const allIds = athletes.map(a => a.id)
    const fullOrder = [
      ...masterOrder.filter(id => allIds.includes(id)),
      ...allIds.filter(id => !masterOrder.includes(id)),
    ]
    const orderMap = Object.fromEntries(fullOrder.map((id, i) => [id, i]))
    displayed = [...filtered].sort((a, b) => (orderMap[a.id] ?? 999) - (orderMap[b.id] ?? 999))
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortKey(null); setSortDir('asc') }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return
    const allIds = athletes.map(a => a.id)
    const fullOrder = [
      ...masterOrder.filter(id => allIds.includes(id)),
      ...allIds.filter(id => !masterOrder.includes(id)),
    ]
    const fromIdx = fullOrder.indexOf(draggingId)
    const toIdx = fullOrder.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const newOrder = [...fullOrder]
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, draggingId)
    setMasterOrder(newOrder)
    localStorage.setItem(ORDER_KEY, JSON.stringify(newOrder))
    setDraggingId(null)
    setDragOverId(null)
  }

  function getStatusDef(key: string): StatusDef {
    return allStatuses.find(s => s.key === key) ?? { key, label: key, color: '#6B7280' }
  }

  function SortHeader({ label, sk }: { label: string; sk: SortKey }) {
    const isActive = sortKey === sk
    return (
      <th
        className="text-left px-5 py-4 font-medium cursor-pointer select-none hover:opacity-80 transition-opacity"
        style={{ color: isActive ? '#FF5C1B' : 'var(--text-muted)' }}
        onClick={() => handleSort(sk)}
      >
        {label}
        {isActive && <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </th>
    )
  }

  return (
    <div>
      <CoachTopbar
        title="Zawodnicy"
        subtitle={`${athletes.length} ${athletes.length === 1 ? 'zawodnik' : 'zawodników'}`}
      />

      <div className="p-6">
        {/* Search + Add */}
        <div className="flex items-center gap-3 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj zawodnika..."
            className="max-w-sm px-4 py-2.5 rounded-xl text-sm flex-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
          />
          <Button size="sm" onClick={() => { setSelectedPkg(packages[0] ?? null); setModalOpen(true) }}>
            + Dodaj zawodnika
          </Button>
        </div>

        {/* Status filter row */}
        {athletes.length > 0 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--text-muted)' }}>Status:</span>

            <button
              onClick={() => setStatusFilter('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
              style={{
                background: statusFilter === 'all' ? 'rgba(255,92,27,0.12)' : 'var(--bg-card)',
                color: statusFilter === 'all' ? '#FF5C1B' : 'var(--text-muted)',
                border: statusFilter === 'all' ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
              }}
            >
              Wszyscy <span className="opacity-60">{athletes.length}</span>
            </button>

            {allStatuses.map(s => {
              const count = athletes.filter(a => a.status === s.key).length
              if (count === 0 && statusFilter !== s.key) return null
              return (
                <button
                  key={s.key}
                  onClick={() => setStatusFilter(s.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: statusFilter === s.key ? 'rgba(255,92,27,0.12)' : 'var(--bg-card)',
                    color: statusFilter === s.key ? '#FF5C1B' : 'var(--text-muted)',
                    border: statusFilter === s.key ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
                  }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  {s.label}
                  <span className="opacity-60">{count}</span>
                </button>
              )
            })}

            <button
              onClick={openStatusModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              title="Edytuj statusy"
            >
              ⚙ Edytuj
            </button>

            {sortKey && (
              <button
                onClick={() => { setSortKey(null); setSortDir('asc') }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs cursor-pointer ml-auto"
                style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                ↺ Własna kolejność
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {athletes.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">👟</div>
            <div className="text-lg font-semibold mb-2">Brak zawodników</div>
            <div className="text-sm mb-6">Dodaj pierwszego zawodnika i wyślij mu link zaproszenia</div>
            <Button onClick={() => { setSelectedPkg(packages[0] ?? null); setModalOpen(true) }}>+ Dodaj zawodnika</Button>
          </div>
        )}

        {athletes.length > 0 && displayed.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-3xl mb-3">🔍</div>
            <div className="text-sm">Brak zawodników spełniających kryteria</div>
          </div>
        )}

        {/* Table */}
        {displayed.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                  {!sortKey && <th className="px-3 py-4 w-8" style={{ color: 'var(--text-muted)' }} />}
                  <SortHeader label="Zawodnik" sk="name" />
                  <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Cel</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Obciążenie (7 dni)</th>
                  <SortHeader label="Pakiet" sk="package" />
                  <SortHeader label="Status" sk="status" />
                  <SortHeader label="Ostatni trening" sk="last_session" />
                </tr>
              </thead>
              <tbody>
                {displayed.map((athlete, i) => {
                  const lastSession = lastSessionMap[athlete.id]
                  const isDraggingOver = dragOverId === athlete.id && draggingId !== athlete.id
                  const statusDef = getStatusDef(athlete.status)
                  return (
                    <tr
                      key={athlete.id}
                      draggable={!sortKey}
                      onDragStart={() => setDraggingId(athlete.id)}
                      onDragOver={e => { e.preventDefault(); setDragOverId(athlete.id) }}
                      onDrop={() => handleDrop(athlete.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
                      style={{
                        borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                        background: isDraggingOver ? 'rgba(255,92,27,0.06)' : draggingId === athlete.id ? 'rgba(255,92,27,0.03)' : i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-elevated)',
                        opacity: draggingId === athlete.id ? 0.5 : 1,
                        outline: isDraggingOver ? '2px solid rgba(255,92,27,0.4)' : 'none',
                        transition: 'background 0.1s',
                      }}
                    >
                      {!sortKey && (
                        <td className="pl-3 pr-1 py-4 text-center cursor-grab active:cursor-grabbing select-none"
                          style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                          ⠿
                        </td>
                      )}
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
                        <Badge variant="gray">{athlete.package || '—'}</Badge>
                      </td>
                      <td className="px-5 py-4" onClick={e => { e.stopPropagation(); setEditingStatusFor(athlete.id) }}>
                        {editingStatusFor === athlete.id ? (
                          <select
                            autoFocus
                            defaultValue={athlete.status}
                            onChange={e => handleStatusChange(athlete.id, e.target.value)}
                            onBlur={() => setEditingStatusFor(null)}
                            disabled={updatingStatus}
                            onClick={e => e.stopPropagation()}
                            className="px-2 py-1 rounded-lg text-xs cursor-pointer"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                          >
                            {allStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" title="Kliknij aby zmienić status">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusDef.color }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{statusDef.label}</span>
                          </div>
                        )}
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Dodaj zawodnika" size="sm">
        <form action={async (fd) => {
          if (selectedPkg) fd.set('package_price', selectedPkg.price.toString())
          await formAction(fd)
          if (!state?.error) setModalOpen(false)
        }}>
          <div className="space-y-3">
            <div>
              <label style={labelStyle}>Imię i nazwisko *</label>
              <input name="name" required placeholder="np. Katarzyna Wiśniewska" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input name="email" type="email" placeholder="np. katarzyna@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Telefon</label>
              <input name="phone" placeholder="np. 600 123 456" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cel treningowy</label>
              <input name="goal" placeholder="np. Maraton sub 4h" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Wiek</label>
                <input name="age" type="number" min={10} max={99} placeholder="np. 32" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Miasto</label>
                <input name="city" placeholder="np. Warszawa" style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Wzrost (cm)</label>
                <input name="height" type="number" min={100} max={250} placeholder="np. 175" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Waga (kg)</label>
                <input name="weight" type="number" min={30} max={200} step={0.1} placeholder="np. 70" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Pakiet</label>
              {packages.length === 0 ? (
                <div className="px-3 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}>
                  Brak pakietów — <a href="/coach/packages" style={{ color: '#FF5C1B' }} className="underline">dodaj pakiet w zakładce Pakiety</a>
                </div>
              ) : (
                <select name="package" value={selectedPkg?.name ?? ''} onChange={e => setSelectedPkg(packages.find(p => p.name === e.target.value) ?? null)} style={inputStyle} className="cursor-pointer">
                  {packages.map(p => <option key={p.id} value={p.name}>{p.name} — {formatCurrency(p.price)}</option>)}
                </select>
              )}
            </div>
            {state?.error && <p className="text-xs" style={{ color: '#f87171' }}>{state.error}</p>}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Anuluj</Button>
              <Button type="submit" disabled={pending}>{pending ? 'Dodawanie...' : 'Dodaj zawodnika'}</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Status editor modal */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Edytuj statusy"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>Anuluj</Button>
            <Button onClick={saveStatuses}>Zapisz</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* All statuses — unified editable list */}
          <div className="space-y-2">
            {editingStatuses.map((s, idx) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                <input
                  value={s.label}
                  onChange={e => setEditingStatuses(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                  className="flex-1 px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
                />
                <button onClick={() => setEditingStatuses(prev => prev.filter((_, i) => i !== idx))}
                  className="text-xs px-2.5 py-2 rounded-xl cursor-pointer"
                  style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>✕</button>
              </div>
            ))}
          </div>

          {/* Add new status */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Dodaj nowy status</div>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={newStatusLabel}
                onChange={e => setNewStatusLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addStatus()}
                placeholder="Nazwa statusu (np. Kontuzja)"
                className="flex-1 px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setNewStatusColor(c)}
                    className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
                    style={{ background: c, outline: newStatusColor === c ? '2px solid white' : 'none', outlineOffset: '2px', boxShadow: newStatusColor === c ? `0 0 0 3px ${c}` : 'none' }} />
                ))}
              </div>
              <Button size="sm" onClick={addStatus} disabled={!newStatusLabel.trim()}>+ Dodaj</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
