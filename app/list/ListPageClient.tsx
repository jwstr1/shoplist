'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Plus, ShoppingCart, Loader2 } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

interface Props {
  householdId: string | null
  userId: string
  displayName: string | null
}

export default function ListPageClient({ householdId, userId, displayName }: Props) {
  const [creating, setCreating] = useState(false)
  const [listName, setListName] = useState('Weekly Shop')
  const router = useRouter()
  const supabase = createClient()

  async function createHouseholdAndList() {
    setCreating(true)
    try {
      // Create household
      const { data: household, error: hErr } = await supabase
        .from('households')
        .insert({ name: `${displayName ?? 'My'} Household` })
        .select()
        .single()

      if (hErr || !household) throw hErr

      await supabase.from('household_members').insert({
        household_id: household.id,
        user_id: userId,
        role: 'owner',
      })

      await supabase.from('user_profiles').upsert({
        id: userId,
        default_household_id: household.id,
      })

      const { data: list } = await supabase
        .from('shopping_lists')
        .insert({ household_id: household.id, name: listName })
        .select()
        .single()

      if (list) {
        toast.success('Household created!')
        router.push(`/list/${list.id}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to create household')
    } finally {
      setCreating(false)
    }
  }

  async function createList() {
    if (!householdId) {
      await createHouseholdAndList()
      return
    }

    setCreating(true)
    const { data: list } = await supabase
      .from('shopping_lists')
      .insert({ household_id: householdId, name: listName })
      .select()
      .single()

    if (list) {
      router.push(`/list/${list.id}`)
    } else {
      toast.error('Failed to create list')
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-brand-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No active lists</h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Create a shopping list to get started
        </p>

        <div className="w-full max-w-xs space-y-3">
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="List name"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
          <button
            onClick={createList}
            disabled={creating || !listName.trim()}
            className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[44px]"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create List
              </>
            )}
          </button>
        </div>
      </div>
      <BottomNav active="list" />
    </div>
  )
}
