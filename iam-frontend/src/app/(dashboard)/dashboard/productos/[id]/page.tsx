import { requireAuth } from '@/lib/ssrAuth'
import ProductoDetalleClient from './ProductoDetalleClient'

export const dynamic = 'force-dynamic'

export default async function ProductoDetallePage() {
  const user = await requireAuth()
  if (!user) return null

} 