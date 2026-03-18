'use client'

import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { daysAgo, daysUntil, formatCurrency, formatDate, sesjaLabel, sessionTypeLabel, tenureLabel } from '@/lib/utils'
import { updateAthlete } from '@/lib/actions/athletes'
import { StatusDef, useCustomStatuses } from '@/lib/useCustomStatuses'
import Link from 'next/link'
import { AddAthleteModal } from './AddAthleteModal'
import { StatusEditorModal } from './StatusEditorModal'

// ── Column picker ──────────────────────────────────────────────────────────
type ColumnKey = 'signal' | 'compliance' | 'weekly_load' | 'package' | 'next_session' | 'last_session' | 'join_date' | 'phone' | 'age' | 'city'

const COLUMN_DEFS: { key: ColumnKey; label: string; desc: string }[] = [
  { key: 'last_session', label: 'Ostatni trening',   desc: 'Ostatni ukończony trening' },
  { key: 'next_session', label: 'Następna sesja',    desc: 'Najbliższy zaplanowany trening' },
  { key: 'signal',       label: 'Forma',             desc: 'Ostatni sygnał z feedbacku + kiedy' },
  { key: 'compliance',   label: 'Realizacja 30 dni', desc: '% ukończonych sesji z ost. 30 dni' },
  { key: 'weekly_load',  label: 'Obciążenie 7 dni',  desc: 'Suma km i liczba sesji z ost. 7 dni' },
  { key: 'package',      label: 'Pakiet',            desc: 'Pakiet, cena i status płatności' },
  { key: 'join_date',    label: 'Data dołączenia',   desc: 'Kiedy zawodnik dołączył + staż' },
  { key: 'phone',        label: 'Telefon',           desc: 'Numer telefonu (klikalny)' },
  { key: 'age',          label: 'Wiek',              desc: 'Wiek zawodnika' },
  { key: 'city',         label: 'Miasto',            desc: 'Miasto zawodnika' },
]
const DEFAULT_COLUMNS: ColumnKey[] = ['last_session', 'next_session', 'signal', 'compliance', 'weekly_load']
const COLUMNS_STORAGE_KEY = 'coach_table_columns_v2'

// ── Helpers ────────────────────────────────────────────────────────────────
const SIGNAL_COLORS: Record<string, string> = { green: '#2ECC71', yellow: '#F1C40F', red: '#E74C3C' }
const SIGNAL_LABELS: Record<string, string> = { green: 'Dobra', yellow: 'Średnia', red: 'Słaba' }


// ── Interfaces ─────────────────────────────────────────────────────────────
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
  age: number | null
  city: string | null
}

interface Package { id: string; name: string; price: number }

interface Props {
  athletes: Athlete[]
  lastSessionMap: Record<string, { date: string; type: string; title: string }>
  weeklyLoadMap: Record<string, number>
  weeklySessionCountMap: Record<string, number>
  packages: Package[]
  signalMap: Record<string, string>
  lastFeedbackDateMap: Record<string, string>
  nextSessionMap: Record<string, { date: string; type: string; title: string }>
  unreadMessagesMap: Record<string, number>
  unreadFeedbackMap: Record<string, number>
  complianceMap: Record<string, { completed: number; total: number }>
  unpaidInvoiceSet: Record<string, boolean>
  initialStatuses: StatusDef[]
}

type SortKey = 'name' | 'package' | 'status' | 'join_date' | 'last_session' | 'next_session' | 'signal' | 'weekly_load' | 'compliance' | null

const ORDER_KEY = 'coach_athlete_order'

