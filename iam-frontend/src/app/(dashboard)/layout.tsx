// src/app/(dashboard)/layout.tsx
'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/layout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB]">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
