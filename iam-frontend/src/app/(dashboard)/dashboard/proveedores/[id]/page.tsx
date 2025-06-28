import { requireAuth } from '@/lib/ssrAuth'
import ProveedorDetalleClient from './ProveedorDetalleClient'
import { redirect } from 'next/navigation'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProveedorDetallePage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  
  if (!user) {
    redirect('/login')
  }

  return <ProveedorDetalleClient id={params.id} />
} 