'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/useUser'
import { LogOut } from 'lucide-react'

const ROL_MAP: Record<string, string> = {
  ADMIN: 'Administrador',
  EMPLEADO: 'Empleado',
  PROVEEDOR: 'Proveedor',
}

export default function Navbar() {
  const { data: user, mutate } = useUser()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    mutate(null)
    router.push('/login')
  }

  return (
    <header className="w-full px-6 py-4 bg-white shadow-sm flex items-center justify-between border-b border-gray-100">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">
          Hola, {user?.nombre || user?.email?.split('@')[0] || 'Usuario'} 👋
        </h1>
        <p className="text-sm text-gray-500">
          Rol actual: <strong>{ROL_MAP[user?.rol] ?? 'Desconocido'}</strong>
        </p>
      </div>

      {user && (
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#8E94F2] hover:bg-[#7278e0] transition rounded-xl"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      )}
    </header>
  )
}
