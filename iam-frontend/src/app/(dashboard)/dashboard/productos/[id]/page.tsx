import { requireAuth } from '@/lib/ssrAuth'
import ProductoDetalleClient from './ProductoDetalleClient'

export default async function DetalleProductoPage() {
  const user = await requireAuth()
  if (!user) return null
  return <ProductoDetalleClient />
} 