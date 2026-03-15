'use client'

import { useState, useActionState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { createAthlete } from '@/lib/actions/athletes'
import { INPUT_STYLE, LABEL_STYLE } from '@/lib/styles'

interface Package { id: string; name: string; price: number }

const inputStyle = {
  ...INPUT_STYLE,
  width: '100%',
  padding: '9px 12px',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle = LABEL_STYLE

interface AddAthleteModalProps {
  open: boolean
  packages: Package[]
  onClose: () => void
}

export function AddAthleteModal({ open, packages, onClose }: AddAthleteModalProps) {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(packages[0] ?? null)
  const [state, formAction, pending] = useActionState(createAthlete, null)

  return (
    <Modal open={open} onClose={onClose} title="Dodaj zawodnika" size="sm">
      <form action={async (fd) => {
        if (selectedPkg) fd.set('package_price', selectedPkg.price.toString())
        await formAction(fd)
        if (!state?.error) onClose()
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
            <Button type="button" variant="secondary" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Dodawanie...' : 'Dodaj zawodnika'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
