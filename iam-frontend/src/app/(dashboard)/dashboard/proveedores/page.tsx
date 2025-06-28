import { requireAuth } from '@/lib/ssrAuth'
import ProveedoresClient from './ProveedoresClient'

export const dynamic = 'force-dynamic'

export default async function ProveedoresPage() {
  const user = await requireAuth()
  if (!user) return null
  return <ProveedoresClient />
} 