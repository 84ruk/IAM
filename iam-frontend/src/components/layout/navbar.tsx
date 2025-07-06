'use client'

import { LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { User } from '@/types/user'

const ROL_MAP: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLEADO: 'Empleado',
  PROVEEDOR: 'Proveedor',
}

export default function Navbar({ user, logout }: { user: User, logout?: () => void }) {
  const isAdmin = user?.rol === 'ADMIN' || user?.rol === 'SUPERADMIN'
  const userName = user?.email?.split('@')[0] || 'Usuario'

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
          {isAdmin && (
            <Link
              href="/admin/users"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm text-[#8E94F2] bg-[#8E94F2]/10 hover:bg-[#8E94F2]/20 transition rounded-xl whitespace-nowrap"
            >
              <Settings size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Administración</span>
              <span className="sm:hidden">Admin</span>
            </Link>
          )}
          {logout && (
            <button
              onClick={logout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm text-white bg-[#8E94F2] hover:bg-[#7278e0] transition rounded-xl whitespace-nowrap"
            >
              <LogOut size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden">Salir</span>
            </button>
          )}
        </div>
      )}
    </header>
  )
}
