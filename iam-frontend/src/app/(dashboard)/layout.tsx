// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { requireAuth, mapUserFromBackend } from '@/lib/ssrAuth'
import { UserContextProvider } from '@/context/ServerUserContext'
import { SetupProvider } from '@/context/SetupContext'
import { ImportacionGlobalProvider } from '@/context/ImportacionGlobalContext'
import { WebSocketProvider } from '@/context/WebSocketContext'
import { ToastProvider } from '@/components/ui/Toast'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userFromBackend = await requireAuth();

  if (!userFromBackend) {
    redirect('/login');
  }

  // Mapear el usuario del backend al formato del frontend
  const user = mapUserFromBackend(userFromBackend);

  return (
    <UserContextProvider user={user}>
      <SetupProvider>
        <ImportacionGlobalProvider>
          <WebSocketProvider>
            <ToastProvider>
              <DashboardShell user={user}>
                {children}
              </DashboardShell>
            </ToastProvider>
          </WebSocketProvider>
        </ImportacionGlobalProvider>
      </SetupProvider>
    </UserContextProvider>
  );
}
