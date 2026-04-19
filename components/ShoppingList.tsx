'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { groupByCategory, CATEGORY_ICONS } from '@/lib/categories'
import type { ListItem } from '@/lib/types/database'
import { Trash2, GripVertical } from 'lucide-react'
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

  // Subscribe to realtime changes
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId, supabase])

  const toggleItem = useCallback(
    async (item: ListItem) => {
      const newChecked = !item.checked
      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                checked: newChecked,
                checked_by: newChecked ? userId : null,
                checked_at: newChecked ? new Date().toISOString() : null,
              }
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
        // Revert
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? item : i))
        )
        toast.error('Failed to update item')
      }
    },
    [supabase, userId]
  )

  const deleteItem = useCallback(
    async (itemId: string) => {
      const prev = items
      setItems((prev) => prev.filter((i) => i.id !== itemId))

      const { error } = await supabase.from('list_items').delete().eq('id', itemId)
      if (error) {
        setItems(prev)
        toast.error('Failed to delete item')
      }
    },
    [items, supabase]
  )

  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)
  const grouped = groupByCategory(unchecked)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <span className="text-5xl mb-4">🛒</span>
        <p className="text-gray-500 font-medium">Your list is empty</p>
        <p className="text-gray-400 text-sm mt-1">Add items using the bar below</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-2">
      {/* Realtime indicator */}
      <div className="flex items-center justify-end mb-2">
        <span
          className={`w-2 h-2 rounded-full ${
            realtimeConnected ? 'bg-brand-500 animate-pulse-dot' : 'bg-gray-300'
          }`}
        />
        <span className="text-xs text-gray-400 ml-1">
          {realtimeConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Unchecked items grouped by category */}
      {Array.from(grouped.entries()).map(([category, categoryItems]) => (
        <div key={category} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? '📦'}</span>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {category}
            </h3>
            <span className="text-xs text-gray-400 ml-auto">{categoryItems.length}</span>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
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

      {/* Checked items */}
      {checked.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              ✓ Done ({checked.length})
            </h3>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 opacity-60">
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

  return (
    <div
      className={`flex items-center px-4 py-3 ${!isLast ? 'border-b border-gray-50' : ''} animate-slide-in`}
      onLongPress={() => setShowDelete(true)}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item)}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3 min-h-[44px] min-w-[44px] -ml-2"
        style={{ minHeight: '44px', minWidth: '44px' }}
        aria-label={item.checked ? 'Uncheck item' : 'Check item'}
      >
        {item.checked && (
          <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </button>

      {/* Item name + qty */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {item.name}
        </span>
        {(item.quantity !== 1 || item.unit) && (
          <span className="text-xs text-gray-400 ml-1">
            {item.quantity !== 1 ? item.quantity : ''} {item.unit ?? ''}
          </span>
        )}
      </div>

      {/* Price */}
      {item.estimated_price && (
        <PriceTag price={item.estimated_price} itemName={item.name} />
      )}

      {/* Delete button */}
      <button
        onClick={() => onDelete(item.id)}
        className="ml-2 text-red-400 opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
        onTouchStart={() => setShowDelete(true)}
        style={{ opacity: showDelete ? 1 : 0 }}
        aria-label="Delete item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
