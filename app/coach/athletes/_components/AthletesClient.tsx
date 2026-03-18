'use client'

import { startTransition, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { saveAthleteOrder, updateAthlete } from '@/lib/actions/athletes'
import { type StatusDef, useCustomStatuses } from '@/lib/useCustomStatuses'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AddAthleteModal } from './AddAthleteModal'
import { AthletesFilters } from './AthletesFilters'
import { AthletesTable } from './AthletesTable'
import { AthletesToolbar } from './AthletesToolbar'
import { StatusEditorModal } from './StatusEditorModal'
import { COLUMN_DEFS, COLUMNS_STORAGE_KEY, DEFAULT_COLUMNS, SIGNAL_LABELS } from './types'
import type { AthletesClientProps, ColumnKey, SortKey } from './types'

const TABLE_HINT_STORAGE_KEY = 'athletes-table-hint-dismissed'

function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="text-center py-14 px-6" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 24, background: 'var(--bg-card)' }}>
      <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</div>
      <div className="text-sm mb-5 max-w-xl mx-auto">{description}</div>
      <button
        onClick={onAction}
        className="inline-flex items-center rounded-xl px-3 py-2 text-sm cursor-pointer"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
      >
        {actionLabel}
      </button>
    </div>
  )
}

function escapeExcelHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizeColumns(raw: unknown): ColumnKey[] {
  if (!Array.isArray(raw)) return DEFAULT_COLUMNS

  const validKeys = new Set(COLUMN_DEFS.map((column) => column.key))
  const seen = new Set<ColumnKey>()
  const next: ColumnKey[] = []

  for (const item of raw) {
    if (typeof item !== 'string') continue
    if (!validKeys.has(item as ColumnKey)) continue
    const key = item as ColumnKey
    if (seen.has(key)) continue
    seen.add(key)
    next.push(key)
  }

  return next.length > 0 ? next : DEFAULT_COLUMNS
}

function clampFloatingMenu(rect: DOMRect, minWidth: number, estimatedHeight: number, offset = 6) {
  if (typeof window === 'undefined') {
    return { top: rect.bottom + offset, left: rect.left }
  }

  const padding = 12
  const maxLeft = Math.max(padding, window.innerWidth - minWidth - padding)
  const topCandidate = rect.bottom + offset
  const maxTop = Math.max(padding, window.innerHeight - estimatedHeight - padding)

  return {
    left: Math.min(Math.max(rect.left, padding), maxLeft),
    top: Math.min(topCandidate, maxTop),
  }
}

