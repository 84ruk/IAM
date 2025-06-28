import { requireAuth } from '@/lib/ssrAuth'
import MarketingClient from './MarketingClient'

export const dynamic = 'force-dynamic'

export default async function MarketingPage() {
  const user = await requireAuth()
  if (!user) return null

  return <MarketingClient />
} 