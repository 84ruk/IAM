import { requireAuth } from '@/lib/ssrAuth'
import PresentacionClient from './PresentacionClient'

export default async function PresentacionPage() {
  const user = await requireAuth()
  if (!user) return null
  return <PresentacionClient />
} 