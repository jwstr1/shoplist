import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Suggestion engine Edge Function
// Analyses purchase history to suggest items likely needed now
// Called by the /api/suggestions Next.js route

interface SuggestionResult {
  product_id: string | null
  product_name: string
  category: string
  confidence: number
  days_since_last: number
  typical_interval_days: number
  times_purchased: number
}

Deno.serve(async (req) => {
  const { household_id } = await req.json()

  if (!household_id) {
    return new Response(JSON.stringify({ error: 'household_id required' }), { status: 400 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get purchase history for this household, last 6 months
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

  const { data: history, error } = await supabase
    .from('purchase_history')
    .select(`
      product_id,
      purchased_at,
      products(id, canonical_name, default_category)
    `)
    .eq('household_id', household_id)
    .gte('purchased_at', sixMonthsAgo)
    .order('purchased_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!history || history.length === 0) {
    return new Response(JSON.stringify({ suggestions: [] }))
  }

  // Group purchases by product
  const productMap = new Map<string, {
    name: string
    category: string
    product_id: string
    dates: Date[]
  }>()

  for (const purchase of history) {
    const product = purchase.products as { id: string; canonical_name: string; default_category: string } | null
    if (!product) continue

    const key = product.id
    const existing = productMap.get(key)
    const date = new Date(purchase.purchased_at)

    if (existing) {
      existing.dates.push(date)
    } else {
      productMap.set(key, {
        name: product.canonical_name,
        category: product.default_category ?? 'Pantry',
        product_id: product.id,
        dates: [date],
      })
    }
  }

  const now = Date.now()
  const suggestions: SuggestionResult[] = []

  for (const [, data] of productMap) {
    if (data.dates.length < 2) continue // Need at least 2 purchases to estimate interval

    // Sort dates ascending
    const sorted = data.dates.sort((a, b) => a.getTime() - b.getTime())

    // Calculate average interval between purchases
    let totalInterval = 0
    for (let i = 1; i < sorted.length; i++) {
      totalInterval += sorted[i].getTime() - sorted[i - 1].getTime()
    }
    const avgIntervalMs = totalInterval / (sorted.length - 1)
    const avgIntervalDays = avgIntervalMs / (1000 * 60 * 60 * 24)

    // Days since last purchase
    const lastPurchase = sorted[sorted.length - 1]
    const daysSinceLast = (now - lastPurchase.getTime()) / (1000 * 60 * 60 * 24)

    // How overdue is the item? (ratio of days since last vs typical interval)
    const overdueFactor = daysSinceLast / avgIntervalDays

    // Confidence: 0 if just bought, 1.0 at typical interval, up to 1.5 if overdue
    // Clamp to max 1.0 for display
    let confidence = Math.min(overdueFactor, 1.5) / 1.5
    confidence = Math.round(confidence * 100) / 100

    // Only suggest items where we're at least 70% through the typical interval
    if (overdueFactor < 0.7) continue

    suggestions.push({
      product_id: data.product_id,
      product_name: data.name,
      category: data.category,
      confidence,
      days_since_last: Math.round(daysSinceLast),
      typical_interval_days: Math.round(avgIntervalDays),
      times_purchased: data.dates.length,
    })
  }

  // Sort by confidence descending, return top 10
  suggestions.sort((a, b) => b.confidence - a.confidence)
  const top10 = suggestions.slice(0, 10)

  return new Response(
    JSON.stringify({ suggestions: top10 }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
