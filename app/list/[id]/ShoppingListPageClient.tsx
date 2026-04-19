'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CheckCircle2, ChevronLeft, Plus, Loader2, Store } from 'lucide-react'
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
  const [completing, setCompleting] = useState(false)
  const [showListPicker, setShowListPicker] = useState(false)
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
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 pt-12 pb-3 flex items-center gap-3">
          {/* Back / list switcher */}
          <button
            onClick={() => router.push('/list')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
            aria-label="Back to lists"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate leading-tight">
              {list.name}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {uncheckedCount === 0
                ? 'All done! 🎉'
                : `${uncheckedCount} item${uncheckedCount !== 1 ? 's' : ''} remaining`}
            </p>
          </div>

          {/* Store pill */}
          {list.stores && (
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0">
              <Store className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{list.stores.name}</span>
            </div>
          )}

          {/* Done button */}
          <button
            onClick={completeList}
            disabled={completing}
            className="flex items-center gap-1.5 bg-emerald-500 text-white text-sm font-semibold px-3 py-2 rounded-xl min-h-[40px] flex-shrink-0 active:scale-95 transition-transform disabled:opacity-60"
          >
            {completing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Done
              </>
            )}
          </button>
        </div>
      </header>

      {/* Suggestions strip */}
      <SuggestionChips
        listId={list.id}
        householdId={list.household_id}
        userId={userId}
        currentItems={initialItems.map((i) => i.name.toLowerCase())}
      />

      {/* Shopping list */}
      <main className="flex-1 pb-44 overflow-y-auto">
        <ShoppingList
          listId={list.id}
          initialItems={initialItems}
          userId={userId}
        />
      </main>

      {/* Add item input — sticky above bottom nav */}
      <AddItemBar
        listId={list.id}
        householdId={list.household_id}
        userId={userId}
      />

      <BottomNav active="list" />
    </div>
  )
}
