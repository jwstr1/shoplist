/**
 * Receipt parsing via Claude API.
 * Uses claude-3-5-haiku for speed and cost efficiency.
 */

import Anthropic from '@anthropic-ai/sdk'

export interface ParsedReceiptItem {
  name: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  category: string
}

export interface ParsedReceipt {
  store_name: string
  store_chain: 'woolworths' | 'coles' | 'aldi' | 'iga' | 'other'
  purchase_date: string | null  // ISO date string
  total: number
  items: ParsedReceiptItem[]
}

const RECEIPT_PARSE_PROMPT = `You are a receipt parser for Australian grocery stores. Analyse the receipt image and extract structured data.

Identify the store (Woolworths, Coles, Aldi, IGA, or other).

For each line item, extract:
- Item name (clean, readable, remove abbreviations)
- Quantity (default 1 if not shown)
- Unit (ea, kg, g, L, mL, pack)
- Unit price
- Total price for that line

Categorise each item into one of:
Produce, Bakery, Dairy & Eggs, Meat & Seafood, Deli, Frozen, Pantry, Snacks & Confectionery, Beverages, Cleaning & Household, Personal Care, Baby, Pet, Other

Respond ONLY with valid JSON in this exact format:
{
  "store_name": "Woolworths Chatswood",
  "store_chain": "woolworths",
  "purchase_date": "2024-11-15",
  "total": 87.43,
  "items": [
    {
      "name": "Full Cream Milk 2L",
      "quantity": 1,
      "unit": "ea",
      "unit_price": 3.90,
      "total_price": 3.90,
      "category": "Dairy & Eggs"
    }
  ]
}

Notes:
- purchase_date must be in ISO format YYYY-MM-DD or null if unclear
- store_chain must be exactly: woolworths, coles, aldi, iga, or other
- Do NOT include loyalty points, savings lines, bags, or gift cards as items
- Prices in AUD without the $ symbol`

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Parse a receipt image using Claude.
 * @param imageBase64 - Base64-encoded image (JPEG/PNG/HEIC)
 * @param mediaType - MIME type of the image
 */
export async function parseReceipt(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<ParsedReceipt> {
  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: RECEIPT_PARSE_PROMPT,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Extract JSON from response (Claude sometimes wraps in markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Claude did not return valid JSON')
  }

  const parsed = JSON.parse(jsonMatch[0]) as ParsedReceipt

  // Validate required fields
  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error('Parsed receipt missing items array')
  }

  // Ensure store_chain is valid
  const validChains = ['woolworths', 'coles', 'aldi', 'iga', 'other'] as const
  if (!validChains.includes(parsed.store_chain)) {
    parsed.store_chain = 'other'
  }

  // Sanitise items
  parsed.items = parsed.items.map((item) => ({
    name: String(item.name || '').trim(),
    quantity: Number(item.quantity) || 1,
    unit: String(item.unit || 'ea').trim(),
    unit_price: Number(item.unit_price) || 0,
    total_price: Number(item.total_price) || 0,
    category: String(item.category || 'Pantry').trim(),
  })).filter((item) => item.name && item.total_price > 0)

  return parsed
}
