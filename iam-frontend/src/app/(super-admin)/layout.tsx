// src/app/(super-admin)/layout.tsx (server component)
import { requireAuth } from '@/lib/ssrAuth'
import { redirect } from 'next/navigation'
import { User } from '@/types/user'
import SuperAdminShell from '@/components/layout/SuperAdminShell';
const ALLOWED_ROLES: User['rol'][] = ['SUPERADMIN']

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  if (!user) redirect('/login');
  if (!ALLOWED_ROLES.includes(user.rol)) redirect('/dashboard');

  return <SuperAdminShell user={user}>{children}</SuperAdminShell>
} 