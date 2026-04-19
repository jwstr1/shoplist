import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/prices?name=milk
 *
 * Returns latest market prices for a product name across all chains.
 * Uses fuzzy matching from market_prices table (AGPD data).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const name = request.nextUrl.searchParams.get('name')
    if (!name || name.length < 2) {
      return NextResponse.json({ prices: [] })
    }

    // Get most recent price per chain for this product
    // Uses Postgres similarity via pg_trgm (enabled in migration)
    const { data: prices, error } = await supabase
      .from('market_prices')
      .select('store_name, store_chain, price, unit, is_special, was_price, unit_price, unit_type, fetched_at')
      .ilike('product_name', `%${name}%`)
      .order('fetched_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[prices GET]', error)
      return NextResponse.json({ prices: [] })
    }

    // De-duplicate: keep most recent per chain
    const byChain = new Map<string, typeof prices[0]>()
    for (const p of prices ?? []) {
      if (!byChain.has(p.store_chain)) {
        byChain.set(p.store_chain, p)
      }
    }

    const result = Array.from(byChain.values()).sort((a, b) => a.price - b.price)

    // Also get household purchase history prices for comparison
    const { data: historyPrices } = await supabase
      .from('purchase_history')
      .select('product_name, price, purchased_at, stores(name, chain)')
      .ilike('product_name', `%${name}%`)
      .not('price', 'is', null)
      .order('purchased_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      prices: result,
      history: historyPrices ?? [],
    })
  } catch (err: unknown) {
    console.error('[prices GET]', err)
    return NextResponse.json({ prices: [] })
  }
}
