export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ListPageClient from './ListPageClient'

export interface ShoppingListSummary {
  id: string
  name: string
  created_at: string
  stores: { name: string; chain: string } | null
  itemCount: number
}

export default async function ListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('default_household_id, display_name')
    .eq('id', user.id)
    .single()

  let householdId: string | null = profile?.default_household_id ?? null

  // Fallback: check household_members directly (handles signup race condition)
  if (!householdId) {
    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()
    householdId = membership?.household_id ?? null
  }

  // Fetch active lists
  const { data: rawLists } = householdId
    ? await supabase
        .from('shopping_lists')
        .select('id, name, created_at, store_id, stores(name, chain)')
        .eq('household_id', householdId)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
    : { data: [] }

  let summaries: ShoppingListSummary[] = []

  if (rawLists && rawLists.length > 0) {
    // Fetch unchecked item counts for all lists in one query
    const { data: items } = await supabase
      .from('list_items')
      .select('list_id, checked')
      .in('list_id', rawLists.map((l) => l.id))
      .eq('checked', false)

    const countMap: Record<string, number> = {}
    for (const item of items ?? []) {
      countMap[item.list_id] = (countMap[item.list_id] ?? 0) + 1
    }

    summaries = rawLists.map((l) => {
      const storeData = Array.isArray(l.stores) ? l.stores[0] : l.stores
      return {
        id: l.id,
        name: l.name,
        created_at: l.created_at,
        stores: storeData ?? null,
        itemCount: countMap[l.id] ?? 0,
      }
    })
  }

  return (
    <ListPageClient
      householdId={householdId}
      userId={user.id}
      displayName={profile?.display_name ?? null}
      lists={summaries}
    />
  )
}
