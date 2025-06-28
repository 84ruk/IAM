import { requireAuth } from '@/lib/ssrAuth'
import MovimientoDetalleClient from './MovimientoDetalleClient'

export const dynamic = 'force-dynamic'

export default async function MovimientoDetallePage() {
  const user = await requireAuth()
  if (!user) return null
  
  return <MovimientoDetalleClient />
} 