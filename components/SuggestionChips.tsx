'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { categoriseItem, CATEGORY_ICONS } from '@/lib/categories'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'
import type { Category } from '@/lib/categories'

interface SuggestedItem {
  name: string
  confidence: number
}

interface Props {
  listId: string
  householdId: string
  userId: string
  currentItems: string[]
}

export default function SuggestionChips({ listId, householdId, userId, currentItems }: Props) {
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/suggestions?household=${householdId}&top=10`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(
            (data.suggestions ?? []).filter(
              (s: SuggestedItem) => !currentItems.includes(s.name.toLowerCase())
            )
          )
        }
      } catch {
        // silent
      }
    }
    load()
  }, [householdId]) // eslint-disable-line react-hooks/exhaustive-deps

  const visible = suggestions.filter((s) => !dismissed.has(s.name))
  if (visible.length === 0) return null

  async function addSuggestion(name: string) {
    if (adding.has(name)) return
    setAdding((prev) => new Set([...prev, name]))

    const category = categoriseItem(name)
    const canonical = name.toLowerCase()

    const { count } = await supabase
      .from('list_items')
      .select('id', { count: 'exact', head: true })
      .eq('list_id', listId)

    const { data: product } = await supabase
      .from('products')
      .upsert(
        { household_id: householdId, name, canonical_name: canonical, default_category: category },
        { onConflict: 'household_id,canonical_name', ignoreDuplicates: false }
      )
      .select()
      .single()

    const { error } = await supabase.from('list_items').insert({
      list_id: listId,
      product_id: product?.id ?? null,
      name,
      category,
      quantity: 1,
      added_by: userId,
      sort_order: (count ?? 0) + 1,
    })

    if (error) {
      toast.error('Failed to add item')
    } else {
      setDismissed((prev) => new Set([...prev, name]))
    }

    setAdding((prev) => {
      const next = new Set(prev)
      next.delete(name)
      return next
    })
  }

  return (
    <div className="border-b border-white/[0.06] bg-gray-950 py-3">
      {/* Header row */}
      <div className="flex items-center gap-1.5 px-4 mb-2.5">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Suggestions
        </span>
        <button
          onClick={() => setDismissed(new Set(suggestions.map((s) => s.name)))}
          className="ml-auto text-[10px] text-gray-700 hover:text-gray-500 font-medium"
        >
          Dismiss all
        </button>
      </div>

      {/* Chips scroll */}
      <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar pb-0.5">
        {visible.map((s) => {
          const cat = categoriseItem(s.name)
          const emoji = CATEGORY_ICONS[cat as Category] ?? '📦'
          const isAdding = adding.has(s.name)

          return (
            <button
              key={s.name}
              onClick={() => addSuggestion(s.name)}
              disabled={isAdding}
              className="flex-shrink-0 flex items-center gap-1.5 bg-gray-900 border border-white/10 text-white text-sm px-3 py-2 rounded-full font-medium active:scale-95 transition-all min-h-[36px] disabled:opacity-60 hover:border-emerald-500/40 hover:bg-emerald-500/5"
            >
              <span className="text-sm leading-none">{emoji}</span>
              <span className="text-sm text-gray-200">{s.name}</span>
              {s.confidence >= 0.8 && (
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded-full leading-none">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
