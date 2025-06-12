'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/useUser'

export default function Navbar() {
  const { data: user, mutate } = useUser()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    mutate(null) // limpiar cache SWR
    router.push('/login')
  }

  return (
    <header className="w-full bg-white shadow-sm px-6 py-3 flex justify-between items-center border-b">
      <div className="text-[#8E94F2] font-semibold text-lg tracking-wide">
        IAM
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.nombre || user.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-[#8E94F2] hover:underline transition-all"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  )
}
