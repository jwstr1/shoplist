import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseReceipt } from '@/lib/claude'
import { categoriseItem } from '@/lib/categories'

// POST: Parse receipt image via Claude
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await request.json()
    const { image, mediaType } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const type = validTypes.includes(mediaType) ? mediaType : 'image/jpeg'

    const receipt = await parseReceipt(image, type)

    return NextResponse.json({ receipt })
  } catch (err: unknown) {
    console.error('[parse-receipt POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Parse failed' },
      { status: 500 }
    )
  }
}

// PUT: Save parsed receipt to database
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await request.json()
    const { householdId, receipt } = body

    if (!householdId || !receipt) {
      return NextResponse.json({ error: 'Missing householdId or receipt' }, { status: 400 })
    }

    // Verify membership
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })
    }

    // Insert receipt record
    const { data: savedReceipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        household_id: householdId,
        store_name: receipt.store_name,
        store_chain: receipt.store_chain,
        total: receipt.total,
        purchase_date: receipt.purchase_date,
        parsed_json: receipt,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (receiptError || !savedReceipt) {
      throw receiptError ?? new Error('Failed to save receipt')
    }

    // Save purchase history for each item
    const historyRecords = receipt.items.map((item: {
      name: string
      quantity: number
      unit: string
      unit_price: number
      total_price: number
      category: string
    }) => ({
      household_id: householdId,
      product_name: item.name,
      price: item.unit_price,
      quantity: item.quantity,
      unit: item.unit,
      receipt_id: savedReceipt.id,
      purchased_at: receipt.purchase_date
        ? new Date(receipt.purchase_date).toISOString()
        : new Date().toISOString(),
    }))

    if (historyRecords.length > 0) {
      // Upsert products and link
      for (const record of historyRecords) {
        const canonical = record.product_name.toLowerCase().trim()
        const category = categoriseItem(record.product_name)

        const { data: product } = await supabase
          .from('products')
          .upsert(
            {
              household_id: householdId,
              name: record.product_name,
              canonical_name: canonical,
              default_category: category,
            },
            { onConflict: 'household_id,canonical_name', ignoreDuplicates: false }
          )
          .select()
          .single()

        await supabase.from('purchase_history').insert({
          ...record,
          product_id: product?.id ?? null,
        })
      }
    }

    return NextResponse.json({ receiptId: savedReceipt.id, itemCount: receipt.items.length })
  } catch (err: unknown) {
    console.error('[parse-receipt PUT]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 }
    )
  }
}
