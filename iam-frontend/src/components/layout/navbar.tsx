'use client'

import { LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { User } from '@/types/user'
import { useState, useEffect } from 'react'

const ROL_MAP: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLEADO: 'Empleado',
  PROVEEDOR: 'Proveedor',
}

export default function Navbar({ user, logout }: { user: User, logout?: () => void }) {
  const [mounted, setMounted] = useState(false)
  const isAdmin = user?.rol === 'ADMIN' || user?.rol === 'SUPERADMIN'
  const userName = user?.email?.split('@')[0] || 'Usuario'

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Evitar renderizado hasta que el componente esté montado en el cliente
  if (!mounted) {
    return (
      <header className="w-full px-3 sm:px-6 py-3 sm:py-4 bg-white shadow-sm flex items-center justify-between border-b border-gray-100">
        <div className="min-w-0 flex-1">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-2">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </header>
    )
  }

  return (
    <header className="w-full px-3 sm:px-6 py-3 sm:py-4 bg-white shadow-sm flex items-center justify-between border-b border-gray-100">
      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
          Hola, {userName} 👋
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 truncate">
          Rol: <strong>{ROL_MAP[user?.rol] ?? 'Desconocido'}</strong>
        </p>
      </div>

      {user && (
        <div className="flex items-center gap-2 sm:gap-3 ml-2">
          
          {logout && (
            <button
              onClick={logout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm text-white bg-[#8E94F2] hover:bg-[#7278e0] transition rounded-xl whitespace-nowrap"
            >
              <LogOut size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          )}
        </div>
      )}
    </header>
  )
}