function SortHeader({ label, sk, sortKey, sortDir, onSort }: { label: string; sk: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc'; onSort: (key: SortKey) => void }) {
  const isActive = sortKey === sk
  return (
    <th
      className="text-center px-5 py-4 font-medium cursor-pointer select-none hover:opacity-80 transition-opacity"
      style={{ color: isActive ? '#FF5C1B' : 'var(--text-muted)' }}
      onClick={() => onSort(sk)}
    >
      {label}{isActive && <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  )
}

function EmptyValue() {
  return <div className="w-full text-center" style={{ color: 'var(--text-muted)' }}>—</div>
}

export function AthletesClient({
  athletes, lastSessionMap, weeklyLoadMap, weeklySessionCountMap, packages,
  signalMap, lastFeedbackDateMap, nextSessionMap, unreadMessagesMap, unreadFeedbackMap,
  complianceMap, unpaidInvoiceSet, initialStatuses,
}: Props) {
  const router = useRouter()
  const { all: allStatuses, saveAll } = useCustomStatuses(initialStatuses)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [masterOrder, setMasterOrder] = useState<string[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Add athlete modal
  const [modalOpen, setModalOpen] = useState(false)

  // Status editor modal
  const [statusModalOpen, setStatusModalOpen] = useState(false)

  // Inline status edit
  const [editingStatusFor, setEditingStatusFor] = useState<string | null>(null)
  const [statusDropdownPos, setStatusDropdownPos] = useState<{ top: number; left: number } | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null)
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; left: number } | null>(null)

  // Column picker
  const [activeColumns, setActiveColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS)
  const [colPickerOpen, setColPickerOpen] = useState(false)
  const colPickerRef = useRef<HTMLDivElement>(null)

  function col(key: ColumnKey) { return activeColumns.includes(key) }

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of athletes) map[a.status] = (map[a.status] ?? 0) + 1
    return map
  }, [athletes])

  function openStatusModal() {
    setStatusModalOpen(true)
  }

  async function handleStatusChange(athleteId: string, newStatus: string) {
    setUpdatingStatus(true)
    setStatusMessage(null)
    const fd = new FormData()
    fd.set('id', athleteId)
    fd.set('status', newStatus)
    const result = await updateAthlete(null, fd)
    if (result && 'error' in result) {
      setStatusMessage({ tone: 'error', text: result.error ?? 'Nie udało się zmienić statusu zawodnika.' })
      setUpdatingStatus(false)
      return
    }
    setEditingStatusFor(null)
    setStatusDropdownPos(null)
    setUpdatingStatus(false)
    setStatusMessage({ tone: 'success', text: 'Status zawodnika został zapisany.' })
    startTransition(() => router.refresh())
  }

  function saveColumns(cols: ColumnKey[]) {
    setActiveColumns(cols)
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(cols))
  }

  // Close column picker on outside click
  useEffect(() => {
    if (!colPickerOpen) return
    function close(e: MouseEvent) {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) {
        setColPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [colPickerOpen])

  useEffect(() => {
    try {
      const savedColumns = localStorage.getItem(COLUMNS_STORAGE_KEY)
      if (savedColumns) {
        const parsed = JSON.parse(savedColumns)
        startTransition(() => setActiveColumns(parsed))
      }
    } catch {
      startTransition(() => setActiveColumns(DEFAULT_COLUMNS))
    }

    try {
      const savedOrder = localStorage.getItem(ORDER_KEY)
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder)
        startTransition(() => setMasterOrder(parsed))
      }
    } catch {
      startTransition(() => setMasterOrder([]))
    }
  }, [])

  // Close status dropdown on outside click or scroll
  useEffect(() => {
    if (!editingStatusFor) return
    function close() { setEditingStatusFor(null); setStatusDropdownPos(null) }
    document.addEventListener('click', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [editingStatusFor])

  useEffect(() => {
    if (!actionMenuFor) return
    function close() { setActionMenuFor(null); setActionMenuPos(null) }
    document.addEventListener('click', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [actionMenuFor])

  // Filters — includes email and phone
  const filtered = athletes.filter(a => {
    const q = search.toLowerCase()
    const matchesText = !q ||
      a.name.toLowerCase().includes(q) ||
      (a.goal ?? '').toLowerCase().includes(q) ||
      a.package.toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q) ||
      (a.phone ?? '').includes(q)
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesText && matchesStatus
  })

  // Sort or custom order
  let displayed: Athlete[]
  if (sortKey) {
    displayed = [...filtered].sort((a, b) => {
      if (sortKey === 'signal') {
        const order: Record<string, number> = { green: 0, yellow: 1, red: 2 }
        const ao = order[signalMap[a.id]] ?? 3
        const bo = order[signalMap[b.id]] ?? 3
        return sortDir === 'asc' ? ao - bo : bo - ao
      }
      if (sortKey === 'weekly_load') {
        const aw = weeklyLoadMap[a.id] ?? 0
        const bw = weeklyLoadMap[b.id] ?? 0
        return sortDir === 'asc' ? aw - bw : bw - aw
      }
      if (sortKey === 'compliance') {
        const ac = complianceMap[a.id]
        const bc = complianceMap[b.id]
        const ap = ac ? ac.completed / ac.total : -1
        const bp = bc ? bc.completed / bc.total : -1
        return sortDir === 'asc' ? ap - bp : bp - ap
      }
      let av = '', bv = ''
      if (sortKey === 'name') { av = a.name; bv = b.name }
      else if (sortKey === 'package') { av = a.package; bv = b.package }
      else if (sortKey === 'status') { av = a.status; bv = b.status }
      else if (sortKey === 'join_date') { av = a.join_date; bv = b.join_date }
      else if (sortKey === 'last_session') { av = lastSessionMap[a.id]?.date ?? ''; bv = lastSessionMap[b.id]?.date ?? '' }
      else if (sortKey === 'next_session') { av = nextSessionMap[a.id]?.date ?? '9999-12-31'; bv = nextSessionMap[b.id]?.date ?? '9999-12-31' }
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

  return (
    <div>
      <CoachTopbar
        title="Zawodnicy"
        subtitle={(() => {
          const n = athletes.length
          const d = displayed.length
          const plural = n === 1 ? 'zawodnik' : (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) ? 'zawodnicy' : 'zawodników'
          return d < n ? `${d} z ${n} ${plural}` : `${n} ${plural}`
        })()}
      />

      <div className="p-6">
        {statusMessage && (
          <div
            className="mb-4 rounded-2xl px-4 py-3 text-sm"
            style={{
              background: statusMessage.tone === 'success' ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)',
              border: statusMessage.tone === 'success' ? '1px solid rgba(46,204,113,0.28)' : '1px solid rgba(231,76,60,0.28)',
              color: statusMessage.tone === 'success' ? '#2ECC71' : '#E74C3C',
            }}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Search + controls */}
        <div className="flex items-center gap-3 mb-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj zawodnika, email, telefon..."
            className="max-w-sm px-4 py-2.5 rounded-xl text-sm flex-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
          />

          <Button size="sm" onClick={() => { setStatusMessage(null); setModalOpen(true) }}>
            + Dodaj zawodnika
          </Button>

          {/* Export Excel */}
          <button
            onClick={() => {
              const headers = ['Imię', 'Email', 'Telefon', 'Pakiet', 'Cena pakietu', 'Status', 'Cel', 'Data dołączenia', 'Wiek', 'Miasto']
              const rows = displayed.map(a => [
                a.name, a.email ?? '', a.phone ?? '', a.package, a.package_price, getStatusDef(a.status).label, a.goal, a.join_date, a.age ?? '', a.city ?? '',
              ])
              const tsv = [headers, ...rows].map(r => r.map(v => String(v).replace(/\t/g, ' ')).join('\t')).join('\n')
              const blob = new Blob(['\uFEFF' + tsv], { type: 'application/vnd.ms-excel;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `zawodnicy_${new Date().toISOString().slice(0, 10)}.xls`
              link.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer whitespace-nowrap ml-auto"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}
          >
            📥 Eksport Excel
          </button>

          {/* Column picker */}
          <div className="relative" ref={colPickerRef}>
            <button
              onClick={() => setColPickerOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer whitespace-nowrap"
              style={{
                background: colPickerOpen ? 'var(--bg-elevated)' : 'var(--bg-card)',
                border: '1px solid var(--border-mid)',
                color: 'var(--text-muted)',
              }}
            >
              ⚙ Edytuj tabelę
              <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,92,27,0.15)', color: '#FF5C1B' }}>
                {activeColumns.length + 2}
              </span>
            </button>

            {colPickerOpen && (
              <div
                className="absolute top-full right-0 mt-1 rounded-2xl p-3"
                style={{
                  zIndex: 9999,
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  minWidth: 270,
                }}
              >
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Widoczne kolumny</div>

                {/* Always-on */}
                {['Zawodnik', 'Status'].map(label => (
                  <div key={label} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg select-none" style={{ opacity: 0.45 }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-xs"
                      style={{ background: 'rgba(255,92,27,0.15)', color: '#FF5C1B' }}>✓</div>
                    <span className="text-sm">{label}</span>
                    <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>zawsze</span>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />

                <div className="space-y-0.5">
                  {COLUMN_DEFS.map(c => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer"
                      style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <input
                        type="checkbox"
                        checked={activeColumns.includes(c.key)}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...activeColumns, c.key]
                            : activeColumns.filter(k => k !== c.key)
                          saveColumns(next)
                        }}
                        className="accent-orange-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm">{c.label}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{c.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => saveColumns(DEFAULT_COLUMNS)}
                  className="w-full mt-2 pt-2 text-xs text-left cursor-pointer"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  ↺ Przywróć domyślne
                </button>
              </div>
            )}
          </div>
        </div>

        {athletes.length > 0 && (
          <div
            className="mb-5 rounded-2xl px-4 py-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] shrink-0" style={{ color: 'var(--text-muted)' }}>
                Filtry
              </span>

              <button
                onClick={() => setStatusFilter('all')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
                style={{
                  background: statusFilter === 'all' ? 'rgba(255,92,27,0.12)' : 'var(--bg-elevated)',
                  color: statusFilter === 'all' ? '#FF5C1B' : 'var(--text-muted)',
                  border: statusFilter === 'all' ? '1px solid rgba(255,92,27,0.3)' : '1px solid var(--border)',
                }}
              >
                Wszyscy <span className="opacity-60">{athletes.length}</span>
              </button>

              {allStatuses.map(s => {
                const count = statusCounts[s.key] ?? 0
                if (count === 0 && statusFilter !== s.key) return null
                return (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
                    style={{
                      background: statusFilter === s.key ? 'rgba(255,92,27,0.12)' : 'var(--bg-elevated)',
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
                onClick={() => { setStatusMessage(null); openStatusModal() }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer ml-auto"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                title="Edytuj statusy"
              >
                ⚙ Statusy
              </button>

              {sortKey && (
                <button
                  onClick={() => { setSortKey(null); setSortDir('asc') }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  ↺ Wróć do własnej kolejności
                </button>
              )}
            </div>

          </div>
        )}

        {/* Empty states */}
        {athletes.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">👟</div>
            <div className="text-lg font-semibold mb-2">Brak zawodników</div>
            <div className="text-sm mb-6">Dodaj pierwszego zawodnika i wyślij mu link zaproszenia</div>
            <Button onClick={() => { setModalOpen(true) }}>+ Dodaj zawodnika</Button>
          </div>
        )}

        {athletes.length > 0 && displayed.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-3xl mb-3">🔍</div>
            <div className="text-sm">Brak zawodników spełniających kryteria</div>
            <button
              onClick={() => { setSearch(''); setStatusFilter('all') }}
              className="mt-4 inline-flex items-center rounded-xl px-3 py-2 text-sm cursor-pointer"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              Wyczyść filtry
            </button>
          </div>
        )}

        {/* Table */}
        {displayed.length > 0 && (
          <>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              ℹ️ Kliknij na status zawodnika, aby go zmienić
            </p>
            <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <table className="w-full text-sm" style={{ minWidth: 600 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    {!sortKey && <th className="px-3 py-4 w-8" style={{ color: 'var(--text-muted)' }} />}
                    <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Zawodnik" sk="name" />
                    <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Status" sk="status" />
                    {col('last_session') && <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Ostatni trening" sk="last_session" />}
                    {col('next_session') && <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Następna sesja" sk="next_session" />}
                    {col('signal') && <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Forma" sk="signal" />}
                    {col('compliance') && <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Realizacja 30 dni" sk="compliance" />}
                    {col('weekly_load') && <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Obciążenie 7 dni" sk="weekly_load" />}
                    {col('package') && <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Pakiet" sk="package" />}
                    {col('join_date') && <SortHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Data dołączenia" sk="join_date" />}
                    {col('phone') && <th className="text-center px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Telefon</th>}
                    {col('age') && <th className="text-center px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Wiek</th>}
                    {col('city') && <th className="text-center px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>Miasto</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((athlete, i) => {
                    const lastSession = lastSessionMap[athlete.id]
                    const nextSession = nextSessionMap[athlete.id]
                    const signal = signalMap[athlete.id]
                    const compliance = complianceMap[athlete.id]
                    const isDraggingOver = dragOverId === athlete.id && draggingId !== athlete.id
                    const statusDef = getStatusDef(athlete.status)
                    const unreadMsg = unreadMessagesMap[athlete.id] ?? 0
                    const unreadFb = unreadFeedbackMap[athlete.id] ?? 0
                    const weeklyCount = weeklySessionCountMap[athlete.id] ?? 0
                    const weeklyKm = weeklyLoadMap[athlete.id] ?? 0
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
                          background: isDraggingOver ? 'rgba(255,92,27,0.06)' : draggingId === athlete.id ? 'rgba(255,92,27,0.03)' : i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-card)',
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

                        {/* Zawodnik */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 text-left">
                            <Avatar initials={athlete.avatar} size="sm" />
                            <div className="min-w-0">
                              <div className="font-medium flex items-center gap-1.5">
                                <Link href={`/coach/athletes/${athlete.id}`} className="truncate hover:text-orange-400 transition-colors">
                                  {athlete.name}
                                </Link>
                                {!!unreadMsg && (
                                  <span
                                    title={`${unreadMsg} wiadomości`}
                                    className="inline-flex items-center justify-center rounded-full text-white font-bold shrink-0"
                                    style={{ background: '#FF5C1B', minWidth: 16, height: 16, fontSize: 9, padding: '0 4px' }}
                                  >
                                    {unreadMsg}
                                  </span>
                                )}
                                {!!unreadFb && (
                                  <span
                                    title={`${unreadFb} feedback`}
                                    className="inline-flex items-center justify-center rounded-full text-white font-bold shrink-0"
                                    style={{ background: '#3B82F6', minWidth: 16, height: 16, fontSize: 9, padding: '0 4px' }}
                                  >
                                    {unreadFb}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{athlete.email ?? '—'}</div>
                              {athlete.goal && (
                                <div className="text-xs mt-0.5 truncate max-w-52" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                  {athlete.goal}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (actionMenuFor === athlete.id) {
                                    setActionMenuFor(null)
                                    setActionMenuPos(null)
                                    return
                                  }
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setActionMenuPos({ top: rect.bottom + 6, left: rect.left })
                                  setActionMenuFor(athlete.id)
                                }}
                                className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] cursor-pointer transition-opacity hover:opacity-80"
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                              >
                                Akcje <span className="opacity-50">▾</span>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Status — blisko identyfikacji zawodnika */}
                        <td className="px-5 py-3"
                          onClick={e => {
                            e.stopPropagation()
                            if (editingStatusFor === athlete.id) {
                              setEditingStatusFor(null)
                              setStatusDropdownPos(null)
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setStatusDropdownPos({ top: rect.bottom + 4, left: rect.left })
                              setEditingStatusFor(athlete.id)
                            }
                          }}>
                          <div className="flex items-center justify-center gap-2 cursor-pointer select-none hover:opacity-70 transition-opacity">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusDef.color }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{statusDef.label}</span>
                            <span className="text-xs opacity-30">▾</span>
                          </div>
                        </td>

                        {/* Ostatni trening */}
                        {col('last_session') && (
                          <td className="px-5 py-3">
                            {lastSession ? (() => {
                              const { text, color } = daysAgo(lastSession.date)
                              const showDate = !['dziś', 'wczoraj'].includes(text)
                              return (
                                <div className="space-y-0.5 leading-tight text-center">
                                  <div
                                    className="text-[11px] font-medium uppercase tracking-[0.08em]"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    {sessionTypeLabel(lastSession.type as Parameters<typeof sessionTypeLabel>[0])}
                                  </div>
                                  <div className="text-sm font-semibold" style={{ color }}>
                                    {text}
                                  </div>
                                  {showDate && (
                                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                      {formatDate(lastSession.date, { day: 'numeric', month: 'short' })}
                                    </div>
                                  )}
                                </div>
                              )
                            })() : (
                              <EmptyValue />
                            )}
                          </td>
                        )}

                        {/* Następna sesja — ostrzeżenie gdy brak a status OK */}
                        {col('next_session') && (
                          <td className="px-5 py-3">
                            {nextSession ? (() => {
                              const { text, color } = daysUntil(nextSession.date)
                              const showDate = !['dziś', 'jutro'].includes(text)
                              return (
                                <div className="space-y-0.5 leading-tight text-center">
                                  <div
                                    className="text-[11px] font-medium uppercase tracking-[0.08em]"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    {sessionTypeLabel(nextSession.type as Parameters<typeof sessionTypeLabel>[0])}
                                  </div>
                                  <div className="text-sm font-semibold" style={{ color }}>
                                    {text}
                                  </div>
                                  {showDate && (
                                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                      {formatDate(nextSession.date, { day: 'numeric', month: 'short' })}
                                    </div>
                                  )}
                                </div>
                              )
                            })() : athlete.status === 'ok' ? (
                              <div className="space-y-0.5 leading-tight text-center">
                                <div className="text-sm font-semibold" style={{ color: '#F1C40F' }}>Brak planu</div>
                                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Brak zaplanowanej sesji</div>
                              </div>
                            ) : (
                              <EmptyValue />
                            )}
                          </td>
                        )}

                        {/* Forma — signal + data */}
                        {col('signal') && (
                          <td className="px-5 py-3">
                            {signal ? (
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SIGNAL_COLORS[signal] ?? '#6B7280' }} />
                                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{SIGNAL_LABELS[signal] ?? signal}</span>
                                </div>
                                {lastFeedbackDateMap[athlete.id] && (() => {
                                  const { text } = daysAgo(lastFeedbackDateMap[athlete.id])
                                  return <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{text}</div>
                                })()}
                              </div>
                            ) : (
                              <EmptyValue />
                            )}
                          </td>
                        )}

                        {/* Realizacja 30 dni */}
                        {col('compliance') && (
                          <td className="px-5 py-3">
                            {compliance ? (() => {
                              const pct = Math.round((compliance.completed / compliance.total) * 100)
                              const color = pct >= 80 ? '#2ECC71' : pct >= 60 ? '#F1C40F' : '#E74C3C'
                              return (
                                <div className="text-center">
                                  <div className="text-sm font-semibold" style={{ color }}>{pct}%</div>
                                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {compliance.completed} z {compliance.total} sesji
                                  </div>
                                </div>
                              )
                            })() : (
                              <EmptyValue />
                            )}
                          </td>
                        )}

                        {/* Obciążenie 7 dni — km + liczba sesji */}
                        {col('weekly_load') && (
                          <td className="px-5 py-3">
                            {weeklyKm > 0 || weeklyCount > 0 ? (
                              <div className="text-center">
                                <div className="text-sm font-medium">
                                  {weeklyKm > 0 ? `${weeklyKm.toFixed(0)} km` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </div>
                                {weeklyCount > 0 && (
                                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {sesjaLabel(weeklyCount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <EmptyValue />
                            )}
                          </td>
                        )}

                        {/* Pakiet — cena inline + badge nieopłacone */}
                        {col('package') && (
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <div className="text-sm font-medium" style={{ whiteSpace: 'nowrap' }}>
                                {athlete.package
                                  ? `${athlete.package}${(athlete.package_price ?? 0) > 0 ? `, ${formatCurrency(athlete.package_price)}` : ''}`
                                  : <EmptyValue />}
                              </div>
                              {unpaidInvoiceSet[athlete.id] && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                                  style={{ background: 'rgba(231,76,60,0.12)', color: '#E74C3C' }}
                                >
                                  Nieopłacone
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Data dołączenia + staż */}
                        {col('join_date') && (
                          <td className="px-5 py-3 text-center">
                            {athlete.join_date ? (
                              <div className="text-center">
                                <div className="text-sm" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  {formatDate(athlete.join_date, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                  {tenureLabel(athlete.join_date)}
                                </div>
                              </div>
                            ) : <EmptyValue />}
                          </td>
                        )}

                        {/* Telefon — klikalny */}
                        {col('phone') && (
                          <td className="px-5 py-3 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                            {athlete.phone
                              ? <a href={`tel:${athlete.phone}`} className="hover:text-orange-400 transition-colors">{athlete.phone}</a>
                              : <EmptyValue />}
                          </td>
                        )}

                        {/* Wiek */}
                        {col('age') && (
                          <td className="px-5 py-3 text-sm text-center" style={{ whiteSpace: 'nowrap' }}>
                            {athlete.age !== null ? `${athlete.age} lat` : <EmptyValue />}
                          </td>
                        )}

                        {/* Miasto */}
                        {col('city') && (
                          <td className="px-5 py-3 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                            {athlete.city ?? <EmptyValue />}
                          </td>
                        )}

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Status dropdown — fixed, above overflow:hidden */}
        {editingStatusFor && statusDropdownPos && (() => {
          const athlete = displayed.find(a => a.id === editingStatusFor)
          if (!athlete) return null
          return (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: statusDropdownPos.top,
                left: statusDropdownPos.left,
                zIndex: 9999,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '4px',
                minWidth: 180,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {allStatuses.map(s => (
                <button
                  key={s.key}
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(athlete.id, s.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left cursor-pointer transition-opacity hover:opacity-70"
                  style={{
                    background: s.key === athlete.status ? 'rgba(255,92,27,0.08)' : 'transparent',
                    color: s.key === athlete.status ? '#FF5C1B' : 'var(--text-primary)',
                    opacity: updatingStatus ? 0.6 : 1,
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  {s.label}
                  {s.key === athlete.status && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
            </div>
          )
        })()}

        {actionMenuFor && actionMenuPos && (() => {
          const athlete = displayed.find(a => a.id === actionMenuFor)
          if (!athlete) return null
          const items = [
            { href: `/coach/athletes/${athlete.id}`, label: 'Profil' },
            { href: `/coach/planner?athlete=${athlete.id}`, label: 'Planer' },
            { href: `/coach/chat?athlete=${athlete.id}`, label: 'Czat' },
            { href: `/coach/invoices?athlete=${athlete.id}`, label: 'Faktury' },
          ]
          return (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: actionMenuPos.top,
                left: actionMenuPos.left,
                zIndex: 9999,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '4px',
                minWidth: 150,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { setActionMenuFor(null); setActionMenuPos(null) }}
                  className="block rounded-lg px-3 py-2 text-sm transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )
        })()}
      </div>

      <AddAthleteModal
        open={modalOpen}
        packages={packages}
        onClose={() => setModalOpen(false)}
        onCreated={(name) => {
          setStatusMessage({ tone: 'success', text: `Dodano zawodnika: ${name}.` })
          startTransition(() => router.refresh())
        }}
      />

      <StatusEditorModal
        open={statusModalOpen}
        statuses={allStatuses}
        onClose={() => setStatusModalOpen(false)}
        onSave={async (statuses) => {
          try {
            setStatusMessage(null)
            await saveAll(statuses)
            setStatusModalOpen(false)
            setStatusMessage({ tone: 'success', text: 'Statusy zawodników zostały zapisane.' })
            startTransition(() => router.refresh())
          } catch (error) {
            setStatusMessage({
              tone: 'error',
              text: error instanceof Error ? error.message : 'Nie udało się zapisać statusów zawodników.',
            })
          }
        }}
      />
    </div>
  )
}
