// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { requireAuth, mapUserFromBackend } from '@/lib/ssrAuth'
import { AppProvider } from '@/context/AppProvider'
import { Suspense } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import AppInitializer from '@/components/ui/AppInitializer'
import ServerStatusBar from '@/components/layout/ServerStatusBar'
import AutoSetupRedirect from '@/components/ui/AutoSetupRedirect'

// Lazy load components para mejorar el rendimiento
const DashboardSkeleton = () => (
  <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="md:hidden flex items-center px-3 py-2 bg-white border-b border-gray-100 shadow-sm">
        <div className="mr-2 w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="text-base font-semibold text-[#8E94F2]">IAM</div>
      </div>
      <div className="hidden md:block px-3 sm:px-6 py-3 sm:py-4 bg-white shadow-sm border-b border-gray-100">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB]">
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
      </main>
    </div>
  </div>
)

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userFromBackend = await requireAuth();

  if (!userFromBackend) {
    redirect('/login');
  }

  // Mapear el usuario del backend al formato del frontend
  const user = mapUserFromBackend(userFromBackend);

  return (
    <AppProvider user={user}>
      <Suspense fallback={<DashboardSkeleton />}>
        <AppInitializer>
          <AutoSetupRedirect>
            <DashboardShell user={user}>
              {children}
            </DashboardShell>
          </AutoSetupRedirect>
        </AppInitializer>
      </Suspense>
      <Suspense fallback={null}>
        <ServerStatusBar />
      </Suspense>
    </AppProvider>
  );
}
