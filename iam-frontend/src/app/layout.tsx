// src/app/layout.tsx
import './globals.css'
import { montserrat } from './fonts'
import { ReactNode } from 'react'
import { ErrorBoundary } from '@/lib/error-boundary'
import { SetupProvider } from '@/context/SetupContext'

export default function RootLayout({ children }: { children: ReactNode }) {
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
          <SetupProvider>
            {children}
          </SetupProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
