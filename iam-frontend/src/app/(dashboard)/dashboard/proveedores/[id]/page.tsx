import { requireAuth } from '@/lib/ssrAuth'
import ProveedorDetalleClient from './ProveedorDetalleClient'

export default async function ProveedorDetallePage() {
  const user = await requireAuth()
  if (!user) return null
  return <ProveedorDetalleClient />
} 