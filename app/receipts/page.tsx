import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReceiptsClient from './ReceiptsClient'

export default async function ReceiptsPage() {
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

  return <ReceiptsClient householdId={householdId} userId={user.id} />
}
