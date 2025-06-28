// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/layout'
import { requireAuth } from '@/lib/ssrAuth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const user = await requireAuth()
    if (!user) {
      console.log('No user found, redirecting to login')
      redirect('/login')
    }

    return (
      <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB]">
            {children}
          </main>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in dashboard layout:', error)
    redirect('/login')
  }
}
