'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CheckCircle2, MoreHorizontal, Plus } from 'lucide-react'
import ShoppingList from '@/components/ShoppingList'
import AddItemBar from '@/components/AddItemBar'
import SuggestionChips from '@/components/SuggestionChips'
import BottomNav from '@/components/BottomNav'
import type { ListItem, ShoppingList as ShoppingListType } from '@/lib/types/database'

interface Props {
  list: ShoppingListType & { stores?: { id: string; name: string; chain: string } | null }
  initialItems: ListItem[]
  userId: string
  allLists: { id: string; name: string; created_at: string }[]
}

export default function ShoppingListPageClient({ list, initialItems, userId, allLists }: Props) {
  const [showListSwitcher, setShowListSwitcher] = useState(false)
  const [completing, setCompleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const uncheckedCount = initialItems.filter((i) => !i.checked).length

  async function completeList() {
    if (!confirm('Mark this list as completed? It will be archived.')) return
    setCompleting(true)

    const { error } = await supabase
      .from('shopping_lists')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', list.id)

    if (error) {
      toast.error('Failed to complete list')
      setCompleting(false)
    } else {
      toast.success('Shopping done! 🎉')
      router.push('/list')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowListSwitcher(!showListSwitcher)}
                className="flex items-center gap-1 min-h-[44px]"
              >
                <h1 className="text-lg font-bold text-gray-900 truncate max-w-[180px]">
                  {list.name}
                </h1>
                <MoreHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} remaining
              {list.stores && (
                <span className="ml-1">· {list.stores.name}</span>
              )}
            </p>
          </div>

          <button
            onClick={completeList}
            disabled={completing}
            className="flex items-center gap-1 bg-brand-500 text-white px-3 py-2 rounded-xl text-sm font-medium min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Done
          </button>
        </div>

        {/* List switcher dropdown */}
        {showListSwitcher && (
          <div className="border-t border-gray-100 bg-white px-4 py-2">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Your Lists</p>
            {allLists.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setShowListSwitcher(false)
                  router.push(`/list/${l.id}`)
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${
                  l.id === list.id
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {l.name}
              </button>
            ))}
            <button
              onClick={() => {
                setShowListSwitcher(false)
                router.push('/list')
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-brand-600 font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              New list
            </button>
          </div>
        )}
      </header>

      {/* Suggestions */}
      <SuggestionChips
        listId={list.id}
        householdId={list.household_id}
        userId={userId}
        currentItems={initialItems.map((i) => i.name.toLowerCase())}
      />

      {/* Main list */}
      <main className="flex-1 pb-40">
        <ShoppingList
          listId={list.id}
          initialItems={initialItems}
          userId={userId}
        />
      </main>

      {/* Add item bar (sticky bottom) */}
      <AddItemBar
        listId={list.id}
        householdId={list.household_id}
        userId={userId}
      />

      <BottomNav active="list" />
    </div>
  )
}
