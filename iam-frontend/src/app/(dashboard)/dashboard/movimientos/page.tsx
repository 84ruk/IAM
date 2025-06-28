// src/app/dashboard/movimientos/page.tsx
import { requireAuth } from '@/lib/ssrAuth'
import MovimientosClient from './MovimientosClient'

export default async function MovimientosPage() {
  const user = await requireAuth()
  if (!user) return null

  return <MovimientosClient />
}
