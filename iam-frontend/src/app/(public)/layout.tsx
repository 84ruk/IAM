// src/app/(public)/layout.tsx
import { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  // Layout completamente estático para páginas públicas
  // No requiere providers ni verificaciones de backend
  return <>{children}</>
} 