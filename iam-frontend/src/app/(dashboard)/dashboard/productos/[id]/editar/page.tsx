import { requireAuth } from '@/lib/ssrAuth'
import EditarProductoClient from './EditarProductoClient'
import { redirect } from 'next/navigation'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EditarProductoPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  
  if (!user) {
    redirect('/login')
  }

  return <EditarProductoClient id={params.id} />
}
