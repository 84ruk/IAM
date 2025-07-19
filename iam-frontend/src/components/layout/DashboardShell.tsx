'use client'

import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/layout'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { User } from '@/types/user'
import { useSetupCheck } from '@/hooks/useSetupCheck'
import SetupRequired from '@/components/setup/SetupRequired'
import { useSetup } from '@/context/SetupContext'

export default function DashboardShell({ children, user }: { children: React.ReactNode, user: User }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { needsSetup, isLoading, error } = useSetupCheck()
  const { redirectToSetup } = useSetup()

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Implementar logout simple (puedes mejorarlo según tu backend)
  const logout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  };

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

  // Mostrar loading mientras se verifica setup
  if (isLoading) {
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
          <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verificando configuración...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Mostrar error si hay problema verificando setup
  if (error) {
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
          <main className="flex-1 overflow-y-auto shadow-sm bg-[#F8F9FB] flex items-center justify-center">
            <div className="text-center">
              <div className="bg-red-50 rounded-full p-4 mb-4 mx-auto w-fit">
                <div className="w-8 h-8 text-red-600">⚠️</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error de configuración</h3>
              <p className="text-gray-600 mb-4 max-w-md">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Si necesita setup, mostrar mensaje contextual
  if (needsSetup) {
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
            <SetupRequired 
              title="Bienvenido a IAM"
              description="Para comenzar a usar el sistema, necesitas configurar la información de tu empresa. Esto te permitirá gestionar productos, inventario y más."
              className="h-full"
            />
          </main>
        </div>
      </div>
    )
  }

  // Renderizado normal cuando todo está configurado
  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
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