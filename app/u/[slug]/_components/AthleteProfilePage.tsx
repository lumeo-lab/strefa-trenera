'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AthleteSession } from '@/lib/athlete-auth'
import type { AthleteProfileData } from '@/lib/athlete-data'
import { updateAthleteProfile } from '@/lib/actions/athlete-profile'
import { logoutAthlete } from '@/lib/actions/auth'
import { useTheme } from '@/lib/theme'
import { INPUT_STYLE } from '@/lib/styles'
import { AthleteBottomNav } from './AthleteBottomNav'
import { getInitials } from '@/lib/utils'
import { GRADIENT_MAP } from '@/lib/constants'

interface Props {
  athlete: AthleteSession
  profile: AthleteProfileData
}

function ProfileAvatar({ avatar, name }: { avatar: string; name: string }) {
  if (avatar.startsWith('http')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} className="w-20 h-20 rounded-full object-cover" />
  }
  if (avatar.startsWith('emoji:')) {
    return (
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
        {avatar.slice(6)}
      </div>
    )
  }
  const color = avatar.startsWith('color:') ? avatar.slice(6) : 'orange'
  const gradient = GRADIENT_MAP[color] ?? GRADIENT_MAP.orange
  return (
    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl font-bold text-white`}>
      {getInitials(name)}
    </div>
  )
}

function MenuLink({ href, icon, label, slug }: { href: string; icon: string; label: string; slug: string }) {
  return (
    <Link href={`/u/${slug}/${href}`}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors"
      style={{ color: 'var(--text-primary)' }}>
      <span className="text-base w-6 text-center">{icon}</span>
      <span className="text-sm font-medium flex-1">{label}</span>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>→</span>
    </Link>
  )
}

export function AthleteProfilePage({ athlete, profile }: Props) {
  const router = useRouter()
  const { theme, toggle } = useTheme()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [age, setAge] = useState(profile.age?.toString() ?? '')
  const [height, setHeight] = useState(profile.height?.toString() ?? '')
  const [weight, setWeight] = useState(profile.weight?.toString() ?? '')
  const [goal, setGoal] = useState(profile.goal ?? '')
  const [avatarPicker, setAvatarPicker] = useState(false)

  function cancelEdit() {
    setName(profile.name)
    setEmail(profile.email ?? '')
    setPhone(profile.phone ?? '')
    setCity(profile.city ?? '')
    setAge(profile.age?.toString() ?? '')
    setHeight(profile.height?.toString() ?? '')
    setWeight(profile.weight?.toString() ?? '')
    setGoal(profile.goal ?? '')
    setEditing(false)
    setSaveMsg(null)
  }

  async function handleAvatarChange(newAvatar: string) {
    setSaving(true)
    const result = await updateAthleteProfile(athlete.slug, {
      name: profile.name,
      avatar: newAvatar,
    })
    setSaving(false)
    if ('success' in result) {
      setAvatarPicker(false)
      router.refresh()
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    const result = await updateAthleteProfile(athlete.slug, {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      city: city.trim() || null,
      age: age ? parseInt(age) : null,
      height: height ? parseInt(height) : null,
      weight: weight ? parseFloat(weight) : null,
      goal: goal.trim(),
    })
    setSaving(false)
    if ('error' in result) {
      setSaveMsg({ type: 'error', text: result.error })
    } else {
      setSaveMsg({ type: 'success', text: 'Zapisano' })
      setEditing(false)
      router.refresh()
    }
  }

  const labelStyle = { color: 'var(--text-muted)' } as const

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => setAvatarPicker(v => !v)} className="relative cursor-pointer shrink-0" style={{ background: 'none', border: 'none' }}>
            <ProfileAvatar avatar={profile.avatar} name={profile.name} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>✏️</div>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold truncate">{profile.name}</div>
            {profile.goal && (
              <div className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{profile.goal}</div>
            )}
          </div>
        </div>

        {/* Avatar picker */}
        {avatarPicker && (
          <div className="mt-4 p-3 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Wybierz kolor avatara</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(GRADIENT_MAP).map(([colorName, gradient]) => (
                <button key={colorName} onClick={() => handleAvatarChange(`color:${colorName}`)}
                  disabled={saving}
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-50`}
                  style={{ border: profile.avatar === `color:${colorName}` ? '3px solid #FF5C1B' : '2px solid transparent' }}>
                  {getInitials(profile.name)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Success / Error message */}
        {saveMsg && (
          <div className="px-4 py-2.5 rounded-xl text-sm" style={{
            background: saveMsg.type === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${saveMsg.type === 'success' ? 'rgba(46,204,113,0.3)' : 'rgba(248,113,113,0.2)'}`,
            color: saveMsg.type === 'success' ? '#2ECC71' : '#f87171',
          }}>
            {saveMsg.text}
          </div>
        )}

        {/* Personal data */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold">Dane osobowe</span>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ background: 'var(--bg-hover)', color: '#FF5C1B' }}>
                Edytuj
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={cancelEdit}
                  className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                  Anuluj
                </button>
                <button onClick={handleSave} disabled={saving || !name.trim()}
                  className="text-xs px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
                  style={{ background: '#FF5C1B', color: '#fff' }}>
                  {saving ? 'Zapisuję...' : 'Zapisz'}
                </button>
              </div>
            )}
          </div>

          <div className="px-4 py-3 space-y-3">
            {editing ? (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1" style={labelStyle}>Imię i nazwisko</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={labelStyle}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={labelStyle}>Telefon</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={labelStyle}>Wiek</label>
                    <input type="number" value={age} onChange={e => setAge(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={labelStyle}>Wzrost (cm)</label>
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={labelStyle}>Waga (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} step="0.1"
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={labelStyle}>Miasto</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={labelStyle}>Cel</label>
                  <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2}
                    className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" style={INPUT_STYLE} />
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <ProfileField label="Imię i nazwisko" value={profile.name} />
                <ProfileField label="Email" value={profile.email} />
                <ProfileField label="Telefon" value={profile.phone} />
                <div className="grid grid-cols-3 gap-3">
                  <ProfileField label="Wiek" value={profile.age ? `${profile.age} lat` : null} />
                  <ProfileField label="Wzrost" value={profile.height ? `${profile.height} cm` : null} />
                  <ProfileField label="Waga" value={profile.weight ? `${profile.weight} kg` : null} />
                </div>
                <ProfileField label="Miasto" value={profile.city} />
                <ProfileField label="Cel" value={profile.goal || null} />
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <MenuLink href="races" icon="🏆" label="Zawody" slug={athlete.slug} />
          <div className="mx-4" style={{ borderTop: '1px solid var(--border)' }} />
          <MenuLink href="injuries" icon="🩹" label="Kontuzje" slug={athlete.slug} />
          <div className="mx-4" style={{ borderTop: '1px solid var(--border)' }} />
          <MenuLink href="billing" icon="💳" label="Rozliczenia" slug={athlete.slug} />
        </div>

        {/* Appearance */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <button onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}>
            <span className="text-base w-6 text-center">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="text-sm font-medium flex-1">{theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}</span>
          </button>
        </div>

        {/* Logout */}
        <form action={logoutAthlete.bind(null, athlete.slug)}>
          <button type="submit"
            className="w-full py-3 rounded-2xl text-sm cursor-pointer"
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Wyloguj się
          </button>
        </form>
      </div>

      <AthleteBottomNav slug={athlete.slug} athleteName={athlete.name} athleteAvatar={athlete.avatar} />
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-medium mt-0.5" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {value || '—'}
      </div>
    </div>
  )
}
