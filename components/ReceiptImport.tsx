'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Loader2, Check, X, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ParsedReceipt, ParsedReceiptItem } from '@/lib/claude'

interface Props {
  householdId: string
  onImported?: (receiptId: string) => void
}

type Step = 'capture' | 'processing' | 'review' | 'saving' | 'done'

export default function ReceiptImport({ householdId, onImported }: Props) {
  const [step, setStep] = useState<Step>('capture')
  const [preview, setPreview] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [progress, setProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  async function processImage(file: File) {
    setStep('processing')
    setProgress('Reading image...')

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Convert to base64 for API
    const base64 = await fileToBase64(file)
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

    setProgress('Sending to Claude for parsing...')

    try {
      const res = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Parse failed')
      }

      const data = await res.json()
      setParsed(data.receipt)
      // Pre-select all items
      setSelectedItems(new Set(data.receipt.items.map((_: unknown, i: number) => i)))
      setStep('review')
    } catch (err: unknown) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to parse receipt')
      setStep('capture')
    }
  }

  async function saveReceipt() {
    if (!parsed) return
    setStep('saving')

    const selectedItemsList = parsed.items.filter((_, i) => selectedItems.has(i))

    try {
      const res = await fetch('/api/parse-receipt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          receipt: { ...parsed, items: selectedItemsList },
        }),
      })

      if (!res.ok) throw new Error('Failed to save receipt')
      const data = await res.json()
      setStep('done')
      onImported?.(data.receiptId)
      toast.success(`Receipt saved! ${selectedItemsList.length} items imported.`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
      setStep('review')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  function toggleItem(idx: number) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (step === 'capture') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-900">Import Receipt</h2>
        <p className="text-sm text-gray-500">
          Take a photo or upload a receipt image. Claude will extract all items and prices automatically.
        </p>

        {/* Camera */}
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex items-center gap-3 bg-brand-500 text-white rounded-2xl p-4 min-h-[64px]"
        >
          <Camera className="w-6 h-6 flex-shrink-0" />
          <div className="text-left">
            <div className="font-semibold">Take Photo</div>
            <div className="text-xs opacity-80">Use your camera</div>
          </div>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </button>

        {/* File upload */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-3 bg-gray-100 text-gray-900 rounded-2xl p-4 min-h-[64px]"
        >
          <Upload className="w-6 h-6 flex-shrink-0" />
          <div className="text-left">
            <div className="font-semibold">Upload Image</div>
            <div className="text-xs text-gray-500">JPG, PNG, HEIC</div>
          </div>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </button>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center py-12 gap-4">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Receipt" className="w-32 h-40 object-cover rounded-xl opacity-60" />
        )}
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-gray-600 font-medium">{progress}</p>
        <p className="text-xs text-gray-400">This usually takes 5–10 seconds</p>
      </div>
    )
  }

  if (step === 'review' && parsed) {
    return (
      <div>
        {/* Store info */}
        <div className="bg-brand-50 rounded-xl p-3 mb-4">
          <div className="font-semibold text-brand-900">{parsed.store_name}</div>
          <div className="text-sm text-brand-700">
            {parsed.purchase_date ?? 'Date unknown'} · Total: ${parsed.total.toFixed(2)}
          </div>
        </div>

        {/* Select all */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">
            {selectedItems.size} of {parsed.items.length} items selected
          </span>
          <button
            onClick={() => {
              if (selectedItems.size === parsed.items.length) {
                setSelectedItems(new Set())
              } else {
                setSelectedItems(new Set(parsed.items.map((_, i) => i)))
              }
            }}
            className="text-sm text-brand-600 font-medium"
          >
            {selectedItems.size === parsed.items.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {/* Items list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          {parsed.items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toggleItem(idx)}
              className={`w-full flex items-center px-4 py-3 text-left ${
                idx < parsed.items.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border-2 mr-3 flex-shrink-0 ${
                  selectedItems.has(idx)
                    ? 'bg-brand-500 border-brand-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedItems.has(idx) && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                <div className="text-xs text-gray-400">
                  {item.quantity !== 1 && `${item.quantity} × `}${item.unit_price.toFixed(2)} · {item.category}
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700 ml-2">
                ${item.total_price.toFixed(2)}
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => { setStep('capture'); setParsed(null); setPreview(null) }}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 min-h-[44px]"
          >
            Retake
          </button>
          <button
            onClick={saveReceipt}
            disabled={selectedItems.size === 0}
            className="flex-1 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 min-h-[44px]"
          >
            Import {selectedItems.size} Items
          </button>
        </div>
      </div>
    )
  }

  if (step === 'saving') {
    return (
      <div className="flex flex-col items-center py-12 gap-4">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-gray-600 font-medium">Saving receipt...</p>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center py-12 gap-4">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-brand-600" />
        </div>
        <p className="text-lg font-semibold text-gray-900">Receipt imported!</p>
        <button
          onClick={() => { setStep('capture'); setParsed(null); setPreview(null) }}
          className="text-brand-600 text-sm font-medium"
        >
          Import another receipt
        </button>
      </div>
    )
  }

  return null
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip data URL prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
