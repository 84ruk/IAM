'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  Brain,
  Calendar,
  PercentCircle,
  BarChart3
} from 'lucide-react'
import { PredictiveKPIs } from '@/types/kpis'

interface PredictiveKPIsPanelProps {
  data: PredictiveKPIs | null
  isLoading?: boolean
  error?: boolean
  className?: string
}

interface EstacionalidadItem {
  mes: string
  factorEstacional: number
}

export default function PredictiveKPIsPanel({
  data,
  isLoading = false,
  error = false,
  className = ''
}: PredictiveKPIsPanelProps) {
  
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900">KPIs Predictivos</h2>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <div className="text-red-600 text-lg font-medium mb-2">Error al cargar predicciones</div>
          <p className="text-red-500 text-sm">No se pudieron obtener los datos predictivos</p>
        </div>
      </div>
    )
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTendenciaColor = (tendencia: string) => {
    switch (tendencia) {
      case 'CRECIENTE':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'DECRECIENTE':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'CRECIENTE':
        return <TrendingUp className="w-5 h-5" />
      case 'DECRECIENTE':
        return <TrendingDown className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
    }
  }

  const getEstacionalidadColor = (factor: number) => {
    if (factor >= 1.3) return 'text-green-600 bg-green-50'
    if (factor >= 1.1) return 'text-blue-600 bg-blue-50'
    if (factor >= 0.9) return 'text-gray-600 bg-gray-50'
    return 'text-orange-600 bg-orange-50'
  }

  const sortedEstacionalidad = data.estacionalidad
    ? [...data.estacionalidad].sort((a, b) => b.factorEstacional - a.factorEstacional)
    : []

  const picos = sortedEstacionalidad.slice(0, 3)
  const valles = sortedEstacionalidad.slice(-3).reverse()

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">KPIs Predictivos</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predicción de Demanda */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Predicción de Demanda (30 días)</h3>
            </div>
            
            {data.prediccionDemanda && data.prediccionDemanda.length > 0 ? (
              <div className="space-y-3">
                {data.prediccionDemanda.slice(0, 5).map((producto, index) => (
                  <div key={producto.productoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-green-500' : 
                        index === 1 ? 'bg-blue-500' : 
                        index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{producto.nombre}</p>
                        <p className="text-xs text-gray-600">
                          {producto.demandaEstimada} unidades
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">
                        {formatPercentage(producto.confianza)} confianza
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No hay predicciones de demanda disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiebres de Stock */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Predicción de Quiebres</h3>
            </div>
            
            {data.prediccionQuiebres && data.prediccionQuiebres.length > 0 ? (
              <div className="space-y-3">
                {data.prediccionQuiebres.map((producto) => (
                  <div key={producto.productoId} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{producto.nombre}</p>
                        <p className="text-xs text-gray-600">
                          Fecha estimada: {new Date(producto.fechaPrediccion).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {formatPercentage(producto.probabilidad)} riesgo
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <PercentCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 text-sm">No hay productos en riesgo de quiebre</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tendencias de Ventas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tendencias de Ventas</h3>
            </div>
            
            {data.tendenciasVentas ? (
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 border rounded-lg ${getTendenciaColor(data.tendenciasVentas.tendencia)}`}>
                  {getTendenciaIcon(data.tendenciasVentas.tendencia)}
                  <div>
                    <p className="font-medium">Tendencia {data.tendenciasVentas.tendencia.toLowerCase()}</p>
                    <p className="text-sm opacity-80">
                      {data.tendenciasVentas.porcentajeCambio > 0 ? '+' : ''}{data.tendenciasVentas.porcentajeCambio}% 
                      en {data.tendenciasVentas.periodo}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No hay datos de tendencias disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estacionalidad */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Patrones Estacionales</h3>
            </div>
            
            {data.estacionalidad ? (
              <div className="space-y-4">
                {/* Picos de demanda */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Picos de demanda</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {picos.map((item: EstacionalidadItem) => (
                      <div key={item.mes} className={`p-2 rounded text-center ${getEstacionalidadColor(item.factorEstacional)}`}>
                        <p className="text-xs font-medium">{item.mes}</p>
                        <p className="text-xs">{(item.factorEstacional * 100).toFixed(0)}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Temporadas bajas */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Temporadas bajas</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {valles.map((item: EstacionalidadItem) => (
                      <div key={item.mes} className={`p-2 rounded text-center ${getEstacionalidadColor(item.factorEstacional)}`}>
                        <p className="text-xs font-medium">{item.mes}</p>
                        <p className="text-xs">{(item.factorEstacional * 100).toFixed(0)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No hay datos de estacionalidad disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
