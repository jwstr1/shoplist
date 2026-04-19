import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface WoolworthsStore {
  StoreId?: number
  Name?: string
  AddressLine1?: string
  Suburb?: string
  State?: string
  Postcode?: string
}

interface ColesStore {
  id?: number
  name?: string
  address?: string
  suburb?: string
  state?: string
  postcode?: string
}

/**
 * GET /api/stores?postcode=2000
 *
 * 1. Check our DB for cached stores with this postcode
 * 2. If <3 results, try Woolworths locator API
 * 3. Upsert results into stores table
 * 4. Return combined list
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const postcode = request.nextUrl.searchParams.get('postcode')
    if (!postcode || !/^\d{4}$/.test(postcode)) {
      return NextResponse.json({ error: 'Invalid postcode' }, { status: 400 })
    }

    // 1. Check our stores cache
    const { data: cached } = await supabase
      .from('stores')
      .select('*')
      .eq('postcode', postcode)
      .order('chain')

    if (cached && cached.length >= 3) {
      return NextResponse.json({ stores: cached, source: 'cache' })
    }

    // 2. Fetch from Woolworths API
    const woolworthsStores = await fetchWoolworthsStores(postcode)
    const storeRecords = woolworthsStores.map((s) => ({
      name: s.Name ?? 'Woolworths',
      chain: 'woolworths' as const,
      postcode,
      suburb: s.Suburb ?? '',
      state: s.State ?? 'NSW',
      address: s.AddressLine1 ?? null,
      external_id: s.StoreId ? String(s.StoreId) : null,
    }))

    // Also add known Coles/Aldi/IGA for the suburb (hardcoded common chains)
    // In production, integrate Coles locator API or a store directory
    const extraStores = await fetchColesStores(postcode)
    const colesRecords = extraStores.map((s) => ({
      name: s.name ?? 'Coles',
      chain: 'coles' as const,
      postcode,
      suburb: s.suburb ?? '',
      state: s.state ?? 'NSW',
      address: s.address ?? null,
      external_id: s.id ? String(s.id) : null,
    }))

    const allNew = [...storeRecords, ...colesRecords]

    // 3. Upsert into our DB
    if (allNew.length > 0) {
      await supabase
        .from('stores')
        .upsert(allNew, { onConflict: 'chain,external_id', ignoreDuplicates: true })
    }

    // 4. Return fresh results
    const { data: fresh } = await supabase
      .from('stores')
      .select('*')
      .eq('postcode', postcode)
      .order('chain')

    return NextResponse.json({ stores: fresh ?? cached ?? [], source: 'api' })
  } catch (err: unknown) {
    console.error('[stores GET]', err)
    return NextResponse.json({ stores: [], error: 'Failed to fetch stores' }, { status: 500 })
  }
}

async function fetchWoolworthsStores(postcode: string): Promise<WoolworthsStore[]> {
  try {
    // Woolworths store finder API
    const url = `https://www.woolworths.com.au/apis/ui/StoreLocator/stores?count=10&postcodes=${postcode}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        Accept: 'application/json',
        Referer: 'https://www.woolworths.com.au/',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = await res.json()
    // Woolworths returns { Stores: [...] } or similar
    return Array.isArray(data) ? data : (data.Stores ?? data.stores ?? [])
  } catch {
    return []
  }
}

async function fetchColesStores(postcode: string): Promise<ColesStore[]> {
  try {
    // Coles doesn't have a clean public API — return empty for now
    // In production: integrate with https://www.coles.com.au/find-a-store
    return []
  } catch {
    return []
  }
}
