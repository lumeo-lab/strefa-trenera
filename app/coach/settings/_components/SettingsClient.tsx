'use client'

import { useActionState, useRef, useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { updateCoachName, updateCoachEmail, updateCoachPassword, updateCoachAvatar } from '@/lib/actions/profile'
import { PackagesClient } from '@/app/coach/packages/_components/PackagesClient'

type Package = { id: string; name: string; description: string | null; price: number }

interface Props {
  email: string
  name: string
  plan: string
  avatar: string
  packages: Package[]
}

import { INPUT_STYLE } from '@/lib/styles'

const inputStyle = INPUT_STYLE

const AVATAR_EMOJIS = [
  '🏃', '🚴', '🏊', '🏋️', '⛹️', '🤸',
  '🧘', '🏄', '🏇', '🤺', '🥊', '⛷️',
  '🎯', '🏆', '🔥', '💪', '⚡', '🦁',
  '🌟', '🎽', '🧗', '🚣', '🏌️', '⚽',
]

function initials(n: string) {
  return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function currentEmoji(avatar: string): string {
  if (avatar.startsWith('emoji:')) return avatar.slice(6)
  return ''
}

export function SettingsClient({ email, name, plan, avatar, packages }: Props) {
  const [tab, setTab] = useState<'profile' | 'packages'>('profile')

  const [nameState, nameAction, namePending] = useActionState(updateCoachName, null)
  const [emailState, emailAction, emailPending] = useActionState(updateCoachEmail, null)
  const [passState, passAction, passPending] = useActionState(updateCoachPassword, null)
  const [avatarState, avatarAction, avatarPending] = useActionState(updateCoachAvatar, null)

  const [selectedEmoji, setSelectedEmoji] = useState<string>(currentEmoji(avatar))
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatar.startsWith('http') ? avatar : null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setSelectedEmoji('')
  }

  function PreviewAvatar() {
    if (previewUrl) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={previewUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
    }
    if (selectedEmoji) {
      return (
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          {selectedEmoji}
        </div>
      )
    }
    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-2xl text-white">
        {initials(name)}
      </div>
    )
  }

  return (
    <div>
      <CoachTopbar title="Ustawienia" subtitle="Profil i pakiety" />

      <div className="p-6 max-w-2xl mx-auto">

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--bg-elevated)' }}>
          {(['profile', 'packages'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style={{
                background: tab === t ? 'var(--bg-card)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {t === 'profile' ? '👤 Profil' : '📦 Pakiety i cennik'}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="space-y-6">

            {/* Avatar */}
            <Card className="p-5">
              <h3 className="font-semibold mb-5">Zdjęcie profilowe</h3>
              <div className="flex items-start gap-6">
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <PreviewAvatar />
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Podgląd</div>
                </div>
                <div className="flex-1 space-y-5">
                  <div>
                    <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Wybierz grafikę</div>
                    <div className="grid grid-cols-8 gap-1.5">
                      {AVATAR_EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => { setSelectedEmoji(em); setPreviewUrl(null); if (fileRef.current) fileRef.current.value = '' }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all hover:scale-110"
                          style={{
                            background: selectedEmoji === em && !previewUrl ? 'rgba(255,92,27,0.15)' : 'var(--bg-elevated)',
                            border: selectedEmoji === em && !previewUrl ? '2px solid #FF5C1B' : '1px solid var(--border)',
                          }}
                          title={em}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Lub wgraj własne zdjęcie</div>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange} className="hidden" id="avatar-file" />
                    <label htmlFor="avatar-file"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}>
                      📷 Wybierz plik
                    </label>
                    {previewUrl && (
                      <button type="button" onClick={() => { setPreviewUrl(null); if (fileRef.current) fileRef.current.value = '' }}
                        className="ml-2 text-xs px-3 py-2 rounded-xl cursor-pointer"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                        ✕ Usuń
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <form action={async (fd) => {
                if (previewUrl && fileRef.current?.files?.[0]) fd.set('avatar_file', fileRef.current.files[0])
                fd.set('avatar_type', selectedEmoji ? `emoji:${selectedEmoji}` : '')
                await avatarAction(fd)
              }} className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
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
                <input name="name" defaultValue={name} placeholder="Twoje imię i nazwisko" required
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
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
                <input name="email" type="email" placeholder="Nowy adres email" required
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
                {emailState?.error && <p className="text-xs text-red-400">{emailState.error}</p>}
                {emailState?.success && <p className="text-xs text-green-400">✓ {emailState.message}</p>}
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
                  <input name="password" type="password" placeholder="Minimum 6 znaków" required minLength={6}
                    className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Powtórz hasło</label>
                  <input name="confirm_password" type="password" placeholder="Powtórz nowe hasło" required
                    className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
                </div>
                {passState?.error && <p className="text-xs text-red-400">{passState.error}</p>}
                {passState?.success && <p className="text-xs text-green-400">✓ Hasło zostało zmienione</p>}
                <Button type="submit" size="sm" disabled={passPending}>
                  {passPending ? 'Zmienianie...' : 'Zmień hasło'}
                </Button>
              </form>
            </Card>

          </div>
        )}

        {/* Packages tab */}
        {tab === 'packages' && (
          <PackagesClient packages={packages} />
        )}

      </div>
    </div>
  )
}
