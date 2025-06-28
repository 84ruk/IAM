import { requireAuth } from '@/lib/ssrAuth'
import NuevoProductoClient from './NuevoProductoClient'
import { redirect } from 'next/navigation'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NuevoProductoPage() {
  const user = await requireAuth()
  
  if (!user) {
    redirect('/login')
  }
  
  return <NuevoProductoClient />
}
