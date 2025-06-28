import { requireAuth } from '@/lib/ssrAuth'
import ProveedoresEliminadosClient from './ProveedoresEliminadosClient'

export const dynamic = 'force-dynamic'

export default async function ProveedoresEliminadosPage() {
  const user = await requireAuth()
  if (!user) return null
  
  return <ProveedoresEliminadosClient />
} 