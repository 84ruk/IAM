// src/app/(dashboard)/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  let user = null;
  if (token) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Cookie: `jwt=${token}` },
      credentials: 'include',
      cache: 'no-store',
    });
    if (res.ok) {
      user = await res.json();
    }
  }

  if (!user) {
    redirect('/login');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
