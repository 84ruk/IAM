// src/app/(super-admin)/layout.tsx (server component)
import { requireAuth, mapUserFromBackend } from '@/lib/ssrAuth'
import { redirect } from 'next/navigation'
import { User } from '@/types/user'
import SuperAdminShell from '@/components/layout/SuperAdminShell';
const ALLOWED_ROLES: User['rol'][] = ['SUPERADMIN']

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const userFromBackend = await requireAuth();
  if (!userFromBackend) redirect('/login');
  if (!ALLOWED_ROLES.includes(userFromBackend.rol)) redirect('/dashboard');

  // Mapear el usuario del backend al formato del frontend
  const user = mapUserFromBackend(userFromBackend);

  return <SuperAdminShell user={user}>{children}</SuperAdminShell>
} 