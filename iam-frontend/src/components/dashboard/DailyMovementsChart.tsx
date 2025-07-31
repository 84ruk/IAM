'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Badge } from '@/components/ui/Badge'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  CartesianGrid,
  Area,
  AreaChart
} from '@/components/ui/RechartsWrapper'
import { Legend } from 'recharts'
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Package,
  DollarSign,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { useDailyMovements } from '@/hooks/useDailyMovements'

import Button from '@/components/ui/Button'

interface DailyMovementsChartProps {
  className?: string
  initialDays?: number
  showControls?: boolean
  showSummary?: boolean
  chartType?: 'line' | 'bar' | 'area' | 'combined'
  height?: number
}

export default function DailyMovementsChart({
  className = '',
  initialDays = 7,
  showControls = true,
  showSummary = true,
  chartType = 'combined',
  height = 400
}: DailyMovementsChartProps) {
  const [selectedDays, setSelectedDays] = useState(initialDays)
  const [selectedChartType, setSelectedChartType] = useState(chartType)

  const { data, isLoading, error, refetch, forceRefresh, updateDays } = useDailyMovements({
    days: selectedDays,
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000 // 5 minutos
  })

  // Procesar datos para la gráfica
  const chartData = useMemo(() => {
    if (!data?.data) return []

    try {
      return data.data.map(item => ({
        ...item,
        fecha: format(new Date(item.fecha), 'dd/MM'),
        fechaCompleta: item.fecha,
        totalMovimientos: (item.entradas || 0) + (item.salidas || 0),
        valorTotal: (item.valorEntradas || 0) + (item.valorSalidas || 0)
      }))
    } catch (error) {
      console.error('Error procesando datos de la gráfica:', error)
      return []
    }
  }, [data])

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

  // Formatear valor monetario
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Renderizar gráfica según tipo
  const renderChart = () => {
    if (!chartData.length) return null

    const commonProps = {
      data: chartData,
      width: '100%',
      height,
    }

    switch (selectedChartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: unknown, name: unknown) => [
                  String(name) === 'entradas' || String(name) === 'salidas' ? String(value) : formatCurrency(Number(value)),
                  String(name) === 'entradas' ? 'Entradas' : 
                  String(name) === 'salidas' ? 'Salidas' : 
                  String(name) === 'valorEntradas' ? 'Valor Entradas' :
                  String(name) === 'valorSalidas' ? 'Valor Salidas' : String(name)
                ]}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="entradas" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Entradas"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="salidas" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Salidas"
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: unknown, name: unknown) => [
                  String(value),
                  String(name) === 'entradas' ? 'Entradas' : 'Salidas'
                ]}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Legend />
              <Bar dataKey="entradas" fill="#10B981" name="Entradas" />
              <Bar dataKey="salidas" fill="#EF4444" name="Salidas" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: unknown, name: unknown) => [
                  String(name) === 'entradas' || String(name) === 'salidas' ? String(value) : formatCurrency(Number(value)),
                  String(name) === 'entradas' ? 'Entradas' : 
                  String(name) === 'salidas' ? 'Salidas' : 
                  String(name) === 'valorEntradas' ? 'Valor Entradas' :
                  String(name) === 'valorSalidas' ? 'Valor Salidas' : String(name)
                ]}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="entradas" 
                stackId="1"
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Entradas"
              />
              <Area 
                type="monotone" 
                dataKey="salidas" 
                stackId="1"
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={0.6}
                name="Salidas"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'combined':
      default:
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: unknown, name: unknown) => [
                  String(name) === 'entradas' || String(name) === 'salidas' ? String(value) : formatCurrency(Number(value)),
                  String(name) === 'entradas' ? 'Entradas' : 
                  String(name) === 'salidas' ? 'Salidas' : 
                  String(name) === 'valorEntradas' ? 'Valor Entradas' :
                  String(name) === 'valorSalidas' ? 'Valor Salidas' : String(name)
                ]}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="entradas" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Entradas (Cantidad)"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="salidas" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Salidas (Cantidad)"
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="valorEntradas" 
                stroke="#3B82F6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Valor Entradas"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="valorSalidas" 
                stroke="#F59E0B" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Valor Salidas"
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )
    }
  }

  // Renderizar resumen
  const renderSummary = () => {
    if (!data?.summary) return null

    const { summary } = data

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.avgEntradasDiarias.toFixed(1)}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio Salidas</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.avgSalidasDiarias.toFixed(1)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.totalMovimientos}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tendencia</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getTendencyColor(summary.tendencia)}>
                    {getTendencyIcon(summary.tendencia)}
                    {summary.tendencia}
                  </Badge>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Renderizar controles
  const renderControls = () => {
    if (!showControls) return null

    return (
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Período:</span>
          <Select value={selectedDays.toString()} onValueChange={(value) => {
            const days = parseInt(value)
            setSelectedDays(days)
            updateDays(days)
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="15">15 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="60">60 días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Gráfica:</span>
          <Select value={selectedChartType} onValueChange={(value: string) => setSelectedChartType(value as 'line' | 'bar' | 'area' | 'combined')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Líneas</SelectItem>
              <SelectItem value="bar">Barras</SelectItem>
              <SelectItem value="area">Áreas</SelectItem>
              <SelectItem value="combined">Combinada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={forceRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Forzar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Movimientos de Inventario Diarios
        </CardTitle>
        {data?.meta && (
          <p className="text-sm text-gray-500">
            Última actualización: {format(new Date(data.meta.generatedAt), 'dd/MM/yyyy HH:mm')}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {renderControls()}
        {showSummary && renderSummary()}
        
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Cargando datos...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 font-medium">Error al cargar datos</p>
              <p className="text-sm text-gray-500 mt-1">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          )}
          
          {!isLoading && !error && chartData.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">No hay datos disponibles</p>
              <p className="text-sm text-gray-500 mt-1">
                Los movimientos aparecerán cuando registres entradas o salidas de inventario
              </p>
            </div>
          )}
          
          {!isLoading && !error && chartData.length > 0 && renderChart()}
        </div>
      </CardContent>
    </Card>
  )
} 