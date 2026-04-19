'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function AuthClient() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/list'
  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(redirectTo)
      router.refresh()
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    if (data.session) {
      await createDefaultHousehold(data.session.user.id, name)
      router.push('/list')
      router.refresh()
    } else {
      setSuccess('Account created! Check your email to confirm, then sign in.')
      setMode('signin')
      setLoading(false)
    }
  }

  async function createDefaultHousehold(userId: string, displayName: string) {
    try {
      const { data: household } = await supabase
        .from('households').insert({ name: `${displayName.split(' ')[0]}'s Household` }).select().single()
      if (household) {
        await supabase.from('household_members').insert({ household_id: household.id, user_id: userId, role: 'owner' })
        await supabase.from('user_profiles').upsert({ id: userId, display_name: displayName, default_household_id: household.id })
        await supabase.from('shopping_lists').insert({ household_id: household.id, name: 'Weekly Shop' })
      }
    } catch (err) { console.error('Failed to create household:', err) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-gray-950 to-gray-950 flex flex-col">
      {/* Top hero section */}
      <div className="flex flex-col items-center justify-center pt-16 pb-10 px-6 text-center">
        {/* App icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-900/50 mb-6">
          <span className="text-4xl">🛒</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">ShopList</h1>
        <p className="text-emerald-400/80 text-sm mt-2 font-medium">Smart family shopping</p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {['AI suggestions', 'Family sharing', 'Price tracking', 'Receipt scanner'].map(f => (
            <span key={f} className="text-xs bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/10">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <div className="flex-1 px-5">
        <div className="max-w-sm mx-auto bg-gray-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === 'signin'
                  ? 'text-white border-b-2 border-emerald-400 -mb-px'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === 'signup'
                  ? 'text-white border-b-2 border-emerald-400 -mb-px'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3">
                {success}
              </div>
            )}

            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                    autoComplete="name"
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  inputMode="email"
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
                style={{ minHeight: '52px' }}
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : mode === 'signin' ? '→  Sign In' : '→  Create Account'
                }
              </button>
            </form>

            {mode === 'signin' && (
              <p className="text-center text-xs text-gray-600 mt-4">
                New here?{' '}
                <button onClick={() => setMode('signup')} className="text-emerald-500 font-medium">
                  Create a free account
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mt-8 pb-8">
          <div className="text-center">
            <p className="text-white font-bold text-lg">Free</p>
            <p className="text-gray-500 text-xs">Forever</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-white font-bold text-lg">Live</p>
            <p className="text-gray-500 text-xs">Real-time sync</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-white font-bold text-lg">AI</p>
            <p className="text-gray-500 text-xs">Smart suggestions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
