// src/app/layout.tsx
import './globals.css'
import { montserrat } from './fonts'
import { ReactNode } from 'react'

export const metadata = {
  title: 'IAM - Inventario Inteligente',
  description: 'Plataforma inteligente de gestión de inventario para PYMEs',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${montserrat.className} bg-gray-50 antialiased text-gray-800`}>
        {children}
      </body>
    </html>
  )
}
