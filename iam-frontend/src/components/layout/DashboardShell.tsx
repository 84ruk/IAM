'use client'

import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/layout'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { User } from '@/types/user'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardShell({ children, user }: { children: React.ReactNode, user: User }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { logout } = useAuth()

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevenir scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }

    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('sidebar-open')
    }
  }, [sidebarOpen])

  // ✅ MEJORADO: Función de logout optimizada
  const handleLogout = async () => {
    try {
      console.log('🔐 Dashboard: Iniciando logout...')
      await logout()
      // El logout ya maneja la redirección internamente
    } catch (error) {
      console.error('❌ Dashboard: Error en logout:', error)
      // Fallback: redirección manual
      window.location.href = '/login'
    }
  }

  // Evitar renderizado hasta que el componente esté montado en el cliente
  if (!mounted) {
    return (
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
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
      {/* Sidebar móvil */}
      <div className={sidebarOpen ? 'fixed inset-0 z-50 lg:hidden' : 'hidden'}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar user={user} isOpen={false} />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar user={user} logout={handleLogout} />
        
        {/* Contenido */}
        <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB]">
          {children}
        </main>
      </div>

      {/* Botón de menú móvil */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-[#8E94F2] text-white rounded-full shadow-lg hover:bg-[#7278e0] transition menu-button-mobile"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>
    </div>
  )
} 