import { requireAuth } from '@/lib/ssrAuth'
import ProductoDetalleClient from './ProductoDetalleClient'
import { redirect } from 'next/navigation'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductoDetallePage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  
  if (!user) {
    redirect('/login')
  }

  return <ProductoDetalleClient id={params.id} />
} 