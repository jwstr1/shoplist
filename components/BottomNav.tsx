'use client'

import Link from 'next/link'
import { ShoppingCart, Clock, Camera, Settings } from 'lucide-react'

type NavItem = 'list' | 'history' | 'receipts' | 'settings'

const NAV_ITEMS: { id: NavItem; label: string; href: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'list', label: 'List', href: '/list', Icon: ShoppingCart },
  { id: 'history', label: 'History', href: '/history', Icon: Clock },
  { id: 'receipts', label: 'Receipts', href: '/receipts', Icon: Camera },
  { id: 'settings', label: 'Settings', href: '/settings', Icon: Settings },
]

export default function BottomNav({ active }: { active: NavItem }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-gray-950/95 backdrop-blur-xl border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex max-w-lg mx-auto">
        {NAV_ITEMS.map(({ id, label, href, Icon }) => (
          <Link
            key={id}
            href={href}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all press-effect touch-target ${
              active === id
                ? 'text-emerald-400'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <div className={`relative ${active === id ? 'after:absolute after:-inset-2 after:bg-emerald-500/10 after:rounded-xl' : ''}`}>
              <Icon className={`w-5 h-5 transition-transform ${active === id ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide ${active === id ? 'text-emerald-400' : 'text-gray-600'}`}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
