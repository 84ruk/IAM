import { requireAuth } from '@/lib/ssrAuth'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireAuth()
  if (!user) return null

  return <DashboardClient />
}
