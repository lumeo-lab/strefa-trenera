'use client'

import { useActionState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { updateCoachName, updateCoachEmail, updateCoachPassword } from '@/lib/actions/profile'

interface Props {
  email: string
  name: string
  plan: string
}

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-mid)',
  color: 'var(--text-primary)',
}

export function SettingsClient({ email, name, plan }: Props) {
  const [nameState, nameAction, namePending] = useActionState(updateCoachName, null)
  const [emailState, emailAction, emailPending] = useActionState(updateCoachEmail, null)
  const [passState, passAction, passPending] = useActionState(updateCoachPassword, null)

  function initials(n: string) {
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  return (
    <div>
      <CoachTopbar title="Ustawienia profilu" subtitle="Zarządzaj swoim kontem" />

      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* Avatar + plan info */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-xl text-white shrink-0">
              {initials(name)}
            </div>
            <div>
              <div className="font-bold text-lg">{name || '—'}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{email}</div>
              <div className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
                style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                Plan {plan}
              </div>
            </div>
          </div>
        </Card>

        {/* Name */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Imię i nazwisko</h3>
          <form action={nameAction} className="space-y-3">
            <input
              name="name"
              defaultValue={name}
              placeholder="Twoje imię i nazwisko"
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            />
            {nameState?.error && <p className="text-xs text-red-400">{nameState.error}</p>}
            {nameState?.success && <p className="text-xs text-green-400">✓ Zapisano</p>}
            <Button type="submit" size="sm" disabled={namePending}>
              {namePending ? 'Zapisywanie...' : 'Zapisz nazwę'}
            </Button>
          </form>
        </Card>

        {/* Email */}
        <Card className="p-5">
          <h3 className="font-semibold mb-1">Adres email</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Aktualny: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{email}</span>
          </p>
          <form action={emailAction} className="space-y-3">
            <input
              name="email"
              type="email"
              placeholder="Nowy adres email"
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            />
            {emailState?.error && <p className="text-xs text-red-400">{emailState.error}</p>}
            {emailState?.success && (
              <p className="text-xs text-green-400">✓ {emailState.message}</p>
            )}
            <Button type="submit" size="sm" disabled={emailPending}>
              {emailPending ? 'Wysyłanie...' : 'Zmień email'}
            </Button>
          </form>
        </Card>

        {/* Password */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Zmiana hasła</h3>
          <form action={passAction} className="space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Nowe hasło</label>
              <input
                name="password"
                type="password"
                placeholder="Minimum 6 znaków"
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Powtórz hasło</label>
              <input
                name="confirm_password"
                type="password"
                placeholder="Powtórz nowe hasło"
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
            {passState?.error && <p className="text-xs text-red-400">{passState.error}</p>}
            {passState?.success && <p className="text-xs text-green-400">✓ Hasło zostało zmienione</p>}
            <Button type="submit" size="sm" disabled={passPending}>
              {passPending ? 'Zmienianie...' : 'Zmień hasło'}
            </Button>
          </form>
        </Card>

      </div>
    </div>
  )
}
