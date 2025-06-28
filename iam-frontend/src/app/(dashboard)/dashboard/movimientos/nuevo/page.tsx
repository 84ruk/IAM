// src/app/dashboard/movimientos/nuevo/page.tsx
import { requireAuth } from '@/lib/ssrAuth'
import NuevoMovimientoClient from './NuevoMovimientoClient'
import { redirect } from 'next/navigation'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NuevoMovimientoPage() {
  const user = await requireAuth()
  
  if (!user) {
    redirect('/login')
  }

  return <NuevoMovimientoClient />
}
