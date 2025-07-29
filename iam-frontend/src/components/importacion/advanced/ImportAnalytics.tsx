'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Package,
  ShoppingCart,
  Activity,
  Zap,
  Target,
  PieChart,
  LineChart,
  BarChart,
  RefreshCw,
  Download,
  Filter,
  Info,
  Database
} from 'lucide-react'
import { useImportacionGlobal } from '@/context/ImportacionGlobalContext'
import { TrabajoImportacion } from '@/lib/api/importacion'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface ImportAnalyticsProps {
  className?: string
}

interface AnalyticsData {
  totalImportaciones: number
  importacionesExitosas: number
  importacionesConError: number
  tasaExito: number
  tiempoPromedio: number
  registrosProcesados: number
  erroresComunes: Array<{ tipo: string; cantidad: number; porcentaje: number }>
  tendenciasPorDia: Array<{ fecha: string; exitosas: number; conError: number }>
  distribucionPorTipo: Array<{ tipo: string; cantidad: number; porcentaje: number }>
  rendimientoPorHora: Array<{ hora: number; cantidad: number }>
}

export default function ImportAnalytics({ className = '' }: ImportAnalyticsProps) {
  const { state, loadTrabajos } = useImportacionGlobal()
  const [periodoAnalisis, setPeriodoAnalisis] = useState<'7d' | '30d' | '90d'>('30d')
  const [isLoading, setIsLoading] = useState(false)

  // Cargar datos al montar el componente
  useEffect(() => {
    loadTrabajos(true)
  }, [loadTrabajos])

  // Calcular datos de analytics
  const analyticsData = useMemo((): AnalyticsData => {
    const trabajos = state.trabajos
    const ahora = new Date()
    const diasAtras = periodoAnalisis === '7d' ? 7 : periodoAnalisis === '30d' ? 30 : 90
    const fechaInicio = subDays(ahora, diasAtras)

    // Filtrar trabajos del período
    const trabajosFiltrados = trabajos.filter(trabajo => 
      new Date(trabajo.fechaCreacion) >= fechaInicio
    )

    // Estadísticas básicas
    const totalImportaciones = trabajosFiltrados.length
    const importacionesExitosas = trabajosFiltrados.filter(t => t.estado === 'completado').length
    const importacionesConError = trabajosFiltrados.filter(t => t.estado === 'error').length
    const tasaExito = totalImportaciones > 0 ? (importacionesExitosas / totalImportaciones) * 100 : 0

    // Tiempo promedio de procesamiento (simulado)
    const tiempoPromedio = totalImportaciones > 0 ? 
      trabajosFiltrados.reduce((acc, t) => acc + (t.progreso > 0 ? 120 : 60), 0) / totalImportaciones : 0

    // Registros procesados
    const registrosProcesados = trabajosFiltrados.reduce((acc, t) => acc + t.totalRegistros, 0)

    // Errores comunes (simulado)
    const erroresComunes = [
      { tipo: 'Formato de archivo', cantidad: Math.floor(totalImportaciones * 0.15), porcentaje: 15 },
      { tipo: 'Datos faltantes', cantidad: Math.floor(totalImportaciones * 0.12), porcentaje: 12 },
      { tipo: 'Validación fallida', cantidad: Math.floor(totalImportaciones * 0.08), porcentaje: 8 },
      { tipo: 'Referencias inválidas', cantidad: Math.floor(totalImportaciones * 0.05), porcentaje: 5 }
    ].filter(e => e.cantidad > 0)

    // Tendencia por día
    const dias = []
    const fechaActual = new Date(fechaInicio)
    while (fechaActual <= ahora) {
      dias.push(new Date(fechaActual))
      fechaActual.setDate(fechaActual.getDate() + 1)
    }
    
    const tendenciasPorDia = dias.map(dia => {
      const trabajosDelDia = trabajosFiltrados.filter(t => {
        const fechaTrabajo = new Date(t.fechaCreacion)
        return fechaTrabajo >= startOfDay(dia) && fechaTrabajo <= endOfDay(dia)
      })
      
      return {
        fecha: format(dia, 'dd/MM'),
        exitosas: trabajosDelDia.filter(t => t.estado === 'completado').length,
        conError: trabajosDelDia.filter(t => t.estado === 'error').length
      }
    })

    // Distribución por tipo
    const tipos = ['productos', 'proveedores', 'movimientos']
    const distribucionPorTipo = tipos.map(tipo => {
      const cantidad = trabajosFiltrados.filter(t => t.tipo === tipo).length
      return {
        tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        cantidad,
        porcentaje: totalImportaciones > 0 ? (cantidad / totalImportaciones) * 100 : 0
      }
    }).filter(d => d.cantidad > 0)

    // Rendimiento por hora (simulado)
    const rendimientoPorHora = Array.from({ length: 24 }, (_, i) => ({
      hora: i,
      cantidad: Math.floor(Math.random() * 10) + 1
    }))

    return {
      totalImportaciones,
      importacionesExitosas,
      importacionesConError,
      tasaExito,
      tiempoPromedio,
      registrosProcesados,
      erroresComunes,
      tendenciasPorDia,
      distribucionPorTipo,
      rendimientoPorHora
    }
  }, [state.trabajos, periodoAnalisis])

  // Obtener icono por tipo
  const getTipoIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'productos':
        return <Package className="h-4 w-4" />
      case 'proveedores':
        return <ShoppingCart className="h-4 w-4" />
      case 'movimientos':
        return <Activity className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Obtener color por tipo de error
  const getErrorColor = (tipo: string) => {
    switch (tipo) {
      case 'Formato de archivo':
        return 'bg-red-100 text-red-800'
      case 'Datos faltantes':
        return 'bg-yellow-100 text-yellow-800'
      case 'Validación fallida':
        return 'bg-orange-100 text-orange-800'
      case 'Referencias inválidas':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Exportar analytics
  const exportAnalytics = () => {
    const csvContent = [
      ['Métrica', 'Valor'],
      ['Total Importaciones', analyticsData.totalImportaciones],
      ['Importaciones Exitosas', analyticsData.importacionesExitosas],
      ['Importaciones con Error', analyticsData.importacionesConError],
      ['Tasa de Éxito', `${analyticsData.tasaExito.toFixed(1)}%`],
      ['Tiempo Promedio', `${analyticsData.tiempoPromedio.toFixed(0)} segundos`],
      ['Registros Procesados', analyticsData.registrosProcesados],
      ['', ''],
      ['Errores Comunes', ''],
      ...analyticsData.erroresComunes.map(e => [e.tipo, `${e.cantidad} (${e.porcentaje}%)`])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-importacion-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Analytics de Importación</CardTitle>
                <p className="text-sm text-gray-600">
                  Métricas y análisis del rendimiento de importaciones
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={periodoAnalisis}
                onChange={(e) => setPeriodoAnalisis(e.target.value as any)}
                className="p-2 border rounded-md text-sm"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
              
              <button
                onClick={exportAnalytics}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Importaciones</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalImportaciones}</p>
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
                <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                <p className="text-2xl font-bold text-green-600">{analyticsData.tasaExito.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-blue-600">{analyticsData.tiempoPromedio.toFixed(0)}s</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registros Procesados</p>
                <p className="text-2xl font-bold text-orange-600">{analyticsData.registrosProcesados.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y análisis detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.distribucionPorTipo.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTipoIcon(item.tipo)}
                    <span className="font-medium">{item.tipo}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${item.porcentaje}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {item.cantidad}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Errores comunes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Errores Comunes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.erroresComunes.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getErrorColor(error.tipo)}>
                      {error.tipo}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{error.cantidad}</div>
                    <div className="text-sm text-gray-500">{error.porcentaje}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendencia temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tendencia de Importaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData.tendenciasPorDia.map((dia, index) => (
              <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                <div className="flex flex-col space-y-1 w-full">
                  <div
                    className="bg-green-500 rounded-t"
                    style={{ 
                      height: `${Math.max((dia.exitosas / Math.max(...analyticsData.tendenciasPorDia.map(d => d.exitosas + d.conError))) * 200, 4)}px`
                    }}
                  />
                  <div
                    className="bg-red-500 rounded-b"
                    style={{ 
                      height: `${Math.max((dia.conError / Math.max(...analyticsData.tendenciasPorDia.map(d => d.exitosas + d.conError))) * 200, 4)}px`
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 rotate-45 origin-left">
                  {dia.fecha}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Exitosas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Con Error</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights y recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insights y Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Puntos Fuertes</h4>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Tasa de éxito del {analyticsData.tasaExito.toFixed(1)}%</li>
                    <li>• {analyticsData.registrosProcesados.toLocaleString()} registros procesados</li>
                    <li>• Tiempo promedio de {analyticsData.tiempoPromedio.toFixed(0)} segundos</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Áreas de Mejora</h4>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Reducir errores de formato de archivo</li>
                    <li>• Mejorar validación de datos faltantes</li>
                    <li>• Optimizar tiempo de procesamiento</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 