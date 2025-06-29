// src/app/(admin)/layout.tsx (server component)
import { requireAuth } from '@/lib/ssrAuth'
import { redirect } from 'next/navigation'
import { User } from '@/types/user'
import AdminShell from '@/components/layout/AdminShell';

const ALLOWED_ROLES: User['rol'][] = ['SUPERADMIN', 'ADMIN']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  if (!user) redirect('/login');
  if (!ALLOWED_ROLES.includes(user.rol)) redirect('/dashboard');

  return <AdminShell user={user}>{children}</AdminShell>
}