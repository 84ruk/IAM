'use client'

import React, { Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import AutoImportModal from './AutoImportModal'

// Componente de carga
const LoadingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando Importación</h3>
          <p className="text-gray-600 mb-4">Preparando el sistema de importación...</p>
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

// Componente de error
const ErrorModal = ({ 
  isOpen, 
  onClose, 
  onRetry 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onRetry: () => void; 
}) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error de Importación</h3>
          <p className="text-gray-600 mb-4">
            Hubo un problema al cargar el sistema de importación. Intenta de nuevo.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Error Boundary para el modal
class ModalErrorBoundary extends React.Component<
  { 
    children: React.ReactNode; 
    isOpen: boolean; 
    onClose: () => void; 
    onRetry: () => void; 
  },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error en AutoImportModal:', error, errorInfo)
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorModal 
          isOpen={this.props.isOpen} 
          onClose={this.props.onClose} 
          onRetry={() => this.setState({ hasError: false })}
        />
      )
    }

    return this.props.children
  }
}

// Componente principal seguro
interface SafeAutoImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SafeAutoImportModal({ isOpen, onClose }: SafeAutoImportModalProps) {
  const handleRetry = () => {
    // Forzar re-render del modal
    window.location.reload()
  }

  return (
    <ModalErrorBoundary isOpen={isOpen} onClose={onClose} onRetry={handleRetry}>
      <Suspense fallback={<LoadingModal isOpen={isOpen} onClose={onClose} />}>
        <AutoImportModal isOpen={isOpen} onClose={onClose} />
      </Suspense>
    </ModalErrorBoundary>
  )
} 