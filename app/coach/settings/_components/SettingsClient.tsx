'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type React from 'react'
import { useSearchParams } from 'next/navigation'
import { updateSearchParams } from '@/lib/url-helpers'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { updateCoachAvatar, updateCoachEmail, updateCoachName, updateCoachPassword } from '@/lib/actions/profile'
import { PackagesClient } from '@/app/coach/packages/_components/PackagesClient'
import { getInitials, planLabel } from '@/lib/utils'
import { INPUT_STYLE } from '@/lib/styles'
import { SettingsArchiveTab } from './SettingsArchiveTab'

type Package = { id: string; name: string; description: string | null; price: number }
export type ArchivedAthlete = { id: string; name: string; email: string | null; package: string; archived_at: string | null; join_date: string }

type Tab = 'profile' | 'packages' | 'archive'
const VALID_TABS: Tab[] = ['profile', 'packages', 'archive']

interface Props {
  email: string
  name: string
  plan: string
  avatar: string
  packages: Package[]
  archivedAthletes: ArchivedAthlete[]
}

const AVATAR_EMOJIS_SHORT = [
  '🏃', '🏃‍♀️', '🏅', '🎽', '👟', '🦵',
  '🏋️', '💪', '🔥', '⚡', '🏆', '🥇',
]
const AVATAR_EMOJIS_FULL = [
  ...AVATAR_EMOJIS_SHORT,
  '⏱️', '❤️‍🔥', '🫁', '🏔️', '🌄', '🛤️',
  '🚀', '💨', '🎯', '🌟', '🦁', '🐆',
]

function currentEmoji(avatar: string): string {
  if (avatar.startsWith('emoji:')) return avatar.slice(6)
  return ''
}


