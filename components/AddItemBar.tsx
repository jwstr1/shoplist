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
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Debounced autocomplete
  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
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
          const sugs = data.suggestions ?? []
          setSuggestions(sugs)
          setShowSuggestions(sugs.length > 0)
        }
      } catch {
        // silent
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [input, householdId])

  async function addItem(name: string, qty = 1) {
    const trimmed = name.trim()
    if (!trimmed) return

    setAdding(true)
    setShowSuggestions(false)

    const category = categoriseItem(trimmed)
    const canonical = trimmed.toLowerCase()

    const { data: product } = await supabase
      .from('products')
      .upsert(
        { household_id: householdId, name: trimmed, canonical_name: canonical, default_category: category },
        { onConflict: 'household_id,canonical_name', ignoreDuplicates: false }
      )
      .select()
      .single()

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

  function clearInput() {
    setInput('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] inset-x-0 z-30">
      {/* Autocomplete dropdown (above input bar) */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mx-3 mb-1 bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s.name}
              onMouseDown={() => addItem(s.name, 1)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between active:bg-white/5 ${
                i < suggestions.length - 1 ? 'border-b border-white/[0.06]' : ''
              }`}
            >
              <span className="text-white text-sm">{s.name}</span>
              <span className="text-xs text-gray-600 ml-2">
                {Math.round(s.confidence * 100)}%
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="bg-gray-950/98 backdrop-blur-xl border-t border-white/[0.07] shadow-2xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
          {/* Quantity */}
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0.1"
            step="0.5"
            className="w-12 text-center bg-gray-800 border border-white/10 text-white rounded-xl py-2 focus:outline-none focus:border-emerald-500/50 text-sm font-medium"
          />

          {/* Item name input */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Add an item…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              className="w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 pr-9 text-sm"
            />
            {input.length > 0 && (
              <button
                type="button"
                onClick={clearInput}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 w-6 h-6 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add button */}
          <button
            type="submit"
            disabled={adding || !input.trim()}
            className="w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-90 transition-transform shadow-lg shadow-emerald-500/25"
            aria-label="Add item"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-white" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
