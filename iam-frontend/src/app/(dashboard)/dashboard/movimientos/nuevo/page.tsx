// src/app/dashboard/movimientos/nuevo/page.tsx
import { requireAuth } from '@/lib/ssrAuth'
import NuevoMovimientoClient from './NuevoMovimientoClient'

export default async function NuevoMovimientoPage() {
  const user = await requireAuth()
  if (!user) return null

  return <NuevoMovimientoClient />
}
