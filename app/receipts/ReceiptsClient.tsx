'use client'

import { useState } from 'react'
import ReceiptImport from '@/components/ReceiptImport'
import BottomNav from '@/components/BottomNav'

interface Receipt {
  id: string
  store_name: string
  purchase_date: string
  total: number
  created_at: string
  parsed_json: {
    items: Array<{ name: string; quantity: number; unit_price: number; total_price: number; category: string }>
  } | null
}

interface ReceiptsClientProps {
  initialReceipts: Receipt[]
  householdId: string
}

export default function ReceiptsClient({ initialReceipts, householdId }: ReceiptsClientProps) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts)
  const [expanded, setExpanded] = useState<string | null>(null)

  const handleReceiptImported = (newReceipt: Receipt) => {
    setReceipts(prev => [newReceipt, ...prev])
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Receipts</h1>

        <ReceiptImport householdId={householdId} onImported={handleReceiptImported} />

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">Receipt History</h2>
          {receipts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No receipts yet. Import one above.</p>
          ) : (
            <div className="space-y-3">
              {receipts.map(receipt => (
                <div key={receipt.id} className="bg-gray-900 rounded-xl overflow-hidden">
                  <button
                    className="w-full px-4 py-4 flex items-center justify-between text-left"
                    onClick={() => setExpanded(expanded === receipt.id ? null : receipt.id)}
                  >
                    <div>
                      <p className="font-medium">{receipt.store_name || 'Unknown Store'}</p>
                      <p className="text-sm text-gray-400">
                        {receipt.purchase_date
                          ? new Date(receipt.purchase_date).toLocaleDateString('en-AU', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })
                          : new Date(receipt.created_at).toLocaleDateString('en-AU', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-semibold">
                        ${receipt.total?.toFixed(2) ?? '—'}
                      </span>
                      <span className="text-gray-500 text-sm">{expanded === receipt.id ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {expanded === receipt.id && receipt.parsed_json?.items && (
                    <div className="px-4 pb-4 border-t border-gray-800">
                      <table className="w-full text-sm mt-3">
                        <thead>
                          <tr className="text-gray-500 text-xs uppercase">
                            <th className="text-left py-1">Item</th>
                            <th className="text-right py-1">Qty</th>
                            <th className="text-right py-1">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receipt.parsed_json.items.map((item, i) => (
                            <tr key={i} className="border-t border-gray-800/50">
                              <td className="py-1.5 text-gray-200">{item.name}</td>
                              <td className="text-right text-gray-400">{item.quantity}</td>
                              <td className="text-right text-gray-200">${item.unit_price?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav active="receipts" />
    </div>
  )
}
