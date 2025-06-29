'use client'

import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/layout'
import { useState } from 'react'
import { Menu } from 'lucide-react'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          <button
            className="mr-3 text-gray-700 hover:text-[#8E94F2] focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-7 h-7" />
          </button>
          <span className="text-lg font-semibold text-[#8E94F2]">IAM</span>
        </div>
        <Navbar />
        <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB]">
          {children}
        </main>
      </div>
    </div>
  )
} 