export function SettingsClient({ email, name, plan, avatar, packages, archivedAthletes }: Props) {
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab') as Tab | null

  const [tab, setTab] = useState<Tab>(() => {
    if (urlTab && VALID_TABS.includes(urlTab)) return urlTab
    return 'profile'
  })

  // URL sync for tabs
  function switchTab(t: Tab) {
    setTab(t)
    updateSearchParams({ tab: t !== 'profile' ? t : undefined })
  }

  const [nameState, nameAction, namePending] = useActionState(updateCoachName, null)
  const [emailState, emailAction, emailPending] = useActionState(updateCoachEmail, null)
  const [passState, passAction, passPending] = useActionState(updateCoachPassword, null)
  const [avatarState, avatarAction, avatarPending] = useActionState(updateCoachAvatar, null)

  // Reset password form on success
  useEffect(() => {
    if (passState?.success) passFormRef.current?.reset()
  }, [passState])

  const [selectedEmoji, setSelectedEmoji] = useState<string>(currentEmoji(avatar))
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatar.startsWith('http') ? avatar : null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [showAllEmojis, setShowAllEmojis] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const passFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!previewUrl?.startsWith('blob:')) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setSelectedEmoji('')
    setRemoveAvatar(false)
  }

  function clearCustomAvatar() {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedEmoji('')
    setRemoveAvatar(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  const emojiList = showAllEmojis ? AVATAR_EMOJIS_FULL : AVATAR_EMOJIS_SHORT

  const previewAvatarEl = previewUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={previewUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
  ) : selectedEmoji ? (
    <div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      {selectedEmoji}
    </div>
  ) : (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-2xl text-white">
      {getInitials(name) || '?'}
    </div>
  )

  return (
    <div>
      <CoachTopbar title="Ustawienia" subtitle="Profil i pakiety" />

      <div className="p-6 max-w-4xl mx-auto">

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--bg-elevated)' }}>
          {([
            { id: 'profile' as Tab, label: '👤 Profil' },
            { id: 'packages' as Tab, label: '📦 Pakiety i cennik' },
            { id: 'archive' as Tab, label: '🗂 Archiwum zawodników' },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style={{
                background: tab === t.id ? 'var(--bg-card)' : 'transparent',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="space-y-6">

            {/* Name + Plan info merged */}
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Imię i nazwisko</h3>
              <form action={nameAction} className="space-y-3">
                <input name="name" defaultValue={name} placeholder="Twoje imię i nazwisko" required maxLength={200}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                <div className="flex items-center gap-3">
                  <Button type="submit" size="sm" disabled={namePending}>
                    {namePending ? 'Zapisywanie...' : 'Zapisz nazwę'}
                  </Button>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                    Plan {planLabel(plan)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{email}</span>
                </div>
                {nameState?.error && <p className="text-xs text-red-400">{nameState.error}</p>}
                {nameState?.success && <p className="text-xs text-green-400">✓ Zapisano</p>}
              </form>
            </Card>

            {/* Avatar */}
            <Card className="p-5">
              <h3 className="font-semibold mb-5">Zdjęcie profilowe</h3>
              <div className={`flex flex-col gap-6 lg:flex-row lg:items-start ${avatarPending ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="shrink-0 flex flex-col items-center gap-2">
                  {previewAvatarEl}
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Podgląd</div>
                </div>
                <div className="flex-1 space-y-5">
                  <div>
                    <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Wybierz grafikę</div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
                      {emojiList.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => {
                            if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
                            setSelectedEmoji(em)
                            setPreviewUrl(null)
                            setRemoveAvatar(false)
                            if (fileRef.current) fileRef.current.value = ''
                          }}
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
                    {!showAllEmojis && (
                      <button
                        type="button"
                        onClick={() => setShowAllEmojis(true)}
                        className="text-xs mt-2 cursor-pointer hover:opacity-80"
                        style={{ color: '#FF5C1B' }}
                      >
                        Pokaż więcej →
                      </button>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Lub wgraj własne zdjęcie</div>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange} className="hidden" id="avatar-file" />
                    <label htmlFor="avatar-file"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                      style={INPUT_STYLE}>
                      📷 Wybierz plik
                    </label>
                    {(previewUrl || selectedEmoji || avatar) && (
                      <button type="button" onClick={clearCustomAvatar}
                        className="ml-2 text-xs px-3 py-2 rounded-xl cursor-pointer"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                        ✕ Usuń awatar
                      </button>
                    )}
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>JPG, PNG lub WEBP, max 2 MB</p>
                  </div>
                </div>
              </div>
              <form action={async (fd) => {
                if (previewUrl && fileRef.current?.files?.[0]) fd.set('avatar_file', fileRef.current.files[0])
                fd.set('avatar_type', selectedEmoji ? `emoji:${selectedEmoji}` : '')
                fd.set('current_avatar', avatar)
                fd.set('remove_avatar', removeAvatar ? 'true' : 'false')
                await avatarAction(fd)
              }} className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                {avatarState?.error && <p className="text-xs text-red-400 mb-2">{avatarState.error}</p>}
                {avatarState?.success && <p className="text-xs text-green-400 mb-2">✓ Zapisano awatar</p>}
                <Button type="submit" size="sm" disabled={avatarPending}>
                  {avatarPending ? 'Zapisywanie...' : 'Zapisz awatar'}
                </Button>
              </form>
            </Card>

            {/* Security section */}
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: 'var(--text-muted)' }}>Bezpieczeństwo</h2>

              {/* Email */}
              <Card className="p-5">
                <h3 className="font-semibold mb-1">Adres email</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Aktualny: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{email}</span>
                </p>
                <form action={emailAction} className="space-y-3">
                  <input name="email" type="email" placeholder="Nowy adres email" required
                    className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Po zmianie otrzymasz link weryfikacyjny na nowy adres. Do czasu potwierdzenia logowanie odbywa się starym emailem.
                  </p>
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
                <form ref={passFormRef} action={passAction} className="space-y-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Nowe hasło</label>
                    <input name="password" type="password" placeholder="Minimum 6 znaków" required minLength={6}
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Powtórz hasło</label>
                    <input name="confirm_password" type="password" placeholder="Powtórz nowe hasło" required
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
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
        )}

        {/* Packages tab */}
        {tab === 'packages' && (
          <PackagesClient packages={packages} />
        )}

        {tab === 'archive' && (
          <SettingsArchiveTab archivedAthletes={archivedAthletes} />
        )}

      </div>
    </div>
  )
}
