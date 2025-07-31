// src/app/layout.tsx
import './globals.css'
import { montserrat } from './fonts'
import { ReactNode } from 'react'

import { BackendStatus } from '@/components/ui/BackendStatus'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/lib/error-boundary'
import { initializeAppConfig } from '@/lib/app-config'
import AppInitializer from '@/components/ui/AppInitializer'
import { ServerStatusProvider } from '@/context/ServerStatusContext'
import ServerStatusBar from '@/components/layout/ServerStatusBar'

export default function RootLayout({ children }: { children: ReactNode }) {
  // Inicializar configuración de la aplicación
  if (typeof window !== 'undefined') {
    initializeAppConfig()
  }
  
  return (
    <html lang="es">
      <head>
        <title>IAM - Inventario Inteligente</title>
        <meta name="description" content="Plataforma inteligente de gestión de inventario para PYMEs" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={`${montserrat.className} bg-gray-50 antialiased text-gray-800`}>
        <ErrorBoundary>
          <ServerStatusProvider>
            <AppInitializer>
              <BackendStatus>
                {children}
                <ServerStatusBar />
              </BackendStatus>
            </AppInitializer>
          </ServerStatusProvider>
        </ErrorBoundary>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  )
}
