'use client'

import { useUserContext } from '@/context/UserProvider'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
  }).then(res => {
    if (!res.ok) throw new Error('Error al obtener datos')
    return res.json()
  })

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUserContext()
  const { data: kpis, isLoading: kpisLoading } = useSWR('/dashboard/kpis', fetcher)

  if (userLoading || kpisLoading) {
    return (
      <div className="p-4 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm space-y-2">
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
              <div className="h-6 w-2/3 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Panel de control</h1>
      <p className="text-base text-gray-600 mb-6">Bienvenido, {user?.nombre || user?.email}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-sm text-gray-500 mb-1">Productos activos</h2>
          <p className="text-xl font-semibold text-gray-800">{kpis?.productosActivos ?? '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-sm text-gray-500 mb-1">Movimientos este mes</h2>
          <p className="text-xl font-semibold text-gray-800">{kpis?.movimientosMes ?? '-'}</p>
        </div>
      </div>
    </div>
  )
}
