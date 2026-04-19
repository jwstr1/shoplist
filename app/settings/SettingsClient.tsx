'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StoreSelector from '@/components/StoreSelector'
import BottomNav from '@/components/BottomNav'
import type { User } from '@supabase/supabase-js'

interface Store {
  id: string
  name: string
  chain: string
  suburb: string
  state: string
}

interface HouseholdSettings {
  household_id: string
  home_store_id: string | null
  home_postcode: string | null
  preferred_chain: string | null
  stores: Store | null
}

interface Props {
  user: User
  household: { id: string; name: string }
  settings: HouseholdSettings | null
  members: Array<{ user_id: string; role: string }>
  userRole: string
}

export default function SettingsClient({ user, household, settings, members, userRole }: Props) {
  const supabase = createClient()
  const [homeStore, setHomeStore] = useState<Store | null>(settings?.stores ?? null)
  const [postcode, setPostcode] = useState(settings?.home_postcode ?? '')
  const [inviteEmail, setInviteEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState('')
  const [showStoreSelector, setShowStoreSelector] = useState(false)

  const saveSettings = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('household_settings')
      .upsert({
        household_id: household.id,
        home_store_id: homeStore?.id ?? null,
        home_postcode: postcode || null,
      })
    setSaving(false)
    setMessage(error ? 'Failed to save.' : 'Saved!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    // In production: send invite via Supabase auth or custom email
    // For now, create a placeholder — full invite flow needs server action
    setMessage(`Invite sent to ${inviteEmail} (feature coming soon — share your household ID: ${household.id})`)
    setInviteEmail('')
    setInviting(false)
    setTimeout(() => setMessage(''), 6000)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>

        {message && (
          <div className="bg-green-900/50 border border-green-700 text-green-300 rounded-xl px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {/* Account */}
        <section className="bg-gray-900 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wide">Account</h2>
          <p className="text-sm text-gray-400">{user.email}</p>
          <button
            onClick={signOut}
            className="text-red-400 text-sm font-medium"
          >
            Sign out
          </button>
        </section>

        {/* Household */}
        <section className="bg-gray-900 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wide">Household</h2>
          <div>
            <p className="text-sm text-gray-400 mb-1">Name</p>
            <p className="font-medium">{household.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Members</p>
            <p className="font-medium">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>

          {userRole === 'owner' && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Invite family member</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="their@email.com"
                  className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {inviting ? '...' : 'Invite'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Store preferences */}
        <section className="bg-gray-900 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wide">Home Store</h2>

          <div>
            <p className="text-sm text-gray-400 mb-2">Postcode</p>
            <input
              type="text"
              inputMode="numeric"
              value={postcode}
              onChange={e => setPostcode(e.target.value)}
              placeholder="e.g. 3000"
              maxLength={4}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Preferred store</p>
            {homeStore ? (
              <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                <div>
                  <p className="font-medium text-sm">{homeStore.name}</p>
                  <p className="text-xs text-gray-400">{homeStore.suburb}, {homeStore.state}</p>
                </div>
                <button
                  onClick={() => setShowStoreSelector(true)}
                  className="text-green-400 text-sm"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowStoreSelector(true)}
                className="w-full bg-gray-800 rounded-lg px-3 py-3 text-sm text-gray-400 text-left"
              >
                Tap to select a store →
              </button>
            )}
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium"
          >
            {saving ? 'Saving...' : 'Save preferences'}
          </button>
        </section>
      </div>

      {showStoreSelector && (
        <StoreSelector
          currentPostcode={postcode}
          onSelect={store => {
            setHomeStore(store)
            setShowStoreSelector(false)
          }}
          onClose={() => setShowStoreSelector(false)}
        />
      )}

      <BottomNav active="settings" />
    </div>
  )
}
