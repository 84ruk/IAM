import { requireAuth } from '@/lib/ssrAuth'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await requireAuth()
  if (!user) return null

  return <DashboardClient />
}
