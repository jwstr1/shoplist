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
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex">
        {NAV_ITEMS.map(({ id, label, href, Icon }) => (
          <Link
            key={id}
            href={href}
            className={`flex-1 flex flex-col items-center pt-2 pb-1 min-h-[44px] transition-colors ${
              active === id ? 'text-brand-600' : 'text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
