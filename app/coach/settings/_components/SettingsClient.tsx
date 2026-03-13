'use client'

import { useActionState, useRef, useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { updateCoachName, updateCoachEmail, updateCoachPassword, updateCoachAvatar } from '@/lib/actions/profile'

interface Props {
  email: string
  name: string
  plan: string
  avatar: string
}

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-mid)',
  color: 'var(--text-primary)',
}

const COLORS = [
  { key: 'orange', label: 'Pomarańczowy', tw: 'from-orange-500 to-orange-600' },
  { key: 'blue',   label: 'Niebieski',    tw: 'from-blue-500 to-blue-600' },
  { key: 'green',  label: 'Zielony',      tw: 'from-green-500 to-green-600' },
  { key: 'purple', label: 'Fioletowy',    tw: 'from-purple-500 to-purple-600' },
  { key: 'pink',   label: 'Różowy',       tw: 'from-pink-500 to-pink-600' },
  { key: 'red',    label: 'Czerwony',     tw: 'from-red-500 to-red-600' },
  { key: 'teal',   label: 'Morski',       tw: 'from-teal-500 to-teal-600' },
  { key: 'yellow', label: 'Żółty',        tw: 'from-yellow-500 to-yellow-600' },
]

function getCurrentColor(avatar: string): string {
  if (avatar.startsWith('color:')) return avatar.slice(6)
  if (avatar.startsWith('http')) return ''
  return 'orange'
}

function getGradient(colorKey: string): string {
  return COLORS.find(c => c.key === colorKey)?.tw ?? 'from-orange-500 to-orange-600'
}

function initials(n: string) {
  return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function SettingsClient({ email, name, plan, avatar }: Props) {
  const [nameState, nameAction, namePending] = useActionState(updateCoachName, null)
  const [emailState, emailAction, emailPending] = useActionState(updateCoachEmail, null)
  const [passState, passAction, passPending] = useActionState(updateCoachPassword, null)
  const [avatarState, avatarAction, avatarPending] = useActionState(updateCoachAvatar, null)

  const [selectedColor, setSelectedColor] = useState<string>(getCurrentColor(avatar))
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatar.startsWith('http') ? avatar : null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setSelectedColor('')
  }

  const avatarInitials = initials(name)

  return (
    <div>
      <CoachTopbar title="Ustawienia profilu" subtitle="Zarządzaj swoim kontem" />

      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* Avatar */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Zdjęcie profilowe</h3>
          <div className="flex items-start gap-6">

            {/* Current preview */}
            <div className="shrink-0">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getGradient(selectedColor || 'orange')} flex items-center justify-center font-bold text-2xl text-white`}>
                  {avatarInitials}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              {/* Color picker */}
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Kolor tła</div>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.key}
                      type="button"
                      title={c.label}
                      onClick={() => { setSelectedColor(c.key); setPreviewUrl(null); if (fileRef.current) fileRef.current.value = '' }}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.tw} cursor-pointer transition-transform hover:scale-110`}
                      style={{ outline: selectedColor === c.key && !previewUrl ? '3px solid white' : 'none', outlineOffset: '2px', boxShadow: selectedColor === c.key && !previewUrl ? '0 0 0 4px #FF5C1B' : 'none' }}
                    />
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Lub wgraj własne zdjęcie</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-file"
                />
                <label htmlFor="avatar-file"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}>
                  📷 Wybierz plik
                </label>
                {previewUrl && (
                  <button type="button" onClick={() => { setPreviewUrl(null); setSelectedColor('orange'); if (fileRef.current) fileRef.current.value = '' }}
                    className="ml-2 text-xs px-3 py-2 rounded-xl cursor-pointer"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
                    ✕ Usuń
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Save avatar form */}
          <form action={async (fd) => {
            if (previewUrl && fileRef.current?.files?.[0]) {
              fd.set('avatar_file', fileRef.current.files[0])
            }
            fd.set('avatar_type', selectedColor ? `color:${selectedColor}` : '')
            await avatarAction(fd)
          }} className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            {avatarState?.error && <p className="text-xs text-red-400 mb-2">{avatarState.error}</p>}
            {avatarState?.success && <p className="text-xs text-green-400 mb-2">✓ Zapisano awatar</p>}
            <Button type="submit" size="sm" disabled={avatarPending}>
              {avatarPending ? 'Zapisywanie...' : 'Zapisz awatar'}
            </Button>
          </form>
        </Card>

        {/* Plan info */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
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
