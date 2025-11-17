'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Package,
  Tags,
  Folders,
  Search,
  Home,
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Objects', href: '/objects', icon: Package },
  { name: 'Collections', href: '/collections', icon: Folders },
  { name: 'Tags', href: '/tags', icon: Tags },
  { name: 'Queries', href: '/queries', icon: Search },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-4">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
