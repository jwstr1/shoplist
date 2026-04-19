import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// AGPD (aus_grocery_price_database) sync function
// Runs nightly at 3am to fetch latest grocery prices and cache them in market_prices table
// Schedule: "0 3 * * *"

const AGPD_GRAFANA_URL = 'https://agpd.app'
const AGPD_INFLUX_TOKEN = 'glsa_KnlZpFWMq9GHWDm9FJAOl7vEynMFDZ31_eb279fca' // public read-only

interface PriceRecord {
  product_name: string
  store_name: string
  store_id: string | null
  price: number
  is_special: boolean
  fetched_at: string
}

async function fetchFromAGPD(): Promise<PriceRecord[]> {
  // Try AGPD Grafana InfluxDB proxy
  try {
    const response = await fetch(`${AGPD_GRAFANA_URL}/api/datasources/proxy/1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AGPD_INFLUX_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        q: 'SELECT LAST("price"), "store", "special" FROM "prices" WHERE time > now() - 2d GROUP BY "product_name", "store" LIMIT 5000',
        db: 'grocery_prices',
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) throw new Error(`AGPD returned ${response.status}`)

    const data = await response.json()
    const records: PriceRecord[] = []
    const now = new Date().toISOString()

    if (data?.results?.[0]?.series) {
      for (const series of data.results[0].series) {
        const productName = series.tags?.product_name
        const storeName = series.tags?.store
        if (!productName || !storeName) continue

        for (const row of series.values ?? []) {
          const price = parseFloat(row[1])
          const isSpecial = row[3] === true || row[3] === 'true'
          if (!isNaN(price) && price > 0) {
            records.push({
              product_name: productName,
              store_name: storeName,
              store_id: null,
              price,
              is_special: isSpecial,
              fetched_at: now,
            })
          }
        }
      }
    }

    console.log(`AGPD: fetched ${records.length} price records`)
    return records
  } catch (err) {
    console.warn('AGPD Grafana fetch failed, trying fallback:', err)
    return fetchFallback()
  }
}

async function fetchFallback(): Promise<PriceRecord[]> {
  // Fallback: try AGPD GitHub raw data exports
  // The project sometimes publishes CSV exports to GitHub releases
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/PhiHo-eng/aus_grocery_price_database/main/data/latest.json',
      { signal: AbortSignal.timeout(15000) }
    )
    if (!response.ok) throw new Error(`GitHub fallback returned ${response.status}`)

    const data = await response.json()
    const now = new Date().toISOString()
    const records: PriceRecord[] = []

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.name && item.store && item.price) {
          records.push({
            product_name: String(item.name),
            store_name: String(item.store),
            store_id: null,
            price: parseFloat(item.price),
            is_special: item.special === true,
            fetched_at: now,
          })
        }
      }
    }

    console.log(`AGPD fallback: fetched ${records.length} records`)
    return records
  } catch (err) {
    console.error('AGPD fallback also failed:', err)
    return []
  }
}

Deno.serve(async (req) => {
  // Allow manual trigger via POST as well as cron
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('Starting AGPD price sync...')

  const records = await fetchFromAGPD()

  if (records.length === 0) {
    console.log('No records fetched — skipping upsert')
    return new Response(
      JSON.stringify({ success: true, upserted: 0, message: 'No data from AGPD — prices unchanged' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Batch upsert in chunks of 500
  let totalUpserted = 0
  const chunkSize = 500

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize)
    const { error } = await supabase
      .from('market_prices')
      .upsert(chunk, {
        onConflict: 'product_name,store_name',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Upsert error:', error)
    } else {
      totalUpserted += chunk.length
    }
  }

  // Clean up records older than 7 days
  await supabase
    .from('market_prices')
    .delete()
    .lt('fetched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  console.log(`Sync complete: ${totalUpserted} records upserted`)

  return new Response(
    JSON.stringify({ success: true, upserted: totalUpserted }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
