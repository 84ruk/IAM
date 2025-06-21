'use client'

import { useUserContext } from '@/context/UserProvider'
import useSWR from 'swr'
import { useCallback } from 'react'

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUserContext()

  const fetcher = useCallback((url: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(res => {
      if (!res.ok) throw new Error('Error al obtener datos')
      return res.json()
    }), []
  )

  const { data: kpis, isLoading: kpisLoading, error } = useSWR(
    user ? `/dashboard/stock-chart` : null,
    fetcher,
    {
      revalidateOnFocus: false, // No revalida al volver a la pestaña
      dedupingInterval: 60000,  // No repite la petición en 60s
    }
  )

  if (userLoading || kpisLoading) {
    // ... loading UI ...
    return <div className="p-4 text-gray-500">Cargando...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error al cargar los datos.</div>
  }
  

  // ... resto del componente ...
}
