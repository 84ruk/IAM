'use client'

import { BarChart2, Home, Package, Truck, X, TrendingUp, Shield, Activity, Upload, MapPin, Radio, Bell, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { User } from '@/types/user'

// Definir navegación con control de acceso
const getNavItems = (user: User | null) => {
  const baseItems = [
    { href: '/dashboard', label: 'Inicio', icon: <Home size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'], disabled: false },
    { href: '/dashboard/productos', label: 'Productos', icon: <Package size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'], disabled: false },
    { href: '/dashboard/movimientos', label: 'Movimientos', icon: <BarChart2 size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'], disabled: false },
    { href: '/dashboard/daily-movements', label: 'Movimientos Diarios', icon: <Activity size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'], disabled: false },
    { href: '/dashboard/proveedores', label: 'Proveedores', icon: <Truck size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'], disabled: false },
    { href: '/dashboard/ubicaciones', label: 'Ubicaciones', icon: <MapPin size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'], disabled: false },
    { href: '/dashboard/sensores', label: 'Sensores', icon: <Radio size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'], disabled: false },
    { href: '/dashboard/alertas', label: 'Alertas', icon: <Bell size={18} />, roles: ['SUPERADMIN', 'ADMIN'], disabled: false },
    { href: '/dashboard/sms', label: 'SMS', icon: <MessageSquare size={18} />, roles: ['SUPERADMIN', 'ADMIN'], disabled: false },
    { href: '/dashboard/kpis', label: 'KPIs', icon: <TrendingUp size={18} />, roles: ['SUPERADMIN', 'ADMIN', 'EMPLEADO'], disabled: false },
    { href: '/dashboard/importacion-avanzada', label: 'Importación de Datos', icon: <Upload size={18} />, roles: ['SUPERADMIN', 'ADMIN'], disabled: true },
  ]

  // Agregar enlaces de admin solo para usuarios autorizados
  if (user && ['SUPERADMIN', 'ADMIN'].includes(user.rol)) {
    baseItems.push({
      href: '/admin/users',
      label: 'Administración',
      icon: <Shield size={18} />,
      roles: ['SUPERADMIN', 'ADMIN'],
      disabled: true
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
        {navItems.map(({ href, label, icon, disabled }) => (
          <div key={href}>
            {disabled ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
                {icon}
                <div className="flex-1">
                  <div>{label}</div>
                  <div className="text-xs text-gray-300">Próximamente</div>
                </div>
              </div>
            ) : (
              <Link
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
            )}
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      {/* Sidebar escritorio */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen hidden lg:flex flex-col justify-between py-6 shadow-sm">
        {sidebarContent}
        <div className="text-xs text-gray-400 px-3">v2.0 - Agosto 2025</div>
      </aside>
      
      {/* Sidebar móvil (overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden sidebar-mobile-overlay">
          {/* Fondo semitransparente */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 animate-fade-in" 
            onClick={onClose}
          />
          
          {/* Panel lateral */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl sidebar-mobile-panel animate-slide-in-left">
            {/* Header móvil con botón cerrar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-[#8E94F2]">IAM</h2>
              <button
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition sidebar-item"
                onClick={onClose}
                aria-label="Cerrar menú"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Contenido del sidebar */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-4">
                {navItems.map(({ href, label, icon, disabled }) => (
                  <div key={href}>
                    {disabled ? (
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed sidebar-item">
                        {icon}
                        <div className="flex-1">
                          <div>{label}</div>
                          <div className="text-xs text-gray-300">Próximamente</div>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition sidebar-item
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
                    )}
                  </div>
                ))}
              </nav>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="text-xs text-gray-400">v2.0 - Agosto 2025</div>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
