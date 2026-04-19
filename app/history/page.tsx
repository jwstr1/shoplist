import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HistoryClient from './HistoryClient'

export default async function HistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('default_household_id')
    .eq('id', user.id)
    .single()

  const householdId = profile?.default_household_id
  if (!householdId) redirect('/list')

  // Monthly spending summary (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: history } = await supabase
    .from('purchase_history')
    .select('product_name, price, quantity, purchased_at, stores(name, chain)')
    .eq('household_id', householdId)
    .gte('purchased_at', sixMonthsAgo.toISOString())
    .order('purchased_at', { ascending: false })
    .limit(200)

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, store_name, store_chain, total, purchase_date, created_at')
    .eq('household_id', householdId)
    .order('purchase_date', { ascending: false })
    .limit(20)

  return (
    <HistoryClient
      history={history ?? []}
      receipts={receipts ?? []}
      householdId={householdId}
    />
  )
}
