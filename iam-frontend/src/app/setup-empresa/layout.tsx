import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configurar Empresa - IAM Inventario',
  description: 'Configura tu empresa para comenzar a usar el sistema de inventario',
}

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {children}
    </div>
  )
} 