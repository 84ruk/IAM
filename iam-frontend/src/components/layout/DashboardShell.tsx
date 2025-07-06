'use client'

import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/layout'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { User } from '@/types/user'

export default function DashboardShell({ children, user }: { children: React.ReactNode, user: User }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter();

  // Implementar logout simple (puedes mejorarlo según tu backend)
  const logout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center px-3 py-2 bg-white border-b border-gray-100 shadow-sm">
          <button
            className="mr-2 text-gray-700 hover:text-[#8E94F2] focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-base font-semibold text-[#8E94F2]">IAM</span>
        </div>
        <Navbar user={user} logout={logout} />
        <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB]">
          {children}
        </main>
      </div>
    </div>
  )
} 