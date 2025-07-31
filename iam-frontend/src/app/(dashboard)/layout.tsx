// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { requireAuth, mapUserFromBackend } from '@/lib/ssrAuth'
import { UserContextProvider } from '@/context/ServerUserContext'
import { SetupProvider } from '@/context/SetupContext'
import { ServerStatusProvider } from '@/context/ServerStatusContext'
import { ToastProvider } from '@/components/ui/Toast'
import DashboardShell from '@/components/layout/DashboardShell'
import AppInitializer from '@/components/ui/AppInitializer'
import ServerStatusBar from '@/components/layout/ServerStatusBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userFromBackend = await requireAuth();

  if (!userFromBackend) {
    redirect('/login');
  }

  // Mapear el usuario del backend al formato del frontend
  const user = mapUserFromBackend(userFromBackend);

  return (
    <ServerStatusProvider>
      <AppInitializer>
        <UserContextProvider user={user}>
          <SetupProvider>
            <ToastProvider>
              <DashboardShell user={user}>
                {children}
              </DashboardShell>
              <ServerStatusBar />
            </ToastProvider>
          </SetupProvider>
        </UserContextProvider>
      </AppInitializer>
    </ServerStatusProvider>
  );
}
