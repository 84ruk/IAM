import { requireAuth } from '@/lib/ssrAuth'
import EditarMovimientoClient from './EditarMovimientoClient'

export default async function EditarMovimientoPage() {
  const user = await requireAuth()
  if (!user) return null
  
} 