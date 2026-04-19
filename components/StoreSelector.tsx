'use client'

import { useState } from 'react'
import { Search, MapPin, Loader2, X, Check } from 'lucide-react'

interface Store {
  id: string
  name: string
  chain: string
  suburb: string
  state: string
  postcode: string
  address: string | null
}

interface Props {
  onSelect: (store: Store) => void
  selectedStoreId?: string | null
  initialPostcode?: string
}

const CHAIN_COLOURS: Record<string, string> = {
  woolworths: 'bg-green-100 text-green-800',
  coles: 'bg-red-100 text-red-800',
  aldi: 'bg-blue-100 text-blue-800',
  iga: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

export default function StoreSelector({ onSelect, selectedStoreId, initialPostcode = '' }: Props) {
  const [postcode, setPostcode] = useState(initialPostcode)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function search() {
    if (!/^\d{4}$/.test(postcode)) {
      setError('Please enter a valid 4-digit Australian postcode')
      return
    }
    setError('')
    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/stores?postcode=${postcode}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setStores(data.stores ?? [])
    } catch {
      setError('Failed to load stores. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Enter postcode (e.g. 2000)"
            maxLength={4}
            inputMode="numeric"
            className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="bg-brand-500 text-white px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-1 min-h-[44px]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-3">{error}</p>
      )}

      {/* Results */}
      {searched && !loading && stores.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          No stores found for postcode {postcode}
        </p>
      )}

      {stores.length > 0 && (
        <div className="space-y-2">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => onSelect(store)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left min-h-[64px] transition-all ${
                store.id === selectedStoreId
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 truncate">{store.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHAIN_COLOURS[store.chain] ?? CHAIN_COLOURS.other}`}>
                    {store.chain}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {store.suburb}, {store.state} {store.postcode}
                  {store.address && ` · ${store.address}`}
                </div>
              </div>
              {store.id === selectedStoreId && (
                <Check className="w-5 h-5 text-brand-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
