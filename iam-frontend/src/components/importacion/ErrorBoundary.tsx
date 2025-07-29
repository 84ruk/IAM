'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ImportacionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error en componente de importación:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleClose = () => {
    // Aquí podrías implementar lógica para cerrar el modal o redirigir
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-900">Error de Importación</CardTitle>
                  <p className="text-sm text-gray-600">
                    Hubo un problema al cargar el sistema de importación
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  {this.state.error?.message || 'Error desconocido'}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Ver detalles técnicos
                    </summary>
                    <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={this.handleClose}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cerrar
                </Button>
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar el error boundary en componentes funcionales
export function useImportacionErrorHandler() {
  const handleError = (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error en importación:', error, errorInfo)
    
    // Aquí podrías enviar el error a un servicio de monitoreo
    if (process.env.NODE_ENV === 'production') {
      // Enviar a servicio de monitoreo
    }
  }

  return { handleError }
} 