export function AthletesClient({
  coachId,
  athletes,
  lastSessionMap,
  weeklyLoadMap,
  weeklySessionCountMap,
  nextRaceMap,
  packages,
  signalMap,
  lastFeedbackDateMap,
  nextSessionMap,
  unreadMessagesMap,
  unreadFeedbackMap,
  complianceMap,
  unpaidInvoiceSet,
  initialStatuses,
}: AthletesClientProps) {
  const router = useRouter()
  const { all: allStatuses, saveAll } = useCustomStatuses(initialStatuses)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [editingStatusFor, setEditingStatusFor] = useState<string | null>(null)
  const [statusDropdownPos, setStatusDropdownPos] = useState<{ top: number; left: number } | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null)
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [columnOverride, setColumnOverride] = useState<ColumnKey[] | null>(null)
  const [packageFilter, setPackageFilter] = useState('all')
  const [hintDismissedOverride, setHintDismissedOverride] = useState<boolean | null>(null)
  const [colPickerOpen, setColPickerOpen] = useState(false)
  const [statusFilterOpen, setStatusFilterOpen] = useState(false)
  const colPickerRef = useRef<HTMLDivElement>(null)
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const columnsStorageKey = `${COLUMNS_STORAGE_KEY}:${coachId || 'guest'}`
  const hintStorageKey = `${TABLE_HINT_STORAGE_KEY}:${coachId || 'guest'}`

  const statusOrderMap = useMemo(
    () => Object.fromEntries(allStatuses.map((status, index) => [status.key, index])),
    [allStatuses],
  )

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const athlete of athletes) map[athlete.status] = (map[athlete.status] ?? 0) + 1
    return map
  }, [athletes])

  function getStatusDef(key: string): StatusDef {
    return allStatuses.find((status) => status.key === key) ?? { key, label: key, color: '#6B7280' }
  }

  function saveColumns(columns: ColumnKey[]) {
    const sanitized = sanitizeColumns(columns)
    setColumnOverride(sanitized)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(columnsStorageKey, JSON.stringify(sanitized))
    }
    if (!sanitized.includes('package') && packageFilter !== 'all') {
      setPackageFilter('all')
      setStatusMessage({ tone: 'success', text: 'Ukryto kolumnę Pakiet, więc filtr po pakiecie został wyłączony.' })
    }
  }

  useEffect(() => {
    if (!colPickerOpen) return
    function close(e: MouseEvent) {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setColPickerOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [colPickerOpen])

  useEffect(() => {
    if (!editingStatusFor) return
    function close() {
      setEditingStatusFor(null)
      setStatusDropdownPos(null)
    }
    document.addEventListener('click', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [editingStatusFor])

  useEffect(() => {
    if (!actionMenuFor) return
    function close() {
      setActionMenuFor(null)
      setActionMenuPos(null)
    }
    document.addEventListener('click', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [actionMenuFor])

  const storedColumns = useMemo(() => {
    if (!hydrated) return DEFAULT_COLUMNS
    try {
      const raw = window.localStorage.getItem(columnsStorageKey)
      return raw ? sanitizeColumns(JSON.parse(raw)) : DEFAULT_COLUMNS
    } catch {
      return DEFAULT_COLUMNS
    }
  }, [hydrated, columnsStorageKey])

  const hintDismissed = useMemo(() => {
    if (hintDismissedOverride !== null) return hintDismissedOverride
    if (!hydrated) return true
    try {
      return !!window.localStorage.getItem(hintStorageKey)
    } catch {
      return false
    }
  }, [hydrated, hintDismissedOverride, hintStorageKey])

  const activeColumns = columnOverride ?? storedColumns
  const effectiveActiveColumns = hydrated ? activeColumns : DEFAULT_COLUMNS
  const packageColumnVisible = effectiveActiveColumns.includes('package')

  const packageOptions = useMemo(() => {
    const values = new Set<string>()
    for (const athlete of athletes) {
      if (athlete.package.trim()) values.add(athlete.package.trim())
    }
    for (const pkg of packages) {
      if (pkg.name.trim()) values.add(pkg.name.trim())
    }
    return [...values].sort((a, b) => a.localeCompare(b, 'pl'))
  }, [athletes, packages])

  const filtered = useMemo(() => {
    return athletes.filter((athlete) => {
      const q = search.trim().toLowerCase()
      const matchesText = !q
        || athlete.name.toLowerCase().includes(q)
        || (athlete.goal ?? '').toLowerCase().includes(q)
        || athlete.package.toLowerCase().includes(q)
        || (athlete.email ?? '').toLowerCase().includes(q)
        || (athlete.phone ?? '').includes(q)

      const matchesStatus = statusFilter === 'all' || athlete.status === statusFilter
      const matchesPackage = packageFilter === 'all' || !packageColumnVisible || athlete.package === packageFilter
      return matchesText && matchesStatus && matchesPackage
    })
  }, [athletes, search, statusFilter, packageFilter, packageColumnVisible])

  const displayed = useMemo(() => {
    const persistedOrder = orderOverride ?? athletes.map((athlete) => athlete.id)
    if (sortKey) {
      return [...filtered].sort((a, b) => {
        if (sortKey === 'signal') {
          const order: Record<string, number> = { green: 0, yellow: 1, red: 2 }
          const av = order[signalMap[a.id]] ?? 3
          const bv = order[signalMap[b.id]] ?? 3
          return sortDir === 'asc' ? av - bv : bv - av
        }
        if (sortKey === 'weekly_load') {
          const av = weeklyLoadMap[a.id] ?? 0
          const bv = weeklyLoadMap[b.id] ?? 0
          return sortDir === 'asc' ? av - bv : bv - av
        }
        if (sortKey === 'next_race') {
          const av = nextRaceMap[a.id]?.date ?? '9999-12-31'
          const bv = nextRaceMap[b.id]?.date ?? '9999-12-31'
          const cmp = av.localeCompare(bv)
          return sortDir === 'asc' ? cmp : -cmp
        }
        if (sortKey === 'compliance') {
          const ac = complianceMap[a.id]
          const bc = complianceMap[b.id]
          const av = ac ? ac.completed / ac.total : -1
          const bv = bc ? bc.completed / bc.total : -1
          return sortDir === 'asc' ? av - bv : bv - av
        }
        if (sortKey === 'status') {
          const av = statusOrderMap[a.status] ?? Number.MAX_SAFE_INTEGER
          const bv = statusOrderMap[b.status] ?? Number.MAX_SAFE_INTEGER
          return sortDir === 'asc' ? av - bv : bv - av
        }

        let av = ''
        let bv = ''
        if (sortKey === 'name') { av = a.name; bv = b.name }
        else if (sortKey === 'package') { av = a.package; bv = b.package }
        else if (sortKey === 'join_date') { av = a.join_date; bv = b.join_date }
        else if (sortKey === 'last_session') { av = lastSessionMap[a.id]?.date ?? ''; bv = lastSessionMap[b.id]?.date ?? '' }
        else if (sortKey === 'next_session') { av = nextSessionMap[a.id]?.date ?? '9999-12-31'; bv = nextSessionMap[b.id]?.date ?? '9999-12-31' }
        const cmp = av.localeCompare(bv)
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    const filteredIds = new Set(filtered.map((athlete) => athlete.id))
    const orderedIds = persistedOrder.filter((id) => filteredIds.has(id))
    const missingIds = filtered.map((athlete) => athlete.id).filter((id) => !orderedIds.includes(id))
    const finalOrder = [...orderedIds, ...missingIds]
    const orderMap = Object.fromEntries(finalOrder.map((id, index) => [id, index]))
    return [...filtered].sort((a, b) => (orderMap[a.id] ?? Number.MAX_SAFE_INTEGER) - (orderMap[b.id] ?? Number.MAX_SAFE_INTEGER))
  }, [filtered, sortKey, sortDir, signalMap, weeklyLoadMap, nextRaceMap, complianceMap, statusOrderMap, lastSessionMap, nextSessionMap, orderOverride, athletes])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else {
        setSortKey(null)
        setSortDir('asc')
      }
      return
    }
    setSortKey(key)
    setSortDir('asc')
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

  async function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId || sortKey) return
    const fullOrder = athletes.map((athlete) => athlete.id)
    const currentOrder = [
      ...(orderOverride ?? fullOrder).filter((id) => fullOrder.includes(id)),
      ...fullOrder.filter((id) => !(orderOverride ?? fullOrder).includes(id)),
    ]
    const fromIdx = currentOrder.indexOf(draggingId)
    const toIdx = currentOrder.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const nextOrder = [...currentOrder]
    nextOrder.splice(fromIdx, 1)
    nextOrder.splice(toIdx, 0, draggingId)
    setOrderOverride(nextOrder)
    setDraggingId(null)
    setDragOverId(null)

    const result = await saveAthleteOrder(nextOrder)
    if (result && 'error' in result) {
      setStatusMessage({ tone: 'error', text: result.error ?? 'Nie udało się zapisać nowej kolejności zawodników.' })
      setOrderOverride(null)
      return
    }

    setStatusMessage({ tone: 'success', text: 'Nowa kolejność zawodników została zapisana.' })
    startTransition(() => router.refresh())
  }

  function dismissHint() {
    setHintDismissedOverride(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(hintStorageKey, '1')
    }
  }

  function exportDisplayedAthletes() {
    const columns: Array<{ label: string; value: (athlete: AthletesClientProps['athletes'][number], index: number) => string | number }> = [
      { label: 'Lp.', value: (_athlete, index) => index + 1 },
      { label: 'Imię i nazwisko', value: (athlete) => athlete.name },
      { label: 'Email', value: (athlete) => athlete.email ?? '' },
      { label: 'Telefon', value: (athlete) => athlete.phone ?? '' },
      { label: 'Miasto', value: (athlete) => athlete.city ?? '' },
      { label: 'Wiek', value: (athlete) => athlete.age !== null ? athlete.age : '' },
      { label: 'Cel', value: (athlete) => athlete.goal ?? '' },
      { label: 'Pakiet', value: (athlete) => athlete.package?.trim() ?? '' },
      { label: 'Cena pakietu', value: (athlete) => athlete.package_price ? formatCurrency(athlete.package_price) : '' },
      { label: 'Płatność', value: (athlete) => unpaidInvoiceSet[athlete.id] ? 'Nieopłacone' : 'OK' },
      { label: 'Status zawodnika', value: (athlete) => getStatusDef(athlete.status).label },
      { label: 'Nieprzeczytane wiadomości', value: (athlete) => unreadMessagesMap[athlete.id] ?? 0 },
      { label: 'Nieprzeczytane feedbacki', value: (athlete) => unreadFeedbackMap[athlete.id] ?? 0 },
      { label: 'Ostatni trening - data', value: (athlete) => lastSessionMap[athlete.id]?.date ? formatDate(lastSessionMap[athlete.id].date, { day: 'numeric', month: 'short', year: 'numeric' }) : '' },
      { label: 'Ostatni trening - typ', value: (athlete) => lastSessionMap[athlete.id]?.type ?? '' },
      { label: 'Następna sesja - data', value: (athlete) => nextSessionMap[athlete.id]?.date ? formatDate(nextSessionMap[athlete.id].date, { day: 'numeric', month: 'short', year: 'numeric' }) : '' },
      { label: 'Następna sesja - typ', value: (athlete) => nextSessionMap[athlete.id]?.type ?? '' },
      { label: 'Sygnał formy', value: (athlete) => SIGNAL_LABELS[signalMap[athlete.id] ?? ''] ?? '' },
      { label: 'Ostatni feedback', value: (athlete) => lastFeedbackDateMap[athlete.id] ? new Date(lastFeedbackDateMap[athlete.id]).toLocaleString('pl-PL') : '' },
      {
        label: 'Realizacja 30 dni (%)',
        value: (athlete) => {
          const compliance = complianceMap[athlete.id]
          return compliance ? `${Math.round((compliance.completed / compliance.total) * 100)}%` : ''
        },
      },
      { label: 'Realizacja 30 dni - ukończone sesje', value: (athlete) => complianceMap[athlete.id]?.completed ?? 0 },
      { label: 'Realizacja 30 dni - wszystkie sesje', value: (athlete) => complianceMap[athlete.id]?.total ?? 0 },
      { label: 'Obciążenie 7 dni (km)', value: (athlete) => {
        const km = weeklyLoadMap[athlete.id] ?? 0
        return km ? Number(km).toFixed(0) : ''
      } },
      { label: 'Obciążenie 7 dni - sesje', value: (athlete) => weeklySessionCountMap[athlete.id] ?? 0 },
      {
        label: 'Następne zawody - nazwa',
        value: (athlete) => {
          const race = nextRaceMap[athlete.id]
          return race?.name ?? ''
        },
      },
      { label: 'Następne zawody - data', value: (athlete) => nextRaceMap[athlete.id]?.date ? formatDate(nextRaceMap[athlete.id].date, { day: 'numeric', month: 'short', year: 'numeric' }) : '' },
      { label: 'Następne zawody - dystans', value: (athlete) => nextRaceMap[athlete.id]?.distance ?? '' },
      { label: 'Data dołączenia', value: (athlete) => athlete.join_date ? formatDate(athlete.join_date, { day: 'numeric', month: 'short', year: 'numeric' }) : '' },
    ]

    const generatedAt = new Date()
    const headerCells = columns.map((column) => (
      `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeExcelHtml(column.label)}</Data></Cell>`
    )).join('')
    const dataRows = displayed.map((athlete, index) => (
      `<Row>${columns.map((column) => `<Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeExcelHtml(column.value(athlete, index))}</Data></Cell>`).join('')}</Row>`
    )).join('')
    const xml = `<?xml version="1.0"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Styles>
          <Style ss:ID="Header">
            <Font ss:Bold="1" ss:Color="#C2410C" />
            <Interior ss:Color="#FFF3ED" ss:Pattern="Solid" />
            <Borders>
              <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDBA74" />
              <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDBA74" />
              <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDBA74" />
              <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDBA74" />
            </Borders>
          </Style>
          <Style ss:ID="Cell">
            <Borders>
              <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB" />
              <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB" />
              <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB" />
              <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB" />
            </Borders>
          </Style>
          <Style ss:ID="Meta">
            <Font ss:Color="#6B7280" />
          </Style>
          <Style ss:ID="Title">
            <Font ss:Bold="1" ss:Size="14" />
          </Style>
        </Styles>
        <Worksheet ss:Name="Zawodnicy">
          <Table>
            <Row>
              <Cell ss:StyleID="Title"><Data ss:Type="String">Eksport zawodników</Data></Cell>
            </Row>
            <Row>
              <Cell ss:StyleID="Meta"><Data ss:Type="String">Wygenerowano: ${escapeExcelHtml(generatedAt.toLocaleString('pl-PL'))}</Data></Cell>
            </Row>
            <Row>
              <Cell ss:StyleID="Meta"><Data ss:Type="String">Liczba rekordów: ${escapeExcelHtml(displayed.length)}</Data></Cell>
            </Row>
            <Row>
              <Cell ss:StyleID="Meta"><Data ss:Type="String">Zakres: bieżący widok listy zawodników</Data></Cell>
            </Row>
            <Row />
            <Row>${headerCells}</Row>
            ${dataRows}
          </Table>
          <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
            <DisplayGridlines />
          </WorksheetOptions>
        </Worksheet>
      </Workbook>`.trim()

    const blob = new Blob(['\uFEFF' + xml], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `zawodnicy_${new Date().toISOString().slice(0, 10)}.xml`
    link.click()
    URL.revokeObjectURL(url)
  }

  const subtitle = useMemo(() => {
    const total = athletes.length
    const visible = displayed.length
    const plural = total === 1 ? 'zawodnik' : (total % 10 >= 2 && total % 10 <= 4 && !(total % 100 >= 12 && total % 100 <= 14)) ? 'zawodnicy' : 'zawodników'
    return visible < total ? `${visible} z ${total} ${plural}` : `${total} ${plural}`
  }, [athletes.length, displayed.length])

  return (
    <div>
      <CoachTopbar title="Zawodnicy" subtitle={subtitle} />

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

        <AthletesToolbar
          search={search}
          onSearchChange={setSearch}
          activeColumns={effectiveActiveColumns}
          colPickerOpen={colPickerOpen}
          colPickerRef={colPickerRef}
          onToggleColumns={() => setColPickerOpen((value) => !value)}
          onSaveColumns={saveColumns}
          onAddAthlete={() => {
            setStatusMessage(null)
            setModalKey((value) => value + 1)
            setModalOpen(true)
          }}
          onExport={exportDisplayedAthletes}
          defaultColumns={DEFAULT_COLUMNS}
        />

        {athletes.length > 0 && (
          <AthletesFilters
            athletesCount={athletes.length}
            statusCounts={statusCounts}
            allStatuses={allStatuses}
            packageOptions={packageOptions}
            statusFilter={statusFilter}
            packageFilter={packageFilter}
            statusFilterOpen={statusFilterOpen}
            sortKeyActive={!!sortKey}
            showPackageFilter={packageColumnVisible}
            onStatusFilterChange={(value) => {
              setStatusFilter(value)
            }}
            onPackageFilterChange={(value) => {
              setPackageFilter(value)
            }}
            onToggleStatusFilterOpen={() => setStatusFilterOpen((value) => !value)}
            onOpenStatusModal={() => {
              setStatusMessage(null)
              setStatusModalOpen(true)
            }}
            onResetSort={() => {
              setSortKey(null)
              setSortDir('asc')
            }}
          />
        )}

        {athletes.length === 0 && (
          <EmptyState
            title="Nie masz jeszcze żadnych zawodników"
            description="Dodaj pierwszego zawodnika, żeby zacząć planować treningi, zbierać feedback i prowadzić komunikację w jednym miejscu."
            actionLabel="+ Dodaj pierwszego zawodnika"
            onAction={() => {
              setModalKey((value) => value + 1)
              setModalOpen(true)
            }}
          />
        )}

        {athletes.length > 0 && displayed.length === 0 && (
          <EmptyState
            title="Te filtry nic teraz nie pokazują"
            description="Nie znaleziono zawodników pasujących do aktualnego wyszukiwania lub wybranego statusu. Wyczyść filtry albo zawęź zapytanie mniej agresywnie."
            actionLabel="Wyczyść filtry"
            onAction={() => {
              setSearch('')
              setStatusFilter('all')
              setPackageFilter('all')
            }}
          />
        )}

        {displayed.length > 0 && (
          <>
            {!hintDismissed && (
              <div
                className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm"
                style={{ background: 'rgba(255,92,27,0.08)', border: '1px solid rgba(255,92,27,0.2)' }}
              >
                <span className="text-lg shrink-0">💡</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  Tabelę możesz dostosować do swojej pracy: zmieniać widoczne kolumny, ustawiać ich kolejność, sortować dane i przeciągać wiersze, gdy sortowanie jest wyłączone.
                </span>
                <button
                  onClick={dismissHint}
                  className="shrink-0 text-lg leading-none cursor-pointer hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ×
                </button>
              </div>
            )}

            <AthletesTable
              displayed={displayed}
              sortKey={sortKey}
              sortDir={sortDir}
              activeColumns={effectiveActiveColumns}
              lastSessionMap={lastSessionMap}
              nextSessionMap={nextSessionMap}
              nextRaceMap={nextRaceMap}
              signalMap={signalMap}
              lastFeedbackDateMap={lastFeedbackDateMap}
              complianceMap={complianceMap}
              weeklyLoadMap={weeklyLoadMap}
              weeklySessionCountMap={weeklySessionCountMap}
              unreadMessagesMap={unreadMessagesMap}
              unreadFeedbackMap={unreadFeedbackMap}
              unpaidInvoiceSet={unpaidInvoiceSet}
              draggingId={draggingId}
              dragOverId={dragOverId}
              editingStatusFor={editingStatusFor}
              actionMenuFor={actionMenuFor}
              onSort={handleSort}
              onDragStart={setDraggingId}
              onDragOver={setDragOverId}
              onDrop={(athleteId) => void handleDrop(athleteId)}
              onDragEnd={() => {
                setDraggingId(null)
                setDragOverId(null)
              }}
              onToggleStatusMenu={(athleteId, rect) => {
                if (editingStatusFor === athleteId) {
                  setEditingStatusFor(null)
                  setStatusDropdownPos(null)
                  return
                }
                setStatusDropdownPos(clampFloatingMenu(rect, 180, 320, 4))
                setEditingStatusFor(athleteId)
              }}
              onToggleActionMenu={(athleteId, rect) => {
                if (actionMenuFor === athleteId) {
                  setActionMenuFor(null)
                  setActionMenuPos(null)
                  return
                }
                setActionMenuPos(clampFloatingMenu(rect, 150, 220, 6))
                setActionMenuFor(athleteId)
              }}
              getStatusDef={getStatusDef}
            />
          </>
        )}

        {editingStatusFor && statusDropdownPos && (() => {
          const athlete = displayed.find((item) => item.id === editingStatusFor)
          if (!athlete) return null
          return (
            <div
              onClick={(e) => e.stopPropagation()}
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
              {allStatuses.map((status) => (
                <button
                  key={status.key}
                  disabled={updatingStatus}
                  onClick={() => void handleStatusChange(athlete.id, status.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left cursor-pointer transition-opacity hover:opacity-70"
                  style={{
                    background: status.key === athlete.status ? 'rgba(255,92,27,0.08)' : 'transparent',
                    color: status.key === athlete.status ? '#FF5C1B' : 'var(--text-primary)',
                    opacity: updatingStatus ? 0.6 : 1,
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: status.color }} />
                  {status.label}
                  {status.key === athlete.status && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
            </div>
          )
        })()}

        {actionMenuFor && actionMenuPos && (() => {
          const athlete = displayed.find((item) => item.id === actionMenuFor)
          if (!athlete) return null
          const items = [
            { href: `/coach/athletes/${athlete.id}`, label: 'Profil' },
            { href: `/coach/planner?athlete=${athlete.id}`, label: 'Planer' },
            { href: `/coach/chat?athlete=${athlete.id}`, label: 'Czat' },
            { href: `/coach/invoices?athlete=${athlete.id}`, label: 'Faktury' },
          ]
          return (
            <div
              onClick={(e) => e.stopPropagation()}
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
                  onClick={() => {
                    setActionMenuFor(null)
                    setActionMenuPos(null)
                  }}
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
        key={modalKey}
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
