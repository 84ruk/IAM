// src/app/(dashboard)/layout.tsx
'use client'

import { SWRConfig } from 'swr'
import { UserProvider } from '@/context/UserProvider'
import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/layout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 60000  }}> 
      <UserProvider>
        <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto px-4 py-6 bg-white rounded-tl-3xl shadow-inner">
              {children}
            </main>
          </div>
        </div>
      </UserProvider>
    </SWRConfig>
  )
}
