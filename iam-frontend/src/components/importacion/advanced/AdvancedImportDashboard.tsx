'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  BarChart3,
  History,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Upload,
  FileText,
  Package,
  ShoppingCart,
  Activity,
  Zap,
  Target,
  Info,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { useImportacionGlobal } from '@/context/ImportacionGlobalContext'
import { useImportacionWebSocket } from '@/hooks/useImportacionWebSocket'

import { 
  ErrorResolutionModal,
  ImportHistory,
  ImportAnalytics,
  AdvancedImportOptions
} from './index'
// import RequestOptimizer from '../RequestOptimizer' // Removido para evitar conflictos
import { ImportacionValidationError } from '@/lib/api/importacion'

interface AdvancedImportDashboardProps {
  className?: string
}

export default function AdvancedImportDashboard({ className = '' }: AdvancedImportDashboardProps) {
  const { state } = useImportacionGlobal()
  const { isConnected } = useImportacionWebSocket()
  const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'analytics' | 'options'>('overview')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [selectedErrors, setSelectedErrors] = useState<ImportacionValidationError[]>([])

  // Estadísticas rápidas optimizadas con useMemo
  const quickStats = useMemo(() => {
    const total = state.trabajos.length
    const exitosas = state.trabajos.filter(t => t.estado === 'completado').length
    const conError = state.trabajos.filter(t => t.estado === 'error').length
    const enProgreso = state.trabajos.filter(t => t.estado === 'procesando').length
    
    return {
      totalImportaciones: total,
      exitosas,
      conError,
      enProgreso,
      tasaExito: total > 0 ? (exitosas / total) * 100 : 0
    }
  }, [state.trabajos])

  // Manejar resolución de errores
  const handleResolveErrors = async (resolutions: any[]) => {
    console.log('Resolviendo errores:', resolutions)
    // Aquí implementarías la lógica para aplicar las resoluciones
    setShowErrorModal(false)
  }

  // Simular errores para demostración
  const simulateErrors = () => {
    const mockErrors: ImportacionValidationError[] = [
      {
        fila: 5,
        columna: 'email',
        valor: 'invalid-email',
        mensaje: 'Formato de email inválido',
        tipo: 'formato'
      },
      {
        fila: 12,
        columna: 'precio',
        valor: 'abc',
        mensaje: 'El precio debe ser un número',
        tipo: 'validacion'
      },
      {
        fila: 8,
        columna: 'productoNombre',
        valor: 'Producto Nuevo',
        mensaje: 'El producto no existe en el inventario',
        tipo: 'referencia'
      }
    ]
    setSelectedErrors(mockErrors)
    setShowErrorModal(true)
  }

  // Obtener icono por sección
  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'overview':
        return <BarChart3 className="h-5 w-5" />
      case 'history':
        return <History className="h-5 w-5" />
      case 'analytics':
        return <BarChart3 className="h-5 w-5" />
      case 'options':
        return <Settings className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Importación de Datos</CardTitle>
                <p className="text-sm text-gray-600">
                  Gestión completa de importaciones con herramientas inteligentes
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              
              <Button
                variant="outline"
                onClick={simulateErrors}
                className="flex items-center space-x-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Simular Errores</span>
              </Button>
              
              <Button
                onClick={() => setActiveSection('overview')}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Actualizar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navegación por secciones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { key: 'overview', label: 'Resumen', icon: <BarChart3 className="h-4 w-4" /> },
          { key: 'history', label: 'Historial', icon: <History className="h-4 w-4" /> },
          { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
          { key: 'options', label: 'Opciones', icon: <Settings className="h-4 w-4" /> }
        ].map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key as any)}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              activeSection === section.key
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              {section.icon}
              <span className="font-medium">{section.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Contenido de la sección activa */}
      <div className="min-h-[600px]">
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Importaciones</p>
                      <p className="text-2xl font-bold text-gray-900">{quickStats.totalImportaciones}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Exitosas</p>
                      <p className="text-2xl font-bold text-green-600">{quickStats.exitosas}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Con Error</p>
                      <p className="text-2xl font-bold text-red-600">{quickStats.conError}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                      <p className="text-2xl font-bold text-blue-600">{quickStats.tasaExito.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setActiveSection('history')}
                  >
                    <History className="h-6 w-6" />
                    <span>Ver Historial</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setActiveSection('analytics')}
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span>Ver Estadísticas</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Información de Rendimiento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de WebSocket</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Estado de conexión:</span>
                    <Badge variant="outline">Conectado</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Trabajos suscritos:</span>
                    <Badge variant="outline">{state.trabajos.filter(t => t.estado === 'procesando').length}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Actualizaciones en tiempo real:</span>
                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                      {isConnected ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Características Avanzadas</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Resolución automática de errores</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Creación automática de entidades relacionadas</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Analytics y métricas detalladas</span>
                      </li>

                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Tipos Soportados</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Productos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Proveedores</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">Movimientos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'history' && (
          <ImportHistory />
        )}

        {activeSection === 'analytics' && (
          <ImportAnalytics />
        )}

        {activeSection === 'options' && (
          <AdvancedImportOptions
            tipo="productos"
            opciones={{}}
            onOpcionesChange={() => {}}
          />
        )}


      </div>

      {/* Modal de resolución de errores */}
      <ErrorResolutionModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={selectedErrors}
        onResolve={handleResolveErrors}
        tipoImportacion="productos"
        totalRegistros={100}
        registrosConError={selectedErrors.length}
      />
    </div>
  )
} 