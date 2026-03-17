'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { createPackage, deletePackage, updatePackage } from '@/lib/actions/packages'
import { formatCurrency } from '@/lib/utils'

type Package = {
  id: string
  name: string
  description: string | null
  price: number
}

export function PackagesClient({ packages }: { packages: Package[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Package | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setEditing(null)
    setError(null)
    setSuccess(null)
    setModalOpen(true)
  }

  function openEdit(pkg: Package) {
    setEditing(pkg)
    setError(null)
    setSuccess(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(null)
    const fd = new FormData(e.currentTarget)
    if (editing) fd.set('id', editing.id)
    const result = editing
      ? await updatePackage(null, fd)
      : await createPackage(null, fd)
    setPending(false)
    if (result && 'error' in result) {
      setError(result.error)
    } else {
      setSuccess(editing ? 'Zmiany pakietu zostały zapisane.' : 'Pakiet został utworzony.')
      closeModal()
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    setError(null)
    setSuccess(null)
    const result = await deletePackage(id)
    if (result && 'error' in result) {
      setError(result.error ?? 'Nie udało się usunąć pakietu')
      setDeleteConfirm(null)
      setDeleting(false)
      return
    }
    setDeleteConfirm(null)
    setDeleting(false)
    setSuccess('Pakiet został usunięty.')
    router.refresh()
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Zarządzaj pakietami — możesz je przypisywać zawodnikom w zakładce Dane.
        </p>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 shrink-0 ml-4"
          style={{ background: '#FF5C1B' }}
        >
          + Dodaj pakiet
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="text-xs text-green-400 mb-4">{success}</div>
      )}
      {error && !modalOpen && (
        <div className="text-xs text-red-400 mb-4">{error}</div>
      )}

      {/* Empty state */}
      {packages.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <div className="text-4xl mb-3">📦</div>
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Brak pakietów</p>
          <p className="text-sm">Utwórz pierwszy pakiet, aby móc go przypisywać zawodnikom.</p>
        </div>
      )}

      {/* Single-column list */}
      {packages.length > 0 && (
        <div className="flex flex-col gap-3">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className="flex items-center gap-4 rounded-2xl px-5 py-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  {pkg.name}
                </div>
                {pkg.description && (
                  <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {pkg.description}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-lg font-bold shrink-0" style={{ color: '#FF5C1B' }}>
                {formatCurrency(pkg.price)}<span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mies.</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(pkg)}
                  className="px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  Edytuj
                </button>
                {deleteConfirm === pkg.id ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      disabled={deleting}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white cursor-pointer"
                      style={{ background: '#ef4444', opacity: deleting ? 0.7 : 1 }}
                    >
                      {deleting ? '...' : 'Potwierdź'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      Anuluj
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(pkg.id)}
                    className="px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-opacity hover:opacity-80"
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
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PackageFormFields editing={editing} />
          {error && (
            <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
          )}
          <div className="flex gap-2 mt-2">
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
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 5,
  }
  return (
    <>
      <div>
        <label style={labelStyle}>Nazwa *</label>
        <input name="name" required defaultValue={editing?.name ?? ''} placeholder="np. Plan Premium" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Opis (opcjonalny)</label>
        <textarea name="description" defaultValue={editing?.description ?? ''} placeholder="Krótki opis pakietu..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
      </div>
      <div>
        <label style={labelStyle}>Kwota miesięczna (PLN) *</label>
        <input name="price" type="number" required min={0} step={1} defaultValue={editing?.price ?? ''} placeholder="np. 299" style={inputStyle} />
      </div>
    </>
  )
}
