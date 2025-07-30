'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Activity,
  Package,
  Target,
  PercentCircle,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/kpi-utils'
import React from 'react'

interface DailyMovementsSummaryProps {
  data: Record<string, unknown> | null
  isLoading: boolean
  error: Error | null
}

export function DailyMovementsSummary({ data, isLoading, error }: DailyMovementsSummaryProps) {
  const summary = data?.summary as Record<string, unknown> | undefined
  const topProducts = summary?.productosMasVendidos as Array<Record<string, unknown>> | undefined
  const topSuppliers = summary?.proveedoresPrincipales as Array<Record<string, unknown>> | undefined
  const stockAlerts = summary?.alertasStock as Array<Record<string, unknown>> | undefined
  const distribution = summary?.distribucionPorTipo as Array<Record<string, unknown>> | undefined

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando resumen...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            Error al cargar el resumen
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2" />
            No hay datos disponibles para mostrar el resumen
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular métricas del resumen
  const totalEntradas = data.data.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item.entradas) || 0), 0)
  const totalSalidas = data.data.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item.salidas) || 0), 0)
  const totalNeto = totalEntradas - totalSalidas
  const totalValorEntradas = data.data.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item.valorEntradas) || 0), 0)
  const totalValorSalidas = data.data.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item.valorSalidas) || 0), 0)
  const totalValorNeto = totalValorEntradas - totalValorSalidas
  // Usar el margen del backend si está disponible, sino calcular correctamente
  const margenPromedio = data.summary?.margenBrutoPromedio !== undefined 
    ? data.summary.margenBrutoPromedio 
    : (totalValorEntradas > 0 ? ((totalValorSalidas - totalValorEntradas) / totalValorEntradas) * 100 : 0)
  const diasConActividad = data.data.filter((item: Record<string, unknown>) => (Number(item.entradas) || 0) + (Number(item.salidas) || 0) > 0).length
  const promedioDiario = data.data.length > 0 ? ((totalEntradas + totalSalidas) / data.data.length) : 0

  // Obtener color de tendencia
  const getTendencyColor = (tendencia: string) => {
    switch (tendencia) {
      case 'CRECIENTE': return 'text-green-600 bg-green-100'
      case 'DECRECIENTE': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  // Obtener icono de tendencia
  const getTendencyIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'CRECIENTE': return <TrendingUp className="w-4 h-4" />
      case 'DECRECIENTE': return <TrendingDown className="w-4 h-4" />
      default: return <Minus className="w-4 h-4" />
    }
  }

  // Obtener estado de salud del inventario
  const getInventoryHealth = () => {
    if (totalNeto > 0) return { status: 'SALUDABLE', color: 'text-green-600 bg-green-100', icon: <CheckCircle className="w-4 h-4" /> }
    if (totalNeto < 0) return { status: 'DECLINANDO', color: 'text-red-600 bg-red-100', icon: <AlertTriangle className="w-4 h-4" /> }
    return { status: 'ESTABLE', color: 'text-yellow-600 bg-yellow-100', icon: <Minus className="w-4 h-4" /> }
  }

  const inventoryHealth = getInventoryHealth()

  const renderMetricCard = (title: string, value: unknown, icon: React.ComponentType<{ className?: string }>, color: string) => (
    <div className="flex items-center p-4 bg-white rounded-lg shadow-sm border">
      <div className={`p-2 rounded-lg ${color} mr-3`}>
        {React.createElement(icon, { className: 'w-5 h-5 text-white' })}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-lg font-semibold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : String(value || 0)}
        </p>
      </div>
    </div>
  )

  const renderTopItem = (item: Record<string, unknown>, index: number) => (
    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
        <span className="text-sm text-gray-900 truncate">
          {String(item.nombre || item.proveedor || 'N/A')}
        </span>
      </div>
      <span className="text-sm font-medium text-gray-600">
        {typeof item.cantidadTotal === 'number' ? item.cantidadTotal.toLocaleString() : '0'}
      </span>
    </div>
  )

  const renderStockAlert = (alert: Record<string, unknown>) => (
    <div key={String(alert.productoId)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${
          alert.severidad === 'CRITICA' ? 'bg-red-500' : 
          alert.severidad === 'ADVERTENCIA' ? 'bg-yellow-500' : 'bg-blue-500'
        }`} />
        <span className="text-sm text-gray-900 truncate">
          {String(alert.nombre || 'N/A')}
        </span>
      </div>
      <span className="text-sm font-medium text-gray-600">
        {typeof alert.stockActual === 'number' ? alert.stockActual : 0}
      </span>
    </div>
  )

  const renderDistributionItem = (item: Record<string, unknown>) => (
    <div key={String(item.tipo)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
      <span className="text-sm text-gray-900">
        {String(item.tipo || 'N/A')}
      </span>
      <span className="text-sm font-medium text-gray-600">
        {typeof item.cantidad === 'number' ? item.cantidad.toLocaleString() : '0'}
      </span>
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Resumen Ejecutivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Métricas Principales */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actividad General
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Entradas:</span>
                <span className="font-semibold text-green-600">{totalEntradas.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Salidas:</span>
                <span className="font-semibold text-red-600">{totalSalidas.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Neto:</span>
                <span className={`font-semibold ${totalNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalNeto >= 0 ? '+' : ''}{totalNeto.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Promedio Diario:</span>
                <span className="font-semibold text-blue-600">{promedioDiario.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Métricas Financieras */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Métricas Financieras
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor Entradas:</span>
                <span className="font-semibold text-green-600">{formatCurrency(totalValorEntradas)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor Salidas:</span>
                <span className="font-semibold text-red-600">{formatCurrency(totalValorSalidas)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor Neto:</span>
                <span className={`font-semibold ${totalValorNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalValorNeto >= 0 ? '+' : ''}{formatCurrency(totalValorNeto)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Margen Promedio:</span>
                <span className="font-semibold text-purple-600">{formatPercentage(margenPromedio)}</span>
              </div>
            </div>
          </div>

          {/* Indicadores de Rendimiento */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Indicadores de Rendimiento
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Días con Actividad:</span>
                <span className="font-semibold text-blue-600">{diasConActividad} de {data.data.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tendencia General:</span>
                <Badge className={getTendencyColor(data.summary?.tendencia || 'ESTABLE')}>
                  {getTendencyIcon(data.summary?.tendencia || 'ESTABLE')}
                  {data.summary?.tendencia || 'ESTABLE'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Salud del Inventario:</span>
                <Badge className={inventoryHealth.color}>
                  {inventoryHealth.icon}
                  {inventoryHealth.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Eficiencia:</span>
                <span className="font-semibold text-green-600">
                  {diasConActividad > 0 ? ((diasConActividad / data.data.length) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Período analizado:</span>
              <span className="font-medium">{data.meta?.daysRequested || 7} días</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Última actualización:</span>
              <span className="font-medium">
                {data.meta?.generatedAt ? new Date(data.meta.generatedAt).toLocaleString('es-ES') : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Total productos:</span>
              <span className="font-medium">{data.meta?.totalProductos || 'N/A'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 