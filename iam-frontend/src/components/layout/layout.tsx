
'use client'

import { BarChart2, Home, Package, Truck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: <Home size={18} /> },
  { href: '/dashboard/productos', label: 'Productos', icon: <Package size={18} /> },
  { href: '/dashboard/movimientos', label: 'Movimientos', icon: <BarChart2 size={18} /> },
  { href: '/dashboard/proveedores', label: 'Proveedores', icon: <Truck size={18} /> },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen hidden md:flex flex-col justify-between py-6 shadow-sm">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#8E94F2]">IAM</h2>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
                text-sm font-medium
                ${pathname === href
                  ? 'bg-[#8E94F2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'}
              `}
            >
              {icon}
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="text-xs text-gray-400 px-3">v1.0 - Junio 2025</div>
    </aside>
  )
}
