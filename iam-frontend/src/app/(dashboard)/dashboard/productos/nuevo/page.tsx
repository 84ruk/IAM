import { requireAuth } from '@/lib/ssrAuth'
import NuevoProductoClient from './NuevoProductoClient'

export default async function NuevoProductoPage() {
  const user = await requireAuth()
  if (!user) return null
  return <NuevoProductoClient />
}
