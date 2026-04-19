'use client'

import { useState, useMemo } from 'react'
import BottomNav from '@/components/BottomNav'
import { format, parseISO, startOfMonth } from 'date-fns'
import { TrendingUp, ShoppingBag, Receipt } from 'lucide-react'

interface PurchaseRecord {
  product_name: string
  price: number | null
  quantity: number | null
  purchased_at: string
  stores: { name: string; chain: string } | null
}

interface ReceiptRecord {
  id: string
  store_name: string | null
  store_chain: string | null
  total: number | null
  purchase_date: string | null
  created_at: string
}

interface Props {
  history: PurchaseRecord[]
  receipts: ReceiptRecord[]
  householdId: string
}

type Tab = 'spending' | 'items' | 'receipts'

export default function HistoryClient({ history, receipts, householdId }: Props) {
  const [tab, setTab] = useState<Tab>('spending')
  const [searchTerm, setSearchTerm] = useState('')

  // Monthly spending totals
  const monthlySpending = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of history) {
      if (!r.price) continue
      const month = format(startOfMonth(parseISO(r.purchased_at)), 'MMM yyyy')
      map.set(month, (map.get(month) ?? 0) + r.price * (r.quantity ?? 1))
    }
    return Array.from(map.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-6)
  }, [history])

  const maxSpend = Math.max(...monthlySpending.map(([, v]) => v), 1)

  // Most bought items
  const topItems = useMemo(() => {
    const counts = new Map<string, { count: number; lastPrice: number | null; lastDate: string }>()
    for (const r of history) {
      const key = r.product_name.toLowerCase()
      const existing = counts.get(key)
      if (existing) {
        existing.count++
      } else {
        counts.set(key, { count: 1, lastPrice: r.price, lastDate: r.purchased_at })
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([name, stats]) => ({ name, ...stats }))
  }, [history])

  const filteredItems = topItems.filter((item) =>
    item.name.includes(searchTerm.toLowerCase())
  )

  // Total spend
  const totalSpend = history.reduce((acc, r) => acc + (r.price ?? 0) * (r.quantity ?? 1), 0)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
        <h1 className="text-lg font-bold text-gray-900">Purchase History</h1>
        <p className="text-xs text-gray-400">Last 6 months · ${totalSpend.toFixed(2)} total</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {(['spending', 'items', 'receipts'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize ${
              tab === t
                ? 'text-brand-600 border-b-2 border-brand-500'
                : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {/* SPENDING TAB */}
        {tab === 'spending' && (
          <div>
            {/* Bar chart */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
              <div className="flex items-end justify-between h-32 gap-2">
                {monthlySpending.map(([month, amount]) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">${Math.round(amount)}</span>
                    <div
                      className="w-full bg-brand-400 rounded-t-md"
                      style={{ height: `${(amount / maxSpend) * 80}px`, minHeight: '4px' }}
                    />
                    <span className="text-[10px] text-gray-400">{month.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent receipts */}
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Recent Receipts</h2>
            {receipts.slice(0, 5).map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-3 border border-gray-100 mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{r.store_name ?? 'Unknown Store'}</div>
                    <div className="text-xs text-gray-400">
                      {r.purchase_date ? format(parseISO(r.purchase_date), 'd MMM yyyy') : 'Date unknown'}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {r.total != null ? `$${r.total.toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ITEMS TAB */}
        {tab === 'items' && (
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.name}
                  className={`flex items-center px-4 py-3 ${idx < filteredItems.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 capitalize">{item.name}</div>
                    <div className="text-xs text-gray-400">
                      Bought {item.count}×
                      {item.lastDate && ` · last ${format(parseISO(item.lastDate), 'd MMM')}`}
                    </div>
                  </div>
                  {item.lastPrice && (
                    <span className="text-sm text-gray-600">${item.lastPrice.toFixed(2)}</span>
                  )}
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">No items found</div>
              )}
            </div>
          </div>
        )}

        {/* RECEIPTS TAB */}
        {tab === 'receipts' && (
          <div>
            {receipts.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No receipts yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Import receipts from the Receipts tab
                </p>
              </div>
            ) : (
              receipts.map((r) => (
                <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 mb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {r.store_name ?? 'Unknown Store'}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {r.store_chain ?? 'Other'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {r.purchase_date
                          ? format(parseISO(r.purchase_date), 'd MMMM yyyy')
                          : `Uploaded ${format(parseISO(r.created_at), 'd MMM')}`}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {r.total != null ? `$${r.total.toFixed(2)}` : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav active="history" />
    </div>
  )
}
