// src/app/layout.tsx
'use client'

import './globals.css'
import { montserrat } from './fonts'
import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { UserProvider } from '@/context/UserProvider'

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
        <SWRConfig value={{ 
          revalidateOnFocus: false, 
          dedupingInterval: 60000,
          errorRetryCount: 3,
          errorRetryInterval: 5000
        }}>
          <UserProvider>
            {children}
          </UserProvider>
        </SWRConfig>
      </body>
    </html>
  )
}
