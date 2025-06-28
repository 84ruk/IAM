// dashboard/productos/page.tsx
import ProductosClient from './ProductosClient'
import { requireAuth } from '@/lib/ssrAuth'
import { redirect } from 'next/navigation'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductosPage() {
  const user = await requireAuth()
  
  if (!user) {
    redirect('/login')
  }

  return <ProductosClient />
}
