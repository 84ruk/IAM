'use client'

import { useUser } from '@/lib/useUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { data: user, error, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login')
    }
  }, [user, isLoading])

  if (!user) return <p className="text-center mt-10">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bienvenido, {user.email}</h1>
      <p>Tu rol: <strong>{user.rol}</strong></p>
    </div>
  )
}
