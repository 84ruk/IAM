// src/app/layout.tsx
import './globals.css'
import { montserrat } from './fonts'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${montserrat.className} bg-gray-50`}>
        {children}
      </body>
    </html>
  )
}
