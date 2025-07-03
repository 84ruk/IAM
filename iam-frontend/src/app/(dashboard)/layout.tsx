// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { requireAuth } from '@/lib/ssrAuth'
import { UserContextProvider } from '@/context/ServerUserContext'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  if (!user) {
    redirect('/login');
  }

  return (
    <UserContextProvider user={user}>
      <DashboardShell user={user}>{children}</DashboardShell>
    </UserContextProvider>
  );
}
