import { requireAuth } from '@/lib/ssrAuth'
import ProductosEliminadosClient from './ProductosEliminadosClient'

export const dynamic = 'force-dynamic'

export default async function ProductosEliminadosPage() {
  const user = await requireAuth()
  if (!user) return null
  return <ProductosEliminadosClient />
} 