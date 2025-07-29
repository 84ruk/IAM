// src/app/(admin)/layout.tsx (server component)
import { requireAuth, mapUserFromBackend } from '@/lib/ssrAuth'
import { redirect } from 'next/navigation'
import { User } from '@/types/user'
import AdminShell from '@/components/layout/AdminShell';

const ALLOWED_ROLES: User['rol'][] = ['SUPERADMIN', 'ADMIN']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userFromBackend = await requireAuth();
  if (!userFromBackend) redirect('/login');
  if (!ALLOWED_ROLES.includes(userFromBackend.rol)) redirect('/dashboard');

  // Mapear el usuario del backend al formato del frontend
  const user = mapUserFromBackend(userFromBackend);

  return <AdminShell user={user}>{children}</AdminShell>
}