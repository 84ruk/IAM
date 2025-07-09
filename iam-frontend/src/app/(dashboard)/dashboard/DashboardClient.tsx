'use client'

import useSWR from 'swr'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, AreaChart, Area } from 'recharts'
import { useMemo, useState, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { useAutoRefresh } from '@/lib/useAutoRefresh'
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  DollarSign, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  RefreshCw,
  PercentCircle,
  Info,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { Loader2 } from 'lucide-react'
import Select from '@/components/ui/Select'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { 
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }).then(async res => {
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      
      // Manejar errores específicos de base de datos
      if (res.status === 503) {
        throw new Error('La base de datos no está disponible. Verifica que el servicio esté ejecutándose.');
      }
      
      if (errorData.details?.code === 'DATABASE_UNAVAILABLE' || 
          errorData.details?.code === 'DATABASE_CONNECTION_ERROR' ||
          errorData.details?.code === 'DATABASE_CONNECTION_TIMEOUT') {
        throw new Error('Error de conexión con la base de datos. Por favor, verifica que el servicio esté ejecutándose.');
      }
      
      if (errorData.details?.code === 'NO_DATA_FOUND') {
        throw new Error('No se encontraron datos para tu empresa. Verifica que tengas productos registrados.');
      }
      
      // Error genérico con detalles si están disponibles
      const errorMessage = errorData.message || `Error ${res.status}: ${res.statusText}`;
      throw new Error(errorMessage);
    }
    return res.json()
  })

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Badge para valores críticos
const Badge = ({ text, color }: { text: string; color: string }) => (
  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{text}</span>
)

// Tipos para los datos reales del backend
type ProductoKPI = {
  id: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
  precioVenta: number;
  precioCompra: number;
  etiqueta: string | null;
  movimientos: number; // cantidad total de salidas del mes
  cantidadMovimientos: number; // número de movimientos de salida del mes
}

type MovimientoKPI = {
  id: number;
  productoId: number;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  fecha: string;
  motivo: string | null;
  producto: {
    nombre: string;
  };
}

