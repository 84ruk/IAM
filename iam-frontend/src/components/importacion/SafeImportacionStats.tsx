'use client'

import React, { Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { Loader2 } from 'lucide-react'
import ImportacionStats from './ImportacionStats'

// Componente de carga
function LoadingStats() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-center space-x-3">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-gray-600">Cargando estadísticas...</span>
      </div>
    </Card>
  )
}

// Componente de error
function ErrorStats() {
  return (
    <Card className="p-6 border-yellow-200 bg-yellow-50">
      <div className="text-center">
        <div className="text-yellow-600 mb-2">⚠️</div>
        <h3 className="font-medium text-yellow-900 mb-2">
          No se pudieron cargar las estadísticas
        </h3>
        <p className="text-sm text-yellow-700">
          Las estadísticas de importación no están disponibles en este momento.
        </p>
      </div>
    </Card>
  )
}

// Componente principal con manejo de errores
export default function SafeImportacionStats() {
  return (
    <Suspense fallback={<LoadingStats />}>
      <ErrorBoundary fallback={<ErrorStats />}>
        <ImportacionStats />
      </ErrorBoundary>
    </Suspense>
  )
}

// Error Boundary simple
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error en SafeImportacionStats:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
} 