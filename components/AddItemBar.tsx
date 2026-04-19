'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { categoriseItem } from '@/lib/categories'
import toast from 'react-hot-toast'
import { Plus, Loader2, X } from 'lucide-react'

interface Props {
  listId: string
  householdId: string
  userId: string
}

interface Suggestion {
  name: string
  confidence: number
}

export default function AddItemBar({ listId, householdId, userId }: Props) {
  const [input, setInput] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [adding, setAdding] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const debounceRef = useRef<NodeJS.Timeout>()

  // Fetch autocomplete suggestions as user types
  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/suggestions?q=${encodeURIComponent(input)}&household=${householdId}`
        )
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.suggestions ?? [])
          setShowSuggestions(data.suggestions?.length > 0)
        }
      } catch {
        // ignore
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [input, householdId])

  async function addItem(name: string, qty = 1) {
    const trimmed = name.trim()
    if (!trimmed) return

    setAdding(true)
    setShowSuggestions(false)

    // Look up canonical product for category
    const category = categoriseItem(trimmed)

    // Upsert product
    const canonical = trimmed.toLowerCase()
    const { data: product } = await supabase
      .from('products')
      .upsert(
        { household_id: householdId, name: trimmed, canonical_name: canonical, default_category: category },
        { onConflict: 'household_id,canonical_name', ignoreDuplicates: false }
      )
      .select()
      .single()

    // Get count for sort_order
    const { count } = await supabase
      .from('list_items')
      .select('id', { count: 'exact', head: true })
      .eq('list_id', listId)

    const { error } = await supabase.from('list_items').insert({
      list_id: listId,
      product_id: product?.id ?? null,
      name: trimmed,
      category,
      quantity: qty,
      added_by: userId,
      sort_order: (count ?? 0) + 1,
    })

    if (error) {
      toast.error('Failed to add item')
    } else {
      setInput('')
      setQuantity('1')
      inputRef.current?.focus()
    }
    setAdding(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addItem(input, parseFloat(quantity) || 1)
  }

  function pickSuggestion(name: string) {
    addItem(name, 1)
  }

  return (
    <div
      className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] inset-x-0 bg-white border-t border-gray-200 shadow-lg z-30"
    >
      {/* Suggestion dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="border-b border-gray-100 max-h-48 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.name}
              onClick={() => pickSuggestion(s.name)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{s.name}</span>
              <span className="text-xs text-gray-400">
                {Math.round(s.confidence * 100)}% match
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2">
        {/* Quantity */}
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0.1"
          step="0.5"
          className="w-12 text-center text-sm border border-gray-200 rounded-lg px-1 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {/* Item name */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Add an item..."
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 text-sm py-2 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {input && (
          <button
            type="button"
            onClick={() => { setInput(''); setSuggestions([]); setShowSuggestions(false) }}
            className="text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={adding || !input.trim()}
          className="bg-brand-500 text-white rounded-xl px-3 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  )
}
