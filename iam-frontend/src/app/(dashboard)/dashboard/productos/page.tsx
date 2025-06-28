// dashboard/productos/page.tsx
import { requireAuth } from '@/lib/ssrAuth'
import ProductosClient from './ProductosClient'

export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
  const user = await requireAuth()
  if (!user) return null

  return <ProductosClient />
}
