'use client'

import React, { Component, ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
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
    console.error('Error en módulo de importación:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">
              Error en el Módulo de Importación
            </h3>
          </div>
          
          <p className="text-red-700 mb-4">
            Ha ocurrido un error inesperado en el módulo de importación. 
            Esto puede deberse a un problema temporal de conexión o un error en el servidor.
          </p>
          
          {this.state.error && (
            <details className="mb-4">
              <summary className="text-sm font-medium text-red-800 cursor-pointer">
                Detalles del error
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {this.state.error.message}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex space-x-3">
            <Button 
              onClick={this.handleRetry}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Recargar Página
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
} 