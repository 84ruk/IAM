// src/app/(dashboard)/layout.tsx
<<<<<<< HEAD
'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
=======
import { redirect } from 'next/navigation'
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81
import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/layout'
import { requireAuth } from '@/lib/ssrAuth'

<<<<<<< HEAD
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
=======
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const user = await requireAuth()
    if (!user) {
      console.log('No user found, redirecting to login')
      redirect('/login')
    }

    return (
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81
      <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB]">
            {children}
          </main>
        </div>
      </div>
<<<<<<< HEAD
    </ProtectedRoute>
  )
=======
    )
  } catch (error) {
    console.error('Error in dashboard layout:', error)
    redirect('/login')
  }
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81
}
