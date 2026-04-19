/**
 * AGPD (Australian Grocery Price Database) utilities.
 * Fetches price data from the troykelly/costs-this-much GitHub project.
 *
 * Primary source: GitHub raw JSON files
 * Fallback: Woolworths/Coles public product APIs (scraping-light)
 */

export interface AGPDProduct {
  name: string
  chain: 'woolworths' | 'coles' | 'aldi' | 'iga' | 'other'
  store_name: string
  price: number
  unit: string
  unit_price: number | null
  unit_type: string | null
  is_special: boolean
  was_price: number | null
}

const AGPD_BASE_URL =
  process.env.AGPD_GITHUB_RAW ??
  'https://raw.githubusercontent.com/troykelly/costs-this-much/main/data/'

const AGPD_CHAINS = [
  { chain: 'woolworths' as const, file: 'woolworths.json' },
  { chain: 'coles' as const, file: 'coles.json' },
]

interface AGPDRawProduct {
  name?: string
  displayName?: string
  price?: number
  wasPrice?: number
  isSpecial?: boolean
  isOnSpecial?: boolean
  unit?: string
  cupString?: string
  cupPrice?: number
  storeId?: string
  storeName?: string
}

/**
 * Fetch and normalise AGPD price data for one chain.
 * Returns empty array on any error (silent fallback).
 */
async function fetchChainPrices(
  chain: 'woolworths' | 'coles',
  file: string
): Promise<AGPDProduct[]> {
  const url = `${AGPD_BASE_URL}${file}`

  let data: AGPDRawProduct[]
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'shoplist-agpd-sync/1.0' },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) {
      console.warn(`[AGPD] ${chain} fetch returned ${res.status} — skipping`)
      return []
    }
    data = await res.json()
  } catch (err) {
    console.warn(`[AGPD] ${chain} fetch failed:`, err)
    return []
  }

  if (!Array.isArray(data)) {
    console.warn(`[AGPD] ${chain} data is not an array`)
    return []
  }

  return data
    .filter((p) => (p.name || p.displayName) && (p.price ?? 0) > 0)
    .map((p) => {
      // Parse unit info from cupString e.g. "$1.30 per 100g"
      let unitType: string | null = null
      let unitPrice: number | null = null

      if (p.cupString) {
        const match = p.cupString.match(/per\s+(.+)/i)
        if (match) unitType = match[1].toLowerCase()
      }
      if (p.cupPrice) unitPrice = p.cupPrice

      return {
        name: (p.displayName ?? p.name ?? '').trim(),
        chain,
        store_name: p.storeName ?? (chain === 'woolworths' ? 'Woolworths' : 'Coles'),
        price: Number(p.price),
        unit: p.unit ?? 'ea',
        unit_price: unitPrice,
        unit_type: unitType,
        is_special: Boolean(p.isSpecial ?? p.isOnSpecial),
        was_price: p.wasPrice ? Number(p.wasPrice) : null,
      }
    })
}

/**
 * Fetch all available AGPD price data.
 * Returns normalised products from all chains.
 * Never throws — returns empty array on complete failure.
 */
export async function fetchAllAGPDPrices(): Promise<AGPDProduct[]> {
  const results = await Promise.allSettled(
    AGPD_CHAINS.map(({ chain, file }) => fetchChainPrices(chain, file))
  )

  const all: AGPDProduct[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      all.push(...result.value)
    }
  }

  console.log(`[AGPD] Fetched ${all.length} price records`)
  return all
}

/**
 * De-duplicate products: keep one record per (product_name, store_chain) pair.
 * Uses the cheapest price when duplicates exist.
 */
export function deduplicatePrices(products: AGPDProduct[]): AGPDProduct[] {
  const map = new Map<string, AGPDProduct>()

  for (const p of products) {
    const key = `${p.name.toLowerCase()}::${p.chain}`
    const existing = map.get(key)
    if (!existing || p.price < existing.price) {
      map.set(key, p)
    }
  }

  return Array.from(map.values())
}
