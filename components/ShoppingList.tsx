'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { groupByCategory, CATEGORY_ICONS } from '@/lib/categories'
import type { ListItem } from '@/lib/types/database'
import { Trash2 } from 'lucide-react'
import PriceTag from './PriceTag'
import toast from 'react-hot-toast'

interface Props {
  listId: string
  initialItems: ListItem[]
  userId: string
}

export default function ShoppingList({ listId, initialItems, userId }: Props) {
  const [items, setItems] = useState<ListItem[]>(initialItems)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const supabase = createClient()

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel(`list:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as ListItem
            setItems((prev) => {
              if (prev.find((i) => i.id === newItem.id)) return prev
              return [...prev, newItem]
            })
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((i) => (i.id === payload.new.id ? (payload.new as ListItem) : i))
            )
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((i) => i.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [listId]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleItem = useCallback(async (item: ListItem) => {
    const newChecked = !item.checked
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, checked: newChecked, checked_by: newChecked ? userId : null, checked_at: newChecked ? new Date().toISOString() : null }
          : i
      )
    )

    const { error } = await supabase
      .from('list_items')
      .update({
        checked: newChecked,
        checked_by: newChecked ? userId : null,
        checked_at: newChecked ? new Date().toISOString() : null,
      })
      .eq('id', item.id)

    if (error) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
      toast.error('Failed to update item')
    }
  }, [supabase, userId])

  const deleteItem = useCallback(async (itemId: string) => {
    const snapshot = items
    setItems((prev) => prev.filter((i) => i.id !== itemId))

    const { error } = await supabase.from('list_items').delete().eq('id', itemId)
    if (error) {
      setItems(snapshot)
      toast.error('Failed to delete item')
    }
  }, [items, supabase])

  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)
  const grouped = groupByCategory(unchecked)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-5 border border-white/10">
          <span className="text-4xl">🛒</span>
        </div>
        <p className="text-white font-semibold text-base">Your list is empty</p>
        <p className="text-gray-500 text-sm mt-1">Add items using the bar below</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-3">
      {/* Realtime indicator */}
      <div className="flex items-center justify-end mb-3">
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            realtimeConnected ? 'bg-emerald-500 animate-pulse-dot' : 'bg-gray-700'
          }`}
        />
        <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">
          {realtimeConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Unchecked items grouped by category */}
      {Array.from(grouped.entries()).map(([category, categoryItems]) => (
        <div key={category} className="mb-5">
          {/* Category header */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-base leading-none">
              {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? '📦'}
            </span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {category}
            </span>
            <span className="ml-auto text-xs text-gray-700 font-medium bg-gray-800 px-1.5 py-0.5 rounded-md">
              {categoryItems.length}
            </span>
          </div>

          {/* Items card */}
          <div className="bg-gray-900 rounded-2xl border border-white/[0.07] overflow-hidden">
            {categoryItems.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                isLast={idx === categoryItems.length - 1}
                onToggle={toggleItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Checked / Done section */}
      {checked.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">
              ✓ Done
            </span>
            <span className="ml-auto text-xs text-gray-700 font-medium bg-gray-800 px-1.5 py-0.5 rounded-md">
              {checked.length}
            </span>
          </div>
          <div className="bg-gray-900/50 rounded-2xl border border-white/[0.04] overflow-hidden">
            {checked.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                isLast={idx === checked.length - 1}
                onToggle={toggleItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemRow({
  item,
  isLast,
  onToggle,
  onDelete,
}: {
  item: ListItem
  isLast: boolean
  onToggle: (item: ListItem) => void
  onDelete: (id: string) => void
}) {
  const [showDelete, setShowDelete] = useState(false)
  const [popping, setPopping] = useState(false)

  function handleToggle() {
    if (!item.checked) {
      setPopping(true)
      setTimeout(() => setPopping(false), 300)
    }
    onToggle(item)
  }

  return (
    <div
      className={`flex items-center px-4 py-3.5 gap-3 ${
        !isLast ? 'border-b border-white/[0.05]' : ''
      } animate-slide-in`}
      onTouchStart={() => setShowDelete(true)}
      onTouchEnd={() => setTimeout(() => setShowDelete(false), 2000)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all min-h-[44px] min-w-[44px] -ml-2 ${
          item.checked
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-gray-600 hover:border-emerald-500/60'
        } ${popping ? 'animate-check-pop' : ''}`}
        style={{ minHeight: '44px', minWidth: '44px' }}
        aria-label={item.checked ? 'Uncheck item' : 'Check item'}
      >
        {item.checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Name + qty */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-medium transition-colors leading-snug ${
            item.checked ? 'line-through text-gray-600' : 'text-white'
          }`}
        >
          {item.name}
        </span>
        {(item.quantity !== 1 || item.unit) && (
          <span className={`text-xs ml-1.5 ${item.checked ? 'text-gray-700' : 'text-gray-500'}`}>
            {item.quantity !== 1 ? item.quantity : ''}{item.unit ? ` ${item.unit}` : ''}
          </span>
        )}
      </div>

      {/* Price */}
      {item.estimated_price && !item.checked && (
        <PriceTag price={item.estimated_price} itemName={item.name} />
      )}

      {/* Delete button — appears on hover/touch */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
        className={`ml-1 flex-shrink-0 text-red-500 min-h-[44px] min-w-[32px] flex items-center justify-center transition-all duration-200 ${
          showDelete ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
        }`}
        aria-label="Delete item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
