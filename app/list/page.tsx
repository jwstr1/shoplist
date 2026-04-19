export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ListPageClient from './ListPageClient'

export default async function ListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Get user's default household
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('default_household_id, display_name')
    .eq('id', user.id)
    .single()

  let householdId = profile?.default_household_id

  // If no household, check if member of any
  if (!householdId) {
    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    householdId = membership?.household_id ?? null
  }

  // Get active lists for this household
  const { data: lists } = householdId
    ? await supabase
        .from('shopping_lists')
        .select('*, stores(name, chain)')
        .eq('household_id', householdId)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
    : { data: null }

  // If no active list, redirect to first (or create one)
  if (lists && lists.length > 0) {
    redirect(`/list/${lists[0].id}`)
  }

  return (
    <ListPageClient
      householdId={householdId}
      userId={user.id}
      displayName={profile?.display_name ?? null}
    />
  )
}
