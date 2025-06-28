import { requireAuth } from '@/lib/ssrAuth'
import MarketingClient from './MarketingClient'

export default async function MarketingDemoPage() {
  const user = await requireAuth()
  if (!user) return null
  return <MarketingClient />
} 