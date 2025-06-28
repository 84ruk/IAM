import { requireAuth } from '@/lib/ssrAuth'
import ProveedorDetalleClient from './ProveedorDetalleClient'

export const dynamic = 'force-dynamic'

export default async function ProveedorDetallePage() {
  const user = await requireAuth()
  if (!user) return null

  return <ProveedorDetalleClient />
} 