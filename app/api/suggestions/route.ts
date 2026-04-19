import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreSuggestions } from '@/lib/suggestions'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('household')
    const query = searchParams.get('q') ?? ''
    const top = parseInt(searchParams.get('top') ?? '10', 10)

    if (!householdId) {
      return NextResponse.json({ error: 'Missing household param' }, { status: 400 })
    }

    // Verify membership
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Fetch purchase history (last 6 months for performance)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: history } = await supabase
      .from('purchase_history')
      .select('product_name, product_id, purchased_at, quantity')
      .eq('household_id', householdId)
      .gte('purchased_at', sixMonthsAgo.toISOString())
      .order('purchased_at', { ascending: false })
      .limit(500)

    if (!history || history.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    // Build price map from recent purchase history
    const priceMap = new Map<string, number>()
    const { data: recentPrices } = await supabase
      .from('purchase_history')
      .select('product_name, price')
      .eq('household_id', householdId)
      .not('price', 'is', null)
      .order('purchased_at', { ascending: false })
      .limit(200)

    for (const p of recentPrices ?? []) {
      const key = p.product_name.toLowerCase()
      if (!priceMap.has(key) && p.price) {
        priceMap.set(key, p.price)
      }
    }

    let suggestions = scoreSuggestions(history, priceMap, top)

    // Filter by query if provided (autocomplete mode)
    if (query.length >= 2) {
      const lowerQuery = query.toLowerCase()
      suggestions = suggestions.filter((s) =>
        s.name.toLowerCase().includes(lowerQuery)
      )

      // Also search products table for prefix matches
      const { data: products } = await supabase
        .from('products')
        .select('name, canonical_name')
        .eq('household_id', householdId)
        .ilike('canonical_name', `%${lowerQuery}%`)
        .limit(5)

      // Add product matches not already in suggestions
      const existingNames = new Set(suggestions.map((s) => s.name.toLowerCase()))
      for (const p of products ?? []) {
        if (!existingNames.has(p.canonical_name)) {
          suggestions.push({
            name: p.name,
            productId: null,
            confidence: 0.5,
            daysSinceLast: 0,
            typicalIntervalDays: 7,
            purchaseCount: 0,
            lastPrice: priceMap.get(p.canonical_name) ?? null,
          })
        }
      }
    }

    return NextResponse.json({
      suggestions: suggestions.slice(0, top).map((s) => ({
        name: s.name,
        confidence: s.confidence,
        lastPrice: s.lastPrice,
        daysSinceLast: s.daysSinceLast,
      })),
    })
  } catch (err: unknown) {
    console.error('[suggestions GET]', err)
    return NextResponse.json({ suggestions: [] })
  }
}
