import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Get household
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role, households(id, name)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth')

  const { data: settings } = await supabase
    .from('household_settings')
    .select('*, stores(*)')
    .eq('household_id', membership.household_id)
    .single()

  const { data: members } = await supabase
    .from('household_members')
    .select('user_id, role')
    .eq('household_id', membership.household_id)

  return (
    <SettingsClient
      user={user}
      household={membership.households as { id: string; name: string }}
      settings={settings}
      members={members ?? []}
      userRole={membership.role}
    />
  )
}
