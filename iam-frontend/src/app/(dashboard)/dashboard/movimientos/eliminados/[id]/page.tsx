import { requireAuth } from '@/lib/ssrAuth'
import MovimientoEliminadoDetalleClient from './MovimientoEliminadoDetalleClient'

export default async function MovimientoEliminadoDetallePage() {
  const user = await requireAuth()
  if (!user) return null
  
  return <MovimientoEliminadoDetalleClient />
} 