'use client'

import { useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { createPackage, updatePackage, deletePackage } from '@/lib/actions/packages'
import { formatCurrency } from '@/lib/utils'

type Package = {
  id: string
  name: string
  description: string | null
  price: number
}

const emptyForm = { id: '', name: '', description: '', price: '' }

export function PackagesClient({ packages }: { packages: Package[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Package | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const action = editing ? updatePackage : createPackage
  const [state, formAction, pending] = useActionState(action, null)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(pkg: Package) {
    setEditing(pkg)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    await deletePackage(id)
    setDeleteConfirm(null)
    setDeleting(false)
    router.refresh()
  }

  // Close modal and refresh on success
  if (state?.success && modalOpen) {
    closeModal()
    router.refresh()
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Zarządzaj pakietami — możesz je przypisywać zawodnikom w zakładce Dane.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: '#FF5C1B' }}
        >
          + Dodaj pakiet
        </button>
      </div>

      {/* Empty state */}
      {packages.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <div className="text-4xl mb-3">📦</div>
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Brak pakietów</p>
          <p className="text-sm">Utwórz pierwszy pakiet, aby móc go przypisywać zawodnikom.</p>
        </div>
      )}

      {/* Grid */}
      {packages.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                    {pkg.name}
                  </div>
                  {pkg.description && (
                    <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {pkg.description}
                    </div>
                  )}
                </div>
                <div className="text-lg font-bold shrink-0" style={{ color: '#FF5C1B' }}>
                  {formatCurrency(pkg.price)}
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => openEdit(pkg)}
                  className="flex-1 py-1.5 rounded-lg text-sm cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  Edytuj
                </button>
                {deleteConfirm === pkg.id ? (
                  <div className="flex gap-1.5 flex-1">
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      disabled={deleting}
                      className="flex-1 py-1.5 rounded-lg text-sm font-medium text-white cursor-pointer"
                      style={{ background: '#ef4444', opacity: deleting ? 0.7 : 1 }}
                    >
                      {deleting ? '...' : 'Potwierdź'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 py-1.5 rounded-lg text-sm cursor-pointer"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      Anuluj
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(pkg.id)}
                    className="flex-1 py-1.5 rounded-lg text-sm cursor-pointer transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                  >
                    Usuń
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edytuj pakiet' : 'Nowy pakiet'}
        size="sm"
        footer={
          <form action={formAction}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <PackageFormFields editing={editing} />
            {state?.error && (
              <p className="text-xs mt-2" style={{ color: '#f87171' }}>{state.error}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: '#FF5C1B', opacity: pending ? 0.7 : 1 }}
              >
                {pending ? 'Zapisywanie...' : editing ? 'Zapisz' : 'Utwórz'}
              </button>
            </div>
          </form>
        }
      >
        <div />
      </Modal>
    </>
  )
}

function PackageFormFields({ editing }: { editing: Package | null }) {
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block' as const,
    fontSize: 12,
    fontWeight: 600 as const,
    color: 'var(--text-muted)' as const,
    marginBottom: 5,
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label style={labelStyle}>Nazwa *</label>
        <input
          name="name"
          required
          defaultValue={editing?.name ?? ''}
          placeholder="np. Plan Premium"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Opis (opcjonalny)</label>
        <textarea
          name="description"
          defaultValue={editing?.description ?? ''}
          placeholder="Krótki opis pakietu..."
          rows={2}
          style={{ ...inputStyle, resize: 'none' }}
        />
      </div>
      <div>
        <label style={labelStyle}>Kwota miesięczna (PLN) *</label>
        <input
          name="price"
          type="number"
          required
          min={0}
          step={1}
          defaultValue={editing?.price ?? ''}
          placeholder="np. 299"
          style={inputStyle}
        />
      </div>
    </div>
  )
}
