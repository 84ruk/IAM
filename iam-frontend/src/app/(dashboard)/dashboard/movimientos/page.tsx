// src/app/dashboard/movimientos/page.tsx
import MovimientosClient from './MovimientosClient'
import { requireAuth } from '@/lib/ssrAuth'
import { redirect } from 'next/navigation'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MovimientosPage() {
  const user = await requireAuth()
  
  if (!user) {
    redirect('/login')
  }

  return <MovimientosClient />
}
