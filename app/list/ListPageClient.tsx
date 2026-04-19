'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, ShoppingCart, Loader2, ChevronRight, X } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { formatDistanceToNow } from 'date-fns'
import type { ShoppingListSummary } from './page'

interface Props {
  householdId: string | null
  userId: string
  displayName: string | null
  lists: ShoppingListSummary[]
}

export default function ListPageClient({ householdId, userId, displayName, lists }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [listName, setListName] = useState('Weekly Shop')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function createHouseholdAndList() {
    // Create household → member → profile → list
    const { data: household, error: hErr } = await supabase
      .from('households')
      .insert({ name: `${displayName ?? 'My'} Household` })
      .select()
      .single()

    if (hErr || !household) throw new Error('Failed to create household')

    await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: userId,
      role: 'owner',
    })

    await supabase.from('user_profiles').upsert({
      id: userId,
      default_household_id: household.id,
    })

    const { data: list, error: lErr } = await supabase
      .from('shopping_lists')
      .insert({ household_id: household.id, name: listName.trim() })
      .select()
      .single()

    if (lErr || !list) throw new Error('Failed to create list')
    return list
  }

  async function handleCreate() {
    const name = listName.trim()
    if (!name) return

    setCreating(true)
    setError(null)

    try {
      if (!householdId) {
        const list = await createHouseholdAndList()
        router.push(`/list/${list.id}`)
        return
      }

      const { data: list, error: lErr } = await supabase
        .from('shopping_lists')
        .insert({ household_id: householdId, name })
        .select()
        .single()

      if (lErr || !list) throw new Error('Failed to create list')
      router.push(`/list/${list.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Lists</h1>
          {lists.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {lists.length} active {lists.length === 1 ? 'list' : 'lists'}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-32">
        {lists.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-24 h-24 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 border border-white/10 shadow-lg">
              <span className="text-4xl">🛒</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No lists yet</h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-8">
              Create your first shopping list and start adding items
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-emerald-500 text-white font-semibold px-6 py-3 rounded-2xl text-sm min-h-[44px] active:scale-95 transition-transform shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-4 h-4" />
              Create your first list
            </button>
          </div>
        ) : (
          /* List cards */
          <div className="space-y-3 pt-2">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => router.push(`/list/${list.id}`)}
                className="w-full bg-gray-900 rounded-2xl border border-white/10 p-4 flex items-center gap-4 active:scale-[0.98] transition-transform shadow-sm text-left"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base truncate">{list.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-sm">
                      {list.itemCount} item{list.itemCount !== 1 ? 's' : ''} left
                    </span>
                    {list.stores && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="text-emerald-600 text-xs font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {list.stores.name}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs mt-1">
                    {formatDistanceToNow(new Date(list.created_at), { addSuffix: true })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating + button */}
      {lists.length > 0 && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-90 transition-transform z-40"
          aria-label="New list"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      <BottomNav active="list" />

      {/* New list modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !creating && setShowModal(false)}
          />
          {/* Sheet */}
          <div className="relative bg-gray-900 rounded-t-3xl border-t border-white/10 px-5 pt-5 pb-10 animate-slide-up">
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">New List</h2>
              <button
                onClick={() => !creating && setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  List Name
                </label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Weekly Shop"
                  autoFocus
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-base"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleCreate}
                disabled={creating || !listName.trim()}
                className="w-full bg-emerald-500 text-white font-semibold py-3.5 rounded-2xl text-base min-h-[52px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform shadow-lg shadow-emerald-500/20"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create List
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
