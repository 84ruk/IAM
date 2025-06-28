import { requireAuth } from '@/lib/ssrAuth'
import MovimientosEliminadosClient from './MovimientosEliminadosClient'

export default async function MovimientosEliminadosPage() {
  const user = await requireAuth()
  if (!user) return null
  
  return <MovimientosEliminadosClient />
} 