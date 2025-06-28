import { requireAuth } from '@/lib/ssrAuth'
import EditarMovimientoClient from './EditarMovimientoClient'
import { redirect } from 'next/navigation'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EditarMovimientoPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  
  if (!user) {
    redirect('/login')
  }

  return <EditarMovimientoClient />
} 