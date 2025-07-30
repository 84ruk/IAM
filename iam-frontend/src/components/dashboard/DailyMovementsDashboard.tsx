'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
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
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Package,
  DollarSign,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  Filter,
  Eye,
  EyeOff,
  Target,
  PercentCircle,
  ShoppingCart,
  Truck,
  Warehouse,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Clock,
  Zap,
  Shield,
  Users,
  Thermometer,
  Droplets,
  Gauge
} from 'lucide-react'
import { format } from 'date-fns'
import { useDailyMovements } from '@/hooks/useDailyMovements'
import { DailyMovementsResponse } from '@/types/kpis'
import KPICard from '@/components/dashboard/KPICard'
import { formatCurrency, formatPercentage, getValueColor } from '@/lib/kpi-utils'
import DailyMovementsTable from '@/components/dashboard/DailyMovementsTable'
import DailyMovementsFilters from '@/components/dashboard/DailyMovementsFilters'
import { DailyMovementsSummary } from '@/components/dashboard/DailyMovementsSummary'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B']

interface DailyMovementsDashboardProps {
  className?: string
}

export default function DailyMovementsDashboard({ className = '' }: DailyMovementsDashboardProps) {
  const [selectedDays, setSelectedDays] = useState(7)
  const [selectedChartType, setSelectedChartType] = useState<'line' | 'bar' | 'area' | 'combined'>('combined')
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [showComparatives, setShowComparatives] = useState(false)
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)

  const { data: apiData, isLoading: apiIsLoading, error: apiError, refetch, forceRefresh } = useDailyMovements({
    days: selectedDays,
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000 // 5 minutos
  })

  // Procesar datos para las gráficas
  const chartData = useMemo(() => {
    if (!apiData?.data) return []

    try {
      return apiData.data.map(item => ({
        ...item,
        fecha: format(new Date(item.fecha), 'dd/MM'),
        fechaCompleta: item.fecha,
        totalMovimientos: (item.entradas || 0) + (item.salidas || 0),
        valorTotal: (item.valorEntradas || 0) + (item.valorSalidas || 0),
        margen: item.valorNeto > 0 ? ((item.valorNeto / item.valorEntradas) * 100) : 0
      }))
    } catch (error) {
      console.error('Error procesando datos de la gráfica:', error)
      return []
    }
  }, [apiData])

  // Datos para gráfica de productos más vendidos (reales del backend)
  const topProductsData = useMemo(() => {
    if (!apiData?.summary?.productosMasVendidos) return []
    
    // Usar datos reales del backend
    return apiData.summary.productosMasVendidos.map(producto => ({
      nombre: producto.nombre,
      ventas: producto.cantidadTotal,
      porcentaje: producto.porcentaje
    }))
  }, [apiData?.summary?.productosMasVendidos])

  // Datos para distribución por tipo (reales del backend)
  const distributionData = useMemo(() => {
    if (!apiData?.summary?.distribucionPorTipo) return []
    
    // Usar datos reales del backend
    return apiData.summary.distribucionPorTipo.map(tipo => ({
      name: tipo.tipo,
      value: tipo.cantidad,
      color: tipo.tipo === 'ALIMENTO' ? '#00C49F' : '#FF8042'
    }))
  }, [apiData?.summary?.distribucionPorTipo])

  // Datos para flujo de inventario
  const inventoryFlowData = useMemo(() => {
    if (!chartData.length) return []
    
    return chartData.map(item => ({
      fecha: item.fecha,
      inventario: item.neto,
      entradas: item.entradas,
      salidas: item.salidas,
      valor: item.valorNeto
    }))
  }, [chartData])

  // Datos para proveedores principales (reales del backend)
  const providersData = useMemo(() => {
    if (!apiData?.summary?.proveedoresPrincipales) return []
    
    // Usar datos reales del backend
    return apiData.summary.proveedoresPrincipales.map(proveedor => ({
      proveedor: proveedor.nombre,
      volumen: proveedor.cantidadTotal,
      porcentaje: proveedor.porcentaje
    }))
  }, [apiData?.summary?.proveedoresPrincipales])

  // Datos para margen promedio diario
  const marginData = useMemo(() => {
    if (!chartData.length) return []
    
    return chartData.map(item => ({
      fecha: item.fecha,
      margen: item.margen || 0,
      valorNeto: item.valorNeto
    }))
  }, [chartData])

  // Datos para alertas de stock (reales del backend)
  const stockAlerts = useMemo(() => {
    if (!apiData?.summary?.alertasStock) return []
    
    // Usar datos reales del backend
    return apiData.summary.alertasStock.map(alerta => ({
      producto: alerta.nombre,
      stock: alerta.stockActual,
      minimo: alerta.stockMinimo,
      estado: alerta.severidad
    }))
  }, [apiData?.summary?.alertasStock])

  // Datos para comparación de días
  const comparisonData = useMemo(() => {
    if (!chartData.length) return []
    
    const lastWeek = chartData.slice(-7)
    const previousWeek = chartData.slice(-14, -7)
    
    return lastWeek.map((item, index) => ({
      fecha: item.fecha,
      actual: item.totalMovimientos,
      anterior: previousWeek[index]?.totalMovimientos || 0,
      diferencia: (item.totalMovimientos || 0) - (previousWeek[index]?.totalMovimientos || 0)
    }))
  }, [chartData])

  // Datos para evolución de métricas
  const evolutionData = useMemo(() => {
    if (!chartData.length) return []
    
    return chartData.map(item => ({
      fecha: item.fecha,
      rotacion: ((item.salidas || 0) / (item.entradas || 1)) * 100,
      eficiencia: item.valorNeto > 0 ? 85 : 65,
      rentabilidad: item.margen || 0
    }))
  }, [chartData])

  // Datos para participación de proveedores
  const providerParticipation = useMemo(() => {
    if (!chartData.length) return []
    
    return [
      { proveedor: 'Proveedor A', participacion: 35, color: '#0088FE' },
      { proveedor: 'Proveedor B', participacion: 28, color: '#00C49F' },
      { proveedor: 'Proveedor C', participacion: 23, color: '#FFBB28' },
      { proveedor: 'Proveedor D', participacion: 14, color: '#FF8042' }
    ]
  }, [chartData])

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

  // Manejar cambios de filtros
  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    
    // Aplicar filtros a los controles principales
    if (newFilters.days) {
      setSelectedDays(parseInt(newFilters.days))
    }
    if (newFilters.chartType) {
      setSelectedChartType(newFilters.chartType)
    }
  }

  // Resetear filtros
  const handleFiltersReset = () => {
    setFilters({})
    setSelectedDays(7)
    setSelectedChartType('combined')
  }

  // Calcular métricas adicionales
  const additionalMetrics = useMemo(() => {
    if (!apiData?.data || !apiData?.summary) return null

    const totalEntradas = apiData.data.reduce((sum, item) => sum + (item.entradas || 0), 0)
    const totalSalidas = apiData.data.reduce((sum, item) => sum + (item.salidas || 0), 0)
    const totalValorEntradas = apiData.data.reduce((sum, item) => sum + (item.valorEntradas || 0), 0)
    const totalValorSalidas = apiData.data.reduce((sum, item) => sum + (item.valorSalidas || 0), 0)
    // Usar el margen del backend para consistencia
    const margenPromedio = apiData.summary?.margenBrutoPromedio !== undefined 
      ? apiData.summary.margenBrutoPromedio 
      : (totalValorEntradas > 0 ? ((totalValorSalidas - totalValorEntradas) / totalValorEntradas) * 100 : 0)

    return {
      totalEntradas,
      totalSalidas,
      totalValorEntradas,
      totalValorSalidas,
      margenPromedio,
      rotacionInventario: totalEntradas > 0 ? (totalSalidas / totalEntradas) * 100 : 0
    }
  }, [apiData])

  if (apiError) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
            <p className="text-gray-600 mb-4">{apiError.message}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Filtros Avanzados */}
      <DailyMovementsFilters
        onFiltersChange={handleFiltersChange}
        onReset={handleFiltersReset}
      />

      {/* Controles */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={selectedDays.toString()} onValueChange={(value) => setSelectedDays(parseInt(value))}>
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

              <Select value={selectedChartType} onValueChange={(value: string) => setSelectedChartType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combinada</SelectItem>
                  <SelectItem value="line">Líneas</SelectItem>
                  <SelectItem value="bar">Barras</SelectItem>
                  <SelectItem value="area">Áreas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => forceRefresh()} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              
              <Button 
                onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)} 
                variant={showDetailedAnalysis ? "default" : "outline"}
                size="sm"
              >
                {showDetailedAnalysis ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                Análisis Detallado
              </Button>

              <Button 
                onClick={() => setShowComparatives(!showComparatives)} 
                variant={showComparatives ? "default" : "outline"}
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Comparativas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

              {/* Indicadores Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Movimientos"
            value={apiData?.summary?.totalMovimientos || 0}
            icon={Activity}
            iconColor="text-blue-600"
            isLoading={apiIsLoading}
            error={!!apiError}
          />

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tendencia</p>
                  {apiIsLoading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                  ) : apiError ? (
                    <p className="text-2xl font-bold text-red-600">Error</p>
                  ) : (
                    <Badge className={getTendencyColor(apiData?.summary?.tendencia || 'ESTABLE')}>
                      {getTendencyIcon(apiData?.summary?.tendencia || 'ESTABLE')}
                      {apiData?.summary?.tendencia || 'ESTABLE'}
                    </Badge>
                  )}
                </div>
                {(apiData?.summary?.tendencia === 'CRECIENTE' ? TrendingUp : apiData?.summary?.tendencia === 'DECRECIENTE' ? TrendingDown : Minus) && 
                  React.createElement(
                    apiData?.summary?.tendencia === 'CRECIENTE' ? TrendingUp : apiData?.summary?.tendencia === 'DECRECIENTE' ? TrendingDown : Minus,
                    { 
                      className: `w-8 h-8 ${apiData?.summary?.tendencia === 'CRECIENTE' ? 'text-green-600' : apiData?.summary?.tendencia === 'DECRECIENTE' ? 'text-red-600' : 'text-yellow-600'}` 
                    }
                  )
                }
              </div>
            </CardContent>
          </Card>

          <KPICard
            title="Valor Total"
            value={formatCurrency(additionalMetrics?.totalValorEntradas || 0)}
            icon={DollarSign}
            iconColor="text-green-600"
            isLoading={apiIsLoading}
            error={!!apiError}
          />

          <KPICard
            title="Margen Promedio"
            value={formatPercentage(Number(additionalMetrics?.margenPromedio.toFixed(2)) || 0)}
            icon={PercentCircle}
            iconColor="text-purple-600"
            valueColor={getValueColor(Number(additionalMetrics?.margenPromedio.toFixed(2)) || 0, 20)}
            isLoading={apiIsLoading}
            error={!!apiError}
          />
        </div>

        {/* Resumen Ejecutivo */}
        <DailyMovementsSummary
          data={apiData}
          isLoading={apiIsLoading}
          error={apiError}
        />

      {/* Dashboard Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfica de líneas: Movimientos diarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="w-5 h-5" />
              Movimientos Diarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apiIsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="entradas" stroke="#00C49F" strokeWidth={2} name="Entradas" />
                  <Line type="monotone" dataKey="salidas" stroke="#FF8042" strokeWidth={2} name="Salidas" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfica de barras: Productos más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'ventas' ? 'Cantidad Vendida' : name
                  ]}
                  labelFormatter={(label) => `Producto: ${label}`}
                />
                <Bar dataKey="ventas" fill="#8884D8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de pastel: Distribución por tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" />
            Distribución por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col justify-center space-y-4">
              {distributionData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-lg font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis Detallado */}
      {showDetailedAnalysis && (
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Análisis Detallado</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfica de área: Flujo de inventario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AreaChartIcon className="w-5 h-5" />
                  Flujo de Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={inventoryFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="inventario" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="entradas" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                    <Area type="monotone" dataKey="salidas" stackId="2" stroke="#ffc658" fill="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica de barras: Proveedores principales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Proveedores Principales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={providersData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="proveedor" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="volumen" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfica de líneas: Margen promedio diario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PercentCircle className="w-5 h-5" />
                  Margen Promedio Diario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={marginData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Margen']} />
                    <Line type="monotone" dataKey="margen" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabla: Alertas de stock */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas de Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stockAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{alert.producto}</p>
                        <p className="text-sm text-gray-600">
                          Stock: {alert.stock} / Mínimo: {alert.minimo}
                        </p>
                      </div>
                      <Badge 
                        className={
                          alert.estado === 'CRITICA' ? 'bg-red-100 text-red-800' :
                          alert.estado === 'ADVERTENCIA' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }
                      >
                        {alert.estado}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Comparativas */}
      {showComparatives && (
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Comparativas</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfica de barras: Comparación de días */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Comparación de Días
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="actual" fill="#8884d8" name="Semana Actual" />
                    <Bar dataKey="anterior" fill="#82ca9d" name="Semana Anterior" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica de líneas: Evolución de métricas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5" />
                  Evolución de Métricas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rotacion" stroke="#8884d8" strokeWidth={2} name="Rotación (%)" />
                    <Line type="monotone" dataKey="eficiencia" stroke="#82ca9d" strokeWidth={2} name="Eficiencia (%)" />
                    <Line type="monotone" dataKey="rentabilidad" stroke="#ffc658" strokeWidth={2} name="Rentabilidad (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráfica de pastel: Participación de proveedores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Participación de Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={providerParticipation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ proveedor, participacion }) => `${proveedor}: ${participacion}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="participacion"
                    >
                      {providerParticipation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Participación']} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col justify-center space-y-4">
                  {providerParticipation.map((provider, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: provider.color }}></div>
                        <span className="font-medium">{provider.proveedor}</span>
                      </div>
                      <span className="text-lg font-bold">{provider.participacion}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Datos Detallados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Datos Detallados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DailyMovementsTable 
            initialDays={selectedDays}
            showSearch={true}
            showExport={true}
            maxRows={20}
          />
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Información del Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Dashboard Principal</h4>
              <p className="text-sm text-gray-600">
                Gráfica de líneas para movimientos diarios, gráfica de barras para productos más vendidos, 
                gráfica de pastel para distribución por tipo e indicadores de tendencia y valor total.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Análisis Detallado</h4>
              <p className="text-sm text-gray-600">
                Gráfica de área para flujo de inventario, gráfica de barras para proveedores principales, 
                gráfica de líneas para margen promedio diario y tabla de alertas de stock.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Comparativas</h4>
              <p className="text-sm text-gray-600">
                Gráfica de barras para comparación de días, gráfica de líneas para evolución de métricas 
                y gráfica de pastel para participación de proveedores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 