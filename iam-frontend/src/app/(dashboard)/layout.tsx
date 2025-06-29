// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { requireAuth } from '@/lib/ssrAuth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  if (!user) {
    redirect('/login');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
