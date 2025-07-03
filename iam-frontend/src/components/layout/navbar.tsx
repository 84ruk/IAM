'use client'

import { LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { User } from '@/types/user'

const ROL_MAP: Record<string, string> = {
  SUPERADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  EMPLEADO: 'Empleado',
  PROVEEDOR: 'Proveedor',
}

export default function Navbar({ user, logout }: { user: User, logout?: () => void }) {
  const isAdmin = user?.rol === 'ADMIN' || user?.rol === 'SUPERADMIN'

  return (
    <header className="w-full px-6 py-4 bg-white shadow-sm flex items-center justify-between border-b border-gray-100">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">
          Hola, {user?.email?.split('@')[0] || 'Usuario'} 👋
        </h1>
        <p className="text-sm text-gray-500">
          Rol actual: <strong>{ROL_MAP[user?.rol] ?? 'Desconocido'}</strong>
        </p>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/users"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#8E94F2] bg-[#8E94F2]/10 hover:bg-[#8E94F2]/20 transition rounded-xl"
            >
              <Settings size={16} />
              Administración
            </Link>
          )}
          {logout && (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#8E94F2] hover:bg-[#7278e0] transition rounded-xl"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          )}
        </div>
      )}
    </header>
  )
}
