export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShoppingListPageClient from './ShoppingListPageClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ShoppingListPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: list, error } = await supabase
    .from('shopping_lists')
    .select('*, stores(id, name, chain)')
    .eq('id', id)
    .single()

  if (error || !list) redirect('/list')

  const { data: items } = await supabase
    .from('list_items')
    .select('*')
    .eq('list_id', id)
    .order('sort_order', { ascending: true })

  // Get all household active lists for the switcher
  const { data: allLists } = await supabase
    .from('shopping_lists')
    .select('id, name, created_at')
    .eq('household_id', list.household_id)
    .is('completed_at', null)
    .order('created_at', { ascending: false })

  return (
    <ShoppingListPageClient
      list={list}
      initialItems={items ?? []}
      userId={user.id}
      allLists={allLists ?? []}
    />
  )
}