export default function DashboardClient() {
  const { data, isLoading, error, mutate } = useSWR('/dashboard/data', fetcher, {
    refreshInterval: 120000, // Cambiar de 30s a 2 minutos para mejor eficiencia
    revalidateOnFocus: false, // Desactivar revalidación al enfocar para mejor UX
    revalidateOnReconnect: true, // Mantener revalidación al reconectar
    dedupingInterval: 60000, // Evitar requests duplicados en 1 minuto
    errorRetryCount: 3, // Mejorar retry de errores
    errorRetryInterval: 5000, // Intervalo de retry más corto
  })
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [monthLoading, setMonthLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [showUpdateNotification, setShowUpdateNotification] = useState(false)

  const kpis = useMemo(() => data?.kpis || null, [data])
  const ventasPorDia = useMemo(() => data?.ventasPorDia || [], [data])
  const stockCritico = useMemo(() => data?.stockCritico || [], [data])
  const stockPorCategoria = useMemo(() => data?.stockPorCategoria || [], [data])
  const productosMasVendidos = useMemo(() => data?.productosMasVendidos || [], [data])
  const pedidosRecientes = useMemo(() => data?.pedidosRecientes || [], [data])
  const prediccionQuiebre = useMemo(() => data?.prediccionQuiebre || [], [data])
  const diasGraficos = data?.diasGraficos || []
  const productos = useMemo(() => data?.productos || [], [data]) as ProductoKPI[]
  const movimientos = useMemo(() => data?.movimientos || [], [data]) as MovimientoKPI[]

  console.log('Datos de análisis:', { kpis, ventasPorDia, stockCritico, productos, movimientos })
  console.log('Datos de gráfica:', diasGraficos)
  console.log('Productos para KPIs:', productos)
  
  // Función para refrescar manualmente - optimizada pero misma funcionalidad
  const handleRefresh = useCallback(async (isAuto = false) => {
    setIsRefreshing(true)
    try {
      await mutate() // Revalidar datos
      setLastUpdate(new Date())
      
      // Mostrar notificación si es actualización automática
      if (isAuto) {
        setShowUpdateNotification(true)
        setTimeout(() => setShowUpdateNotification(false), 3000)
      }
    } catch (error) {
      console.error('Error al refrescar:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [mutate])

  // Función para refresh manual (sin parámetros) - mantener igual
  const handleManualRefresh = useCallback(() => {
    handleRefresh(false)
  }, [handleRefresh])

  // Auto-refresh personalizado - optimizado a 2 minutos
  useAutoRefresh({
    interval: 120000, // Cambiar de 30s a 2 minutos
    enabled: autoRefreshEnabled && isOnline,
    onRefresh: () => handleRefresh(true)
  })

  // Detectar estado de conexión - mantener igual
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Detectar cuando la ventana recupera el foco - optimizado
  useEffect(() => {
    const handleFocus = () => {
      if (autoRefreshEnabled) {
        // Solo revalidar si han pasado más de 30 segundos desde la última actualización
        const timeSinceLastUpdate = Date.now() - lastUpdate.getTime()
        if (timeSinceLastUpdate > 30000) {
          handleRefresh()
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [autoRefreshEnabled, handleRefresh, lastUpdate])

  // Calcular KPIs adicionales con datos reales
  const kpisAdicionales = useMemo(() => {
    if (!productos || productos.length === 0) {
      return {
        valorInventario: 0,
        valorVentas: 0,
        margenPromedio: 0,
        productosCriticos: 0,
        productosSinStock: 0,
        productosConStockBajo: 0,
        productosConStockOptimo: 0,
        productosConStockAlto: 0
      }
    }

    const valorInventario = productos.reduce((acc, p) => acc + (p.stock * p.precioVenta), 0)
    const valorVentas = productos.reduce((acc, p) => acc + (p.movimientos * p.precioVenta), 0)
    
    const productosConMargen = productos.filter(p => p.precioCompra > 0)
    const margenPromedio = productosConMargen.length > 0 
      ? productosConMargen.reduce((acc, p) => acc + ((p.precioVenta - p.precioCompra) / p.precioCompra * 100), 0) / productosConMargen.length
      : 0

    const productosCriticos = productos.filter(p => p.stock <= p.stockMinimo).length
    const productosSinStock = productos.filter(p => p.stock === 0).length
    const productosConStockBajo = productos.filter(p => p.stock > 0 && p.stock <= p.stockMinimo).length
    const productosConStockOptimo = productos.filter(p => p.stock > p.stockMinimo && p.stock <= p.stockMinimo * 2).length
    const productosConStockAlto = productos.filter(p => p.stock > p.stockMinimo * 2).length

    return {
      valorInventario,
      valorVentas,
      margenPromedio,
      productosCriticos,
      productosSinStock,
      productosConStockBajo,
      productosConStockOptimo,
      productosConStockAlto
    }
  }, [productos])

  // Función para cambiar mes - mantener igual
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value))
    setMonthLoading(true)
    // Simular carga de datos del mes
    setTimeout(() => setMonthLoading(false), 1000)
  }

  const NoData = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">{text}</p>
      <p className="text-sm">No hay datos disponibles para mostrar</p>
    </div>
  )

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo.toLowerCase()) {
      case 'alto': return 'bg-red-100 text-red-800'
      case 'medio': return 'bg-yellow-100 text-yellow-800'
      case 'bajo': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo': return 'bg-green-100 text-green-800'
      case 'inactivo': return 'bg-red-100 text-red-800'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error al cargar datos</div>
            <p className="text-red-500 text-sm mb-4">{error.message}</p>
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header con controles */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Análisis completo de tu inventario y ventas
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Indicador de conexión */}
            <div className="flex items-center gap-2 text-sm">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'En línea' : 'Sin conexión'}
              </span>
            </div>

            {/* Selector de mes */}
            <Select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e as any)}
              options={MONTHS.map((month, index) => ({
                value: index.toString(),
                label: month
              }))}
              className="mb-0"
            />

            {/* Botón de refresh */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {/* Toggle auto-refresh */}
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                autoRefreshEnabled 
                  ? 'bg-[#8E94F2] text-white hover:bg-[#7278e0]' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Auto</span>
            </button>
          </div>
        </div>

        {/* Notificación de actualización automática */}
        {showUpdateNotification && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Datos actualizados automáticamente</span>
          </div>
        )}

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor del Inventario</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${kpisAdicionales.valorInventario.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${kpisAdicionales.valorVentas.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Margen Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpisAdicionales.margenPromedio.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <PercentCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos Críticos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpisAdicionales.productosCriticos}
                    {kpisAdicionales.productosCriticos > 0 && (
                      <Badge text="¡Atención!" color="bg-red-100 text-red-800" />
                    )}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos y análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de ventas por día */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Día</h3>
              {ventasPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ventasPorDia}>
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ventas" stroke="#8E94F2" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <NoData text="No hay datos de ventas" />
              )}
            </CardContent>
          </Card>

          {/* Gráfico de stock por categoría */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock por Categoría</h3>
              {stockPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stockPorCategoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="stock"
                    >
                      {stockPorCategoria.map((entry: { name: string; stock: number }, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <NoData text="No hay datos de stock" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}