'use client'

import { useState, useEffect } from 'react'
import { Tag } from 'lucide-react'

interface StorePrice {
  store_name: string
  store_chain: string
  price: number
  is_special: boolean
  was_price: number | null
}

interface Props {
  price: number
  itemName: string
  showComparison?: boolean
}

export default function PriceTag({ price, itemName, showComparison = false }: Props) {
  const [prices, setPrices] = useState<StorePrice[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function loadPrices() {
    if (prices.length > 0) return
    setLoading(true)
    try {
      const res = await fetch(`/api/prices?name=${encodeURIComponent(itemName)}`)
      if (res.ok) {
        const data = await res.json()
        setPrices(data.prices ?? [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function handleClick() {
    if (showComparison) {
      setExpanded(!expanded)
      if (!expanded) loadPrices()
    }
  }

  const cheapest = prices.length > 0 ? prices.reduce((a, b) => (a.price < b.price ? a : b)) : null
  const isCheapest = cheapest && Math.abs(cheapest.price - price) < 0.01

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="flex items-center gap-0.5 text-xs font-medium text-gray-500 min-h-[44px] px-1"
      >
        {isCheapest && (
          <span className="text-brand-500 mr-0.5">✓</span>
        )}
        <span className="text-gray-700">${price.toFixed(2)}</span>
        {showComparison && (
          <Tag className="w-3 h-3 text-gray-400 ml-0.5" />
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-48 z-50">
          <p className="text-xs font-semibold text-gray-500 mb-2">Price comparison</p>
          {loading && (
            <p className="text-xs text-gray-400">Loading...</p>
          )}
          {prices.length === 0 && !loading && (
            <p className="text-xs text-gray-400">No price data available</p>
          )}
          {prices.map((p) => (
            <div key={p.store_chain} className="flex items-center justify-between py-1">
              <span className="text-xs text-gray-600 capitalize">{p.store_chain}</span>
              <div className="text-right">
                <span className={`text-xs font-medium ${p.is_special ? 'text-red-500' : 'text-gray-800'}`}>
                  ${p.price.toFixed(2)}
                </span>
                {p.is_special && p.was_price && (
                  <span className="text-xs text-gray-400 line-through ml-1">
                    ${p.was_price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
