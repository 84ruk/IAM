// src/app/(dashboard)/layout.tsx
'use client'

import { SWRConfig } from 'swr'
import { UserProvider } from '@/context/UserProvider'
import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/layout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ revalidateOnFocus: false }}>
      <UserProvider>
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <Navbar />
            {children}
          </div>
        </div>
      </UserProvider>
    </SWRConfig>
  )
}
