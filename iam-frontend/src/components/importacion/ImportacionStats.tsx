'use client'

import React from 'react'
import { useImportacionOptimized } from '@/hooks/useImportacionOptimized'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Activity,
  Database,
  Zap
} from 'lucide-react'

export default function ImportacionStats() {
  const { 
    estadisticas, 
    isReady, 
    hasData, 
    hasActiveImport,
    isLoadingTrabajos,
    isLoadingTipos,
    lastFetchTime
  } = useImportacionOptimized()

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return 'Nunca'
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (minutes < 1) return `${seconds}s`
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Estadísticas de Importación</h3>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">Optimizado</span>
        </div>
      </div>

      {/* Estado del Sistema */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Estado del Sistema</h4>
          <Badge 
            variant={isReady ? 'default' : 'secondary'}
            className={getStatusColor(isReady ? 'success' : 'warning')}
          >
            {isReady ? 'Listo' : 'Inicializando...'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span>Datos cargados:</span>
            <Badge variant={hasData ? 'default' : 'secondary'}>
              {hasData ? 'Sí' : 'No'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-orange-500" />
            <span>Importación activa:</span>
            <Badge variant={hasActiveImport ? 'destructive' : 'secondary'}>
              {hasActiveImport ? 'Sí' : 'No'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>Última actualización:</span>
            <span className="text-gray-600">{formatTime(lastFetchTime)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>Cache activo:</span>
            <Badge variant={lastFetchTime > 0 ? 'default' : 'secondary'}>
              {lastFetchTime > 0 ? 'Sí' : 'No'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Estadísticas de Trabajos */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Resumen de Trabajos</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 mr-1" />
              {estadisticas.completados}
            </div>
            <div className="text-sm text-gray-600">Completados</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 mr-1" />
              {estadisticas.conError}
            </div>
            <div className="text-sm text-gray-600">Con Error</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center">
              <Clock className="w-5 h-5 mr-1" />
              {estadisticas.enProgreso}
            </div>
            <div className="text-sm text-gray-600">En Progreso</div>
          </div>
        </div>

        {/* Porcentaje de Éxito */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tasa de Éxito</span>
            <span className={`text-sm font-bold ${getPerformanceColor(estadisticas.porcentajeExito)}`}>
              {estadisticas.porcentajeExito}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                estadisticas.porcentajeExito >= 90 ? 'bg-green-500' :
                estadisticas.porcentajeExito >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${estadisticas.porcentajeExito}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Optimizaciones */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Optimizaciones Activas</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Rate Limiting</div>
                <div className="text-sm text-green-700">100ms entre requests</div>
              </div>
            </div>
            <Badge variant="default">Activo</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">Cache Inteligente</div>
                <div className="text-sm text-blue-700">30s para trabajos, 5m para tipos</div>
              </div>
            </div>
            <Badge variant="default">Activo</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-900">Estado Global</div>
                <div className="text-sm text-purple-700">Un solo estado compartido</div>
              </div>
            </div>
            <Badge variant="default">Activo</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">Retry Automático</div>
                <div className="text-sm text-orange-700">Backoff exponencial</div>
              </div>
            </div>
            <Badge variant="default">Activo</Badge>
          </div>
        </div>
      </Card>

      {/* Indicadores de Carga */}
      {(isLoadingTrabajos || isLoadingTipos) && (
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <span className="text-sm text-gray-600">
              {isLoadingTrabajos ? 'Cargando trabajos...' : 'Cargando tipos soportados...'}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
} 