// src/app/(dashboard)/layout.tsx
import { ReactNode } from 'react'
import Sidebar from '@/components/layout/layout'
import Navbar from '@/components/layout/navbar'


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
