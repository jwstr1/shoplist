/**
 * Suggestion algorithm — scores items from purchase history by:
 * 1. Purchase frequency (how often bought)
 * 2. Days since last purchase vs typical interval
 * 3. Returns top results with confidence score 0..1
 */

export interface PurchaseRecord {
  product_name: string
  product_id: string | null
  purchased_at: string
  quantity: number | null
}

export interface SuggestedItem {
  name: string
  productId: string | null
  confidence: number       // 0..1
  daysSinceLast: number
  typicalIntervalDays: number
  purchaseCount: number
  lastPrice: number | null
}

interface ProductStats {
  productId: string | null
  purchases: Date[]
  lastPrice: number | null
}

/**
 * Score items from purchase history.
 * @param history - All purchase records for the household
 * @param prices - Map of product_name → last price paid
 * @param topN - Number of suggestions to return (default 10)
 * @param nowOverride - Override current date (for testing)
 */
export function scoreSuggestions(
  history: PurchaseRecord[],
  prices: Map<string, number>,
  topN = 10,
  nowOverride?: Date
): SuggestedItem[] {
  const now = nowOverride ?? new Date()

  // Group purchases by normalised product name
  const byProduct = new Map<string, ProductStats>()

  for (const record of history) {
    const key = record.product_name.toLowerCase().trim()
    const existing = byProduct.get(key)
    const date = new Date(record.purchased_at)

    if (existing) {
      existing.purchases.push(date)
    } else {
      byProduct.set(key, {
        productId: record.product_id,
        purchases: [date],
        lastPrice: prices.get(key) ?? null,
      })
    }
  }

  const scored: SuggestedItem[] = []

  for (const [name, stats] of byProduct.entries()) {
    const { purchases, productId, lastPrice } = stats
    const purchaseCount = purchases.length

    // Need at least 1 purchase to suggest
    if (purchaseCount < 1) continue

    // Sort ascending
    purchases.sort((a, b) => a.getTime() - b.getTime())
    const lastPurchase = purchases[purchases.length - 1]
    const daysSinceLast = (now.getTime() - lastPurchase.getTime()) / 86400000

    // Calculate typical interval
    let typicalIntervalDays: number
    if (purchaseCount === 1) {
      // Only one purchase — assume weekly (7 days)
      typicalIntervalDays = 7
    } else {
      // Average interval between consecutive purchases
      let totalInterval = 0
      for (let i = 1; i < purchases.length; i++) {
        totalInterval += (purchases[i].getTime() - purchases[i - 1].getTime()) / 86400000
      }
      typicalIntervalDays = totalInterval / (purchases.length - 1)
      // Clamp between 1 and 90 days
      typicalIntervalDays = Math.max(1, Math.min(90, typicalIntervalDays))
    }

    // --- Score calculation ---
    // Overdue ratio: how overdue is the next purchase?
    // 0 = just bought, 1 = exactly on schedule, >1 = overdue
    const overdueness = daysSinceLast / typicalIntervalDays

    // Frequency score: buying something every 3 days is more reliable than once a month
    const frequencyScore = Math.min(1, purchaseCount / 10)

    // Overdue score: peaks at 1.2x overdue (very likely needed), falls off slowly after
    let overdueScore: number
    if (overdueness < 0.5) {
      // Bought recently — unlikely to need yet
      overdueScore = overdueness * 0.5
    } else if (overdueness < 1.2) {
      // Approaching or at the due date — linearly ramp to 1.0
      overdueScore = 0.25 + ((overdueness - 0.5) / 0.7) * 0.75
    } else if (overdueness < 3) {
      // Overdue — stay near 1.0, slight decay
      overdueScore = 1.0 - ((overdueness - 1.2) / 1.8) * 0.2
    } else {
      // Very overdue (>3x interval) — may have stopped buying this
      overdueScore = Math.max(0.1, 0.8 - ((overdueness - 3) / 10) * 0.3)
    }

    // Combined confidence
    const confidence = overdueScore * 0.6 + frequencyScore * 0.4

    // Don't suggest if bought in last 25% of typical interval
    if (overdueness < 0.25) continue

    scored.push({
      name: capitalise(name),
      productId,
      confidence: Math.min(1, Math.max(0, confidence)),
      daysSinceLast: Math.round(daysSinceLast),
      typicalIntervalDays: Math.round(typicalIntervalDays),
      purchaseCount,
      lastPrice,
    })
  }

  // Sort by confidence descending
  scored.sort((a, b) => b.confidence - a.confidence)

  return scored.slice(0, topN)
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
