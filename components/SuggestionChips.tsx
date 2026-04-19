'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { categoriseItem } from '@/lib/categories'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'

interface SuggestedItem {
  name: string
  confidence: number
}

interface Props {
  listId: string
  householdId: string
  userId: string
  currentItems: string[] // lowercase names already in list
}

export default function SuggestionChips({ listId, householdId, userId, currentItems }: Props) {
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    async function fetchSuggestions() {
      setLoading(true)
      try {
        const res = await fetch(`/api/suggestions?household=${householdId}&top=8`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(
            (data.suggestions ?? []).filter(
              (s: SuggestedItem) => !currentItems.includes(s.name.toLowerCase())
            )
          )
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [householdId]) // eslint-disable-line react-hooks/exhaustive-deps

  const visible = suggestions.filter((s) => !dismissed.has(s.name))

  if (visible.length === 0) return null

  async function addSuggestion(name: string) {
    const category = categoriseItem(name)

    const { count } = await supabase
      .from('list_items')
      .select('id', { count: 'exact', head: true })
      .eq('list_id', listId)

    const canonical = name.toLowerCase()
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
      toast.success(`${name} added`)
    }
  }

  return (
    <div className="px-4 py-2 bg-white border-b border-gray-100">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-gray-500">You might need:</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scroll-container">
        {visible.map((s) => (
          <button
            key={s.name}
            onClick={() => addSuggestion(s.name)}
            className="flex-shrink-0 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-1.5 rounded-full font-medium hover:bg-amber-100 active:scale-95 transition-transform min-h-[36px]"
          >
            + {s.name}
          </button>
        ))}
        <button
          onClick={() => setDismissed(new Set(suggestions.map((s) => s.name)))}
          className="flex-shrink-0 text-xs text-gray-400 px-2 py-1.5 min-h-[36px]"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
