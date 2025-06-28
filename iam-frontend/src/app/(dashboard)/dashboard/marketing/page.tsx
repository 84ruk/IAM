import { requireAuth } from '@/lib/ssrAuth'
import MarketingClient from './MarketingClient'
import { redirect } from 'next/navigation'

// Configurar para renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MarketingPage() {
  const user = await requireAuth()
  
  if (!user) {
    redirect('/login')
  }

  return <MarketingClient />
} 