import { requireAuth } from '@/lib/ssrAuth'
import ProductosEliminadosClient from './ProductosEliminadosClient'

export default async function ProductosEliminadosPage() {
  const user = await requireAuth()
  if (!user) return null
  return <ProductosEliminadosClient />
} 