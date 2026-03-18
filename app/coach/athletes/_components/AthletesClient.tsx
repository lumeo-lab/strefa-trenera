'use client'

import { startTransition, useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useStatusMessage } from '@/lib/hooks/useStatusMessage'
import { useClickOutside, useDismissOnInteraction } from '@/lib/hooks/useClickOutside'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { saveAthleteOrder, updateAthlete } from '@/lib/actions/athletes'
import { exportAthletesToExcel } from '@/lib/athletes-export'
import { type StatusDef, useCustomStatuses } from '@/lib/useCustomStatuses'
import { AddAthleteModal } from './AddAthleteModal'
import { AthletesActionMenu } from './AthletesActionMenu'
import { AthletesFilters } from './AthletesFilters'
import { AthletesStatusMenu } from './AthletesStatusMenu'
import { AthletesTable } from './AthletesTable'
import { AthletesToolbar } from './AthletesToolbar'
import { StatusEditorModal } from './StatusEditorModal'
import { COLUMN_DEFS, COLUMNS_STORAGE_KEY, DEFAULT_COLUMNS, SIGNAL_LABELS } from './types'
import type { AthletesClientProps, ColumnKey, SortKey } from './types'

const TABLE_HINT_STORAGE_KEY = 'athletes-table-hint-dismissed'

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
  const { statusMessage, showStatus, clearStatus } = useStatusMessage()
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
      showStatus('success', 'Ukryto kolumnę Pakiet, więc filtr po pakiecie został wyłączony.')
    }
  }

  useClickOutside(colPickerRef, useCallback(() => setColPickerOpen(false), []), colPickerOpen)

  const dismissStatusDropdown = useCallback(() => {
    setEditingStatusFor(null)
    setStatusDropdownPos(null)
  }, [])
  useDismissOnInteraction(dismissStatusDropdown, !!editingStatusFor)

  const dismissActionMenu = useCallback(() => {
    setActionMenuFor(null)
    setActionMenuPos(null)
  }, [])
  useDismissOnInteraction(dismissActionMenu, !!actionMenuFor)

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
    clearStatus()
    const fd = new FormData()
    fd.set('id', athleteId)
    fd.set('status', newStatus)
    const result = await updateAthlete(null, fd)
    if (result && 'error' in result) {
      showStatus('error', result.error ?? 'Nie udało się zmienić statusu zawodnika.')
      setUpdatingStatus(false)
      return
    }

    setEditingStatusFor(null)
    setStatusDropdownPos(null)
    setUpdatingStatus(false)
    showStatus('success', 'Status zawodnika został zapisany.')
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
      showStatus('error', result.error ?? 'Nie udało się zapisać nowej kolejności zawodników.')
      setOrderOverride(null)
      return
    }

    showStatus('success', 'Nowa kolejność zawodników została zapisana.')
    startTransition(() => router.refresh())
  }

  function dismissHint() {
    setHintDismissedOverride(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(hintStorageKey, '1')
    }
  }

  function exportDisplayedAthletes() {
    exportAthletesToExcel(displayed, {
      lastSessionMap,
      nextSessionMap,
      nextRaceMap,
      signalMap,
      lastFeedbackDateMap,
      complianceMap,
      weeklyLoadMap,
      weeklySessionCountMap,
      unreadMessagesMap,
      unreadFeedbackMap,
      unpaidInvoiceSet,
      signalLabels: SIGNAL_LABELS,
      getStatusDef,
    })
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
          <StatusMessage tone={statusMessage.tone} text={statusMessage.text} className="mb-4" />
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
            clearStatus()
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
              clearStatus()
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
            <AthletesStatusMenu
              pos={statusDropdownPos}
              athleteStatus={athlete.status}
              allStatuses={allStatuses}
              updating={updatingStatus}
              onSelect={(statusKey) => void handleStatusChange(athlete.id, statusKey)}
            />
          )
        })()}

        {actionMenuFor && actionMenuPos && (() => {
          const athlete = displayed.find((item) => item.id === actionMenuFor)
          if (!athlete) return null
          return (
            <AthletesActionMenu
              pos={actionMenuPos}
              athleteId={athlete.id}
              onClose={dismissActionMenu}
            />
          )
        })()}
      </div>

      <AddAthleteModal
        key={modalKey}
        open={modalOpen}
        packages={packages}
        onClose={() => setModalOpen(false)}
        onCreated={(name) => {
          showStatus('success', `Dodano zawodnika: ${name}.`)
          startTransition(() => router.refresh())
        }}
      />

      <StatusEditorModal
        open={statusModalOpen}
        statuses={allStatuses}
        onClose={() => setStatusModalOpen(false)}
        onSave={async (statuses) => {
          try {
            clearStatus()
            await saveAll(statuses)
            setStatusModalOpen(false)
            showStatus('success', 'Statusy zawodników zostały zapisane.')
            startTransition(() => router.refresh())
          } catch (error) {
            showStatus('error', error instanceof Error ? error.message : 'Nie udało się zapisać statusów zawodników.')
          }
        }}
      />
    </div>
  )
}
