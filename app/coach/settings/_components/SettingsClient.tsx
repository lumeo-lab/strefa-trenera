'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { restoreAthlete } from '@/lib/actions/athletes'
import { updateCoachAvatar, updateCoachEmail, updateCoachName, updateCoachPassword } from '@/lib/actions/profile'
import { PackagesClient } from '@/app/coach/packages/_components/PackagesClient'
import { formatDate, getInitials } from '@/lib/utils'
import { INPUT_STYLE } from '@/lib/styles'

type Package = { id: string; name: string; description: string | null; price: number }
type ArchivedAthlete = { id: string; name: string; email: string | null; package: string; archived_at: string | null; join_date: string }

interface Props {
  email: string
  name: string
  plan: string
  avatar: string
  packages: Package[]
  archivedAthletes: ArchivedAthlete[]
}

const inputStyle = INPUT_STYLE

const AVATAR_EMOJIS = [
  '🏃', '🏃‍♀️', '🏅', '🎽', '👟', '🦵',
  '🏋️', '💪', '🔥', '⚡', '🏆', '🥇',
  '⏱️', '❤️‍🔥', '🫁', '🏔️', '🌄', '🛤️',
  '🚀', '💨', '🎯', '🌟', '🦁', '🐆',
]

function currentEmoji(avatar: string): string {
  if (avatar.startsWith('emoji:')) return avatar.slice(6)
  return ''
}

function planLabel(plan: string) {
  const map: Record<string, string> = { starter: 'Starter', pro: 'Pro', standard: 'Standard' }
  return map[plan] ?? plan
}

export function SettingsClient({ email, name, plan, avatar, packages, archivedAthletes }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'profile' | 'packages' | 'archive'>('profile')
  const [archiveQuery, setArchiveQuery] = useState('')
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [archiveMessage, setArchiveMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

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
          {(['profile', 'packages', 'archive'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style={{
                background: tab === t ? 'var(--bg-card)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {t === 'profile' ? '👤 Profil' : t === 'packages' ? '📦 Pakiety i cennik' : '🗂 Archiwum zawodników'}
            </button>
          ))}
        </div>

        {archiveMessage && (
          <div
            className="mb-6 rounded-2xl px-4 py-3 text-sm"
            style={{
              background: archiveMessage.tone === 'success' ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)',
              border: archiveMessage.tone === 'success' ? '1px solid rgba(46,204,113,0.24)' : '1px solid rgba(231,76,60,0.24)',
              color: archiveMessage.tone === 'success' ? '#2ECC71' : '#E74C3C',
            }}
          >
            {archiveMessage.text}
          </div>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="space-y-6">

            {/* Avatar */}
            <Card className="p-5">
              <h3 className="font-semibold mb-5">Zdjęcie profilowe</h3>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="shrink-0 flex flex-col items-center gap-2">
                  {previewAvatarEl}
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Podgląd</div>
                </div>
                <div className="flex-1 space-y-5">
                  <div>
                    <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Wybierz grafikę</div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
                      {AVATAR_EMOJIS.map(em => (
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

            {/* Plan info */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{name || '—'}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{email}</div>
                  <div className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
                    style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                    Plan {planLabel(plan)}
                  </div>
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Aby zmienić plan, skontaktuj się z nami.
              </p>
            </Card>

            {/* Name */}
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Imię i nazwisko</h3>
              <form action={nameAction} className="space-y-3">
                <input name="name" defaultValue={name} placeholder="Twoje imię i nazwisko" required maxLength={200}
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
              <form ref={passFormRef} action={passAction} className="space-y-3">
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

        {tab === 'archive' && (() => {
          const filteredArchived = archivedAthletes.filter((athlete) => {
            const q = archiveQuery.trim().toLowerCase()
            if (!q) return true
            return athlete.name.toLowerCase().includes(q) || (athlete.email ?? '').toLowerCase().includes(q) || athlete.package.toLowerCase().includes(q)
          })

          return (
            <Card className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-5">
                <div>
                  <h3 className="font-semibold">Archiwum zawodników</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Tutaj trafiają zawodnicy przeniesieni z aktywnej bazy. Nie są już widoczni w bieżącej pracy trenera.
                  </p>
                </div>
                <input
                  value={archiveQuery}
                  onChange={(e) => setArchiveQuery(e.target.value)}
                  placeholder="Szukaj w archiwum..."
                  className="w-full sm:w-72 px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>

              {filteredArchived.length === 0 ? (
                <div className="rounded-2xl px-4 py-10 text-sm text-center" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {archivedAthletes.length === 0 ? 'Archiwum jest puste.' : 'Brak zawodników pasujących do wyszukiwania.'}
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                        <th className="text-left px-4 py-3" style={{ color: 'var(--text-muted)' }}>Zawodnik</th>
                        <th className="text-left px-4 py-3" style={{ color: 'var(--text-muted)' }}>Pakiet</th>
                        <th className="text-left px-4 py-3" style={{ color: 'var(--text-muted)' }}>Dołączył</th>
                        <th className="text-left px-4 py-3" style={{ color: 'var(--text-muted)' }}>Zarchiwizowano</th>
                        <th className="text-right px-4 py-3" style={{ color: 'var(--text-muted)' }}>Akcja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArchived.map((athlete, index) => (
                        <tr key={athlete.id} style={{ borderBottom: index < filteredArchived.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{athlete.name}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{athlete.email || 'Brak emaila'}</div>
                          </td>
                          <td className="px-4 py-3">{athlete.package || '—'}</td>
                          <td className="px-4 py-3">{athlete.join_date ? formatDate(athlete.join_date, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                          <td className="px-4 py-3">{athlete.archived_at ? formatDate(athlete.archived_at, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/coach/athletes/${athlete.id}`}
                                className="px-3 py-2 rounded-xl text-sm"
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                              >
                                Profil
                              </Link>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={restoringId === athlete.id}
                                onClick={async () => {
                                  setRestoringId(athlete.id)
                                  setArchiveMessage(null)
                                  try {
                                    const result = await restoreAthlete(athlete.id)
                                    if (result && 'error' in result) {
                                      setArchiveMessage({ tone: 'error', text: result.error ?? 'Nie udało się przywrócić zawodnika.' })
                                      return
                                    }
                                    setArchiveMessage({ tone: 'success', text: `Przywrócono zawodnika: ${athlete.name}.` })
                                    router.refresh()
                                  } finally {
                                    setRestoringId(null)
                                  }
                                }}
                              >
                                {restoringId === athlete.id ? 'Przywracanie...' : 'Przywróć'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )
        })()}

      </div>
    </div>
  )
}
