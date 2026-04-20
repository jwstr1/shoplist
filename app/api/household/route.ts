import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/household — create a household + first list for the authenticated user
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const householdName = body.householdName || `My Household`
    const listName = body.listName || 'Weekly Shop'

    // Use service client to bypass RLS for household creation
    const serviceClient = await createServiceClient()

    // Check if user already has a household
    const { data: existingMembership } = await serviceClient
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      // Already has household — just create the list
      const { data: list, error: listErr } = await serviceClient
        .from('shopping_lists')
        .insert({ household_id: existingMembership.household_id, name: listName })
        .select()
        .single()

      if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })
      return NextResponse.json({ householdId: existingMembership.household_id, listId: list.id })
    }

    // Create household
    const { data: household, error: hErr } = await serviceClient
      .from('households')
      .insert({ name: householdName })
      .select()
      .single()

    if (hErr || !household) {
      return NextResponse.json({ error: hErr?.message || 'Failed to create household' }, { status: 500 })
    }

    // Add user as owner
    await serviceClient.from('household_members').insert({
      household_id: household.id,
      user_id: user.id,
      role: 'owner',
    })

    // Update user profile
    await serviceClient.from('user_profiles').upsert({
      id: user.id,
      default_household_id: household.id,
    })

    // Create first shopping list
    const { data: list, error: listErr } = await serviceClient
      .from('shopping_lists')
      .insert({ household_id: household.id, name: listName })
      .select()
      .single()

    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

    return NextResponse.json({ householdId: household.id, listId: list.id })
  } catch (err: any) {
    console.error('Household creation error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// POST /api/household/list — create a new list in existing household
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { householdId, listName } = await req.json()
    const serviceClient = await createServiceClient()

    const { data: list, error } = await serviceClient
      .from('shopping_lists')
      .insert({ household_id: householdId, name: listName || 'Shopping List' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ listId: list.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
