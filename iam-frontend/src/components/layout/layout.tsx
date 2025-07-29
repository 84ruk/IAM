'use client'

import { BarChart2, Home, Package, Truck, X, TrendingUp, Shield, Activity, Upload } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { User } from '@/types/user'

// Definir navegación con control de acceso
const getNavItems = (user: User | null) => {
  const baseItems = [
    { href: '/dashboard', label: 'Inicio', icon: <Home size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'] },
    { href: '/dashboard/productos', label: 'Productos', icon: <Package size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'] },
    { href: '/dashboard/movimientos', label: 'Movimientos', icon: <BarChart2 size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'] },
    { href: '/dashboard/daily-movements', label: 'Movimientos Diarios', icon: <Activity size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'] },
    { href: '/dashboard/proveedores', label: 'Proveedores', icon: <Truck size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'] },
    { href: '/dashboard/kpis', label: 'KPIs', icon: <TrendingUp size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'] },
    { href: '/dashboard/importacion-avanzada', label: 'Importación de Datos', icon: <Upload size={18} />, roles: ['SUPERADMIN', 'ADMIN'] },
  ]

  // Agregar enlaces de admin solo para usuarios autorizados
  if (user && ['SUPERADMIN', 'ADMIN'].includes(user.rol)) {
    baseItems.push({
      href: '/admin/users',
      label: 'Administración',
      icon: <Shield size={18} />,
      roles: ['SUPERADMIN', 'ADMIN']
    })
  }

  // Filtrar items según el rol del usuario
  return baseItems.filter(item => 
    user && item.roles.includes(user.rol)
  )
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  user?: User | null
}

export default function Sidebar({ isOpen = false, onClose, user }: SidebarProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Obtener items de navegación filtrados por rol
  const navItems = getNavItems(user || null)

  // Sidebar para escritorio
  const sidebarContent = (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#8E94F2]">IAM</h2>
      <nav className="space-y-1">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
              text-sm font-medium
              ${mounted && pathname === href
                ? 'bg-[#8E94F2] text-white'
                : 'text-gray-700 hover:bg-gray-100'}
            `}
            onClick={onClose}
          >
            {icon}
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      {/* Sidebar escritorio */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen hidden md:flex flex-col justify-between py-6 shadow-sm">
        {sidebarContent}
        <div className="text-xs text-gray-400 px-3">v2.0 - Agosto 2025</div>
      </aside>
      {/* Sidebar móvil (overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Fondo semitransparente con animación */}
          <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-300 ease-in-out" onClick={onClose}></div>
          {/* Panel lateral con animación */}
          <aside className={
            `relative w-64 bg-white h-full flex flex-col justify-between py-6 shadow-lg z-50 
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} animate-slide-in-left`
          }>
            {/* Botón cerrar */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <X className="w-6 h-6" />
            </button>
            {sidebarContent}
            <div className="text-xs text-gray-400 px-3">v2.0 - Agosto 2025</div>
          </aside>
        </div>
      )}
    </>
  )
}
