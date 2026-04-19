'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ShoppingCart, Loader2 } from 'lucide-react'

type Mode = 'signin' | 'signup' | 'magic'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/list'

  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Welcome back!')
      router.push(redirectTo)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
    } else if (data.session) {
      // Auto-confirmed
      toast.success('Account created! Setting up your household...')
      await createDefaultHousehold(data.session.user.id, name)
      router.push('/list')
      router.refresh()
    } else {
      toast.success('Check your email to confirm your account!')
      setMode('signin')
    }
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      toast.error(error.message)
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  async function createDefaultHousehold(userId: string, displayName: string) {
    try {
      const { data: household } = await supabase
        .from('households')
        .insert({ name: `${displayName}'s Household` })
        .select()
        .single()

      if (household) {
        await supabase.from('household_members').insert({
          household_id: household.id,
          user_id: userId,
          role: 'owner',
        })
        await supabase.from('user_profiles').upsert({
          id: userId,
          display_name: displayName,
          default_household_id: household.id,
        })
        // Create default shopping list
        await supabase.from('shopping_lists').insert({
          household_id: household.id,
          name: 'Weekly Shop',
        })
      }
    } catch (err) {
      console.error('Failed to create household:', err)
    }
  }

  if (magicSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-4">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <button
            onClick={() => { setMagicSent(false); setMode('signin') }}
            className="text-brand-600 text-sm font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-4">
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <ShoppingCart className="text-white w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">ShopList</h1>
        <p className="text-gray-500 text-sm mt-1">Family shopping, simplified</p>
      </div>

      {/* Card */}
      <div className="flex-1 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-sm mx-auto">
          {/* Mode tabs */}
          <div className="flex border border-gray-200 rounded-xl p-1 mb-6">
            {(['signin', 'signup', 'magic'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'signin' ? 'Sign In' : m === 'signup' ? 'Sign Up' : '✉️ Link'}
              </button>
            ))}
          </div>

          <form onSubmit={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleMagicLink}>
            {mode === 'signup' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            {mode !== 'magic' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 8 characters' : 'Your password'}
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'signin' ? (
                'Sign In'
              ) : mode === 'signup' ? (
                'Create Account'
              ) : (
                'Send Magic Link'
              )}
            </button>
          </form>

          {mode === 'magic' && (
            <p className="text-center text-xs text-gray-400 mt-4">
              We&apos;ll email you a link — no password needed
            </p>
          )}
        </div>
      </div>

      <div className="p-8 text-center">
        <p className="text-xs text-gray-400">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}
