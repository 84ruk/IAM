import { requireAuth } from '@/lib/ssrAuth'
import EditarProductoClient from './EditarProductoClient'

export default async function EditarProductoPage() {
  const user = await requireAuth()
  if (!user) return null

  return <EditarProductoClient />
}
