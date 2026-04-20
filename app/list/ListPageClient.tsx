'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ShoppingCart, ChevronRight, X } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

interface ShoppingList {
  id: string
  name: string
  created_at: string
  store_id: string | null
  item_count?: number
}

interface Props {
  householdId: string | null
  userId: string
  displayName: string | null
  lists: ShoppingList[]
}

export default function ListPageClient({ householdId, userId, displayName, lists }: Props) {
  const [creating, setCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [listName, setListName] = useState('Weekly Shop')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCreate() {
    if (!listName.trim()) return
    setCreating(true)
    setError('')

    try {
      const firstName = displayName?.split(' ')[0] || 'My'

      if (!householdId) {
        // Create household + list via server API (bypasses RLS)
        const res = await fetch('/api/household', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            householdName: `${firstName}'s Household`,
            listName: listName.trim(),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create household')
        router.push(`/list/${data.listId}`)
        router.refresh()
      } else {
        // Add list to existing household via server API
        const res = await fetch('/api/household', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ householdId, listName: listName.trim() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create list')
        router.push(`/list/${data.listId}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <p className="text-gray-500 text-sm font-medium">
          {displayName ? `Hey ${displayName.split(' ')[0]} 👋` : 'Hello 👋'}
        </p>
        <h1 className="text-2xl font-bold mt-1">Your Lists</h1>
      </div>

      <div className="px-5">
        {lists.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-900 border border-white/10 flex items-center justify-center mb-5 shadow-xl">
              <ShoppingCart className="w-9 h-9 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No lists yet</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-xs">
              Create your first shopping list and start adding items
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create your first list
            </button>
          </div>
        ) : (
          /* List cards */
          <div className="space-y-3">
            {lists.map(list => (
              <button
                key={list.id}
                onClick={() => router.push(`/list/${list.id}`)}
                className="w-full bg-gray-900 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all hover:border-white/20"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{list.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {list.item_count
                      ? `${list.item_count} item${list.item_count !== 1 ? 's' : ''}`
                      : 'Empty'
                    } · {new Date(list.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating add button (when lists exist) */}
      {lists.length > 0 && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-xl shadow-emerald-900/40 active:scale-95 transition-all z-40"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Create list modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowModal(false)}>
          <div
            className="w-full bg-gray-900 border-t border-white/10 rounded-t-3xl p-6 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">New List</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <input
              type="text"
              value={listName}
              onChange={e => setListName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="List name"
              autoFocus
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 mb-4"
            />

            <button
              onClick={handleCreate}
              disabled={creating || !listName.trim()}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl font-bold text-sm active:scale-95 transition-all"
            >
              {creating ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </div>
      )}

      <BottomNav active="list" />
    </div>
  )
}
