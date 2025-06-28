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
import { requireAuth } from '@/lib/ssrAuth'

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

export default async function AnalisisPage() {
  const user = await requireAuth()
  if (!user) return null // SSR: nunca se renderiza si no hay usuario

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
        productosAgotados: 0,
        productosSobreStock: 0,
        productoMayorMargen: null,
        productoMayorRotacion: null
      }
    }

    // Corregido: usar precioCompra para el valor del inventario (costo de reposición)
    const valorInventario = productos.reduce((acc, p) => acc + (p.stock * p.precioCompra), 0)
    const productosAgotados = productos.filter(p => p.stock === 0).length
    const productosSobreStock = productos.filter(p => p.stock > 3 * p.stockMinimo).length
    
    const productoMayorMargen = productos.reduce((max, p) => {
      if (p.precioCompra <= 0) return max
      const margen = (p.precioVenta - p.precioCompra) / p.precioCompra
      const maxMargen = max ? (max.precioVenta - max.precioCompra) / max.precioCompra : 0
      return margen > maxMargen ? p : max
    }, null as ProductoKPI | null)
    
    const productoMayorRotacion = productos.reduce((max, p) => 
      (p.movimientos || 0) > (max?.movimientos || 0) ? p : max, 
      null as ProductoKPI | null
    )

    return {
      valorInventario,
      productosAgotados,
      productosSobreStock,
      productoMayorMargen,
      productoMayorRotacion
    }
  }, [productos])

  // Simular loading al cambiar de mes
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(Number(e.target.value))
    setMonthLoading(true)
    setTimeout(() => {
      setMonthLoading(false)
      setLastUpdate(new Date())
    }, 800)
  }

  // Breadcrumbs visualmente clicables
  const breadcrumbs = [
    { label: 'Panel de control', href: '#' },
    { label: 'Análisis', href: '#' }
  ]

  // Mensajes amigables
  const NoData = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <Info className="w-8 h-8 mb-2" />
      <span className="text-sm">{text}</span>
    </div>
  )

  // Animación de loading
  if (isLoading || monthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-10 h-10 text-blue-400 mb-4" />
        <span className="text-gray-400">Cargando datos...</span>
      </div>
    )
  }

  if (error) {
    const isDatabaseError = error.message.includes('base de datos') || 
                           error.message.includes('database') ||
                           error.message.includes('conexión');
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {isDatabaseError ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error de Base de Datos</h2>
            <p className="text-red-600 text-center mb-4 max-w-md">{error.message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md">
              <h3 className="font-semibold text-red-800 mb-2">¿Qué puedes hacer?</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Verifica que Docker esté ejecutándose</li>
                <li>• Reinicia los contenedores con: <code className="bg-red-100 px-1 rounded">docker-compose restart</code></li>
                <li>• Verifica los logs del backend</li>
                <li>• Contacta al administrador del sistema</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
            <span className="text-red-600 font-semibold mb-2">Error al cargar los datos</span>
            <span className="text-gray-400 text-sm mb-4 text-center max-w-md">{error.message}</span>
          </>
        )}
        <button 
          onClick={handleManualRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!kpis) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard de Análisis</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600">No hay datos disponibles para mostrar</p>
        </div>
      </div>
    )
  }

  const { stockInicial, stockFinal, unidadesVendidas, rotacion, margenPromedio, pedidosPendientes } = kpis

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo) {
      case 'ALTO': return 'text-red-600 bg-red-50'
      case 'MEDIO': return 'text-yellow-600 bg-yellow-50'
      case 'BAJO': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'text-yellow-600 bg-yellow-50'
      case 'ENVIADO': return 'text-blue-600 bg-blue-50'
      case 'RECIBIDO': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // KPIs críticos
  const isStockCritico = stockCritico.length > 0

  return (
    <>
    <div className="bg-[#F8F9FB] min-h-screen py-4 px-2 sm:px-4">
      {/* Breadcrumbs y título */}
      <div className="max-w-md mx-auto flex items-center text-xs text-gray-400 mb-2">
        {breadcrumbs.map((b, i) => (
          <span key={b.label} className={i === breadcrumbs.length - 1 ? 'font-semibold text-gray-600' : 'hover:underline cursor-pointer transition-colors'}>{b.label}{i < breadcrumbs.length - 1 && <span className="mx-1">/</span>}</span>
        ))}
      </div>
      <div className="max-w-md mx-auto flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Congelato</h1>
        {/* Selector de mes visual */}
        <div className="relative">
          <select
            className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
            value={selectedMonth}
            onChange={handleMonthChange}
            disabled={monthLoading}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <Calendar className="absolute right-2 top-1.5 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="max-w-md mx-auto flex items-center justify-between mb-4 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Última actualización: {format(lastUpdate, 'dd/MM/yyyy HH:mm')}</span>
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? 'En línea' : 'Sin conexión'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              autoRefreshEnabled 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}
            title={autoRefreshEnabled ? 'Auto-refresh activado' : 'Auto-refresh desactivado'}
          >
            {autoRefreshEnabled ? 'Auto' : 'Manual'}
          </button>
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs mejorados */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span data-tooltip-id="kpi-inicial"><Package className="w-8 h-8 text-blue-500 mr-4" /></span>
          <div className="flex-1">
            <p className="text-xs text-gray-400 flex items-center">Inventario Total Inicial <Info className="w-3 h-3 ml-1 text-gray-300" data-tooltip-id="kpi-inicial" /></p>
            <p className="text-2xl font-bold text-gray-800">{kpis?.stockInicial ?? '--'}</p>
          </div>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span data-tooltip-id="kpi-vendidas"><TrendingUp className="w-8 h-8 text-green-500 mr-4" /></span>
          <div className="flex-1">
            <p className="text-xs text-gray-400 flex items-center">Unidades Vendidas <Info className="w-3 h-3 ml-1 text-gray-300" data-tooltip-id="kpi-vendidas" /></p>
            <p className="text-2xl font-bold text-gray-800">{kpis?.unidadesVendidas ?? '--'}</p>
          </div>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span data-tooltip-id="kpi-final"><Package className="w-8 h-8 text-purple-500 mr-4" /></span>
          <div className="flex-1">
            <p className="text-xs text-gray-400 flex items-center">Inventario Final Total <Info className="w-3 h-3 ml-1 text-gray-300" data-tooltip-id="kpi-final" /></p>
            <p className="text-2xl font-bold text-gray-800">{kpis?.stockFinal ?? '--'}</p>
          </div>
        </div>
        <div className={`flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer ${isStockCritico ? 'border-2 border-orange-400' : ''}`}>
          <span data-tooltip-id="kpi-critico"><AlertTriangle className="w-8 h-8 text-orange-500 mr-4" /></span>
          <div className="flex-1">
            <p className="text-xs text-gray-400 flex items-center">Stock Crítico <Info className="w-3 h-3 ml-1 text-gray-300" data-tooltip-id="kpi-critico" />
              {isStockCritico && <Badge text="¡Atención!" color="bg-orange-100 text-orange-700" />}
            </p>
            <p className="text-lg text-gray-700">{stockCritico.length > 0 ? `${stockCritico.length} items` : 'Sin alertas'}</p>
            {stockCritico.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{stockCritico.map((p: { nombre: string; stock: number }) => `${p.nombre} (${p.stock}u)`).join(', ')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span data-tooltip-id="kpi-rotacion"><RefreshCw className="w-8 h-8 text-cyan-500 mr-4" /></span>
          <div className="flex-1">
            <p className="text-xs text-gray-400 flex items-center">Rotación <Info className="w-3 h-3 ml-1 text-gray-300" data-tooltip-id="kpi-rotacion" /></p>
            <p className="text-2xl font-bold text-gray-800">{kpis?.rotacion?.toFixed(2) ?? '--'}%</p>
          </div>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span data-tooltip-id="kpi-margen"><PercentCircle className="w-8 h-8 text-indigo-500 mr-4" /></span>
          <div className="flex-1">
            <p className="text-xs text-gray-400 flex items-center">Margen Promedio <Info className="w-3 h-3 ml-1 text-gray-300" data-tooltip-id="kpi-margen" /></p>
            <p className="text-2xl font-bold text-gray-800">{kpis?.margenPromedio?.toFixed(0) ?? '--'}%</p>
          </div>
        </div>
      </div>

      {/* KPIs adicionales con datos reales */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full mr-4 font-bold text-lg">$</span>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Valor total inventario</p>
            <p className="text-2xl font-bold text-gray-800">${kpisAdicionales.valorInventario.toLocaleString()}</p>
            <p className="text-xs text-gray-500">(por costo de compra)</p>
          </div>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full mr-4 font-bold text-lg">0</span>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Productos agotados</p>
            <p className="text-2xl font-bold text-gray-800">{kpisAdicionales.productosAgotados}</p>
            {kpisAdicionales.productosAgotados > 0 && (
              <p className="text-xs text-red-500">¡Reabastecimiento urgente!</p>
            )}
          </div>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span className="w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full mr-4 font-bold text-lg">↑</span>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Sobre stock</p>
            <p className="text-2xl font-bold text-gray-800">{kpisAdicionales.productosSobreStock}</p>
            {kpisAdicionales.productosSobreStock > 0 && (
              <p className="text-xs text-yellow-600">Considerar promociones</p>
            )}
          </div>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full mr-4 font-bold text-lg">%</span>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Mayor margen</p>
            <p className="text-lg text-gray-800">
              {kpisAdicionales.productoMayorMargen ? (
                <>
                  {kpisAdicionales.productoMayorMargen.nombre} ({(((kpisAdicionales.productoMayorMargen.precioVenta - kpisAdicionales.productoMayorMargen.precioCompra) / kpisAdicionales.productoMayorMargen.precioCompra) * 100).toFixed(0)}%)
                </>
              ) : (
                'Sin datos'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-4 font-bold text-lg">🔥</span>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Mayor rotación</p>
            <p className="text-lg text-gray-800">
              {kpisAdicionales.productoMayorRotacion ? (
                <>
                  {kpisAdicionales.productoMayorRotacion.nombre} ({kpisAdicionales.productoMayorRotacion.movimientos} ventas)
                </>
              ) : (
                'Sin datos'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center bg-white rounded-xl shadow p-4 transition hover:shadow-xl group cursor-pointer">
          <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mr-4 font-bold text-lg">📦</span>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Total productos</p>
            
            <p className="text-2xl font-bold text-gray-800">{productos.length}</p>
            <p className="text-xs text-gray-500">en inventario</p>
          </div>
        </div>
      </div>

      {/* Tarjeta de alerta de stock bajo */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-orange-800">¡Atención! Stock bajo</h3>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  Crítico
                </span>
              </div>
              <p className="text-orange-700 mb-3">
                El producto <strong>"Fresa con leche"</strong> tiene un stock crítico de <strong>5 unidades</strong>, 
                por debajo del mínimo recomendado de 20 unidades.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 font-medium">Stock actual:</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">5 unidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 font-medium">Stock mínimo:</span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">20 unidades</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                  Crear pedido urgente
                </button>
                <button className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-600 text-sm font-medium rounded-lg border border-orange-200 transition-colors">
                  Ver detalles
                </button>
                <button className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-600 text-sm font-medium rounded-lg border border-orange-200 transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-4 mb-4 transition hover:shadow-lg">
        <h2 className="text-base font-semibold text-gray-700 mb-2">Stock vs Ventas (últimos 14 días)</h2>
        {diasGraficos.length === 0 ? (
          <NoData text="No hay datos de stock/ventas para este periodo." />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={diasGraficos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8E94F2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8E94F2" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E42" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F59E42" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={fecha => format(new Date(fecha), 'd MMM')} 
                  fontSize={10} 
                />
                <YAxis allowDecimals={false} fontSize={10} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'stock' ? `${value.toLocaleString()} unidades` : `${value.toLocaleString()} ventas`,
                    name === 'stock' ? 'Stock Disponible' : 'Ventas del Día'
                  ]} 
                  labelFormatter={(label) => format(new Date(label), 'EEEE, dd/MM/yyyy')}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="stock" 
                  stroke="#8E94F2" 
                  strokeWidth={2}
                  fill="url(#stockGradient)"
                  name="Stock"
                />
                <Area 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#F59E42" 
                  strokeWidth={2}
                  fill="url(#ventasGradient)"
                  name="Ventas"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#8E94F2] rounded"></div>
                  <span>Stock disponible</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#F59E42] rounded-full"></div>
                  <span>Ventas diarias</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Período: {diasGraficos.length > 0 ? `${format(new Date(diasGraficos[0].fecha), 'dd/MM')} - ${format(new Date(diasGraficos[diasGraficos.length-1].fecha), 'dd/MM')}` : ''}
              </p>
            </div>
            {/* Estadísticas adicionales del gráfico */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-400">Stock promedio</p>
                <p className="text-lg font-semibold text-gray-800">
                  {diasGraficos.length > 0 ? Math.round(diasGraficos.reduce((acc: number, d: any) => acc + d.stock, 0) / diasGraficos.length) : 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Ventas totales</p>
                <p className="text-lg font-semibold text-gray-800">
                  {diasGraficos.length > 0 ? diasGraficos.reduce((acc: number, d: any) => acc + d.ventas, 0) : 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Día más ventas</p>
                <p className="text-lg font-semibold text-gray-800">
                  {diasGraficos.length > 0 ? format(new Date(diasGraficos.reduce((max: any, d: any) => d.ventas > max.ventas ? d : max).fecha), 'dd/MM') : '--'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nueva gráfica de eficiencia */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-4 mb-4 transition hover:shadow-lg">
        <h2 className="text-base font-semibold text-gray-700 mb-2">Eficiencia de Rotación</h2>
        {diasGraficos.length === 0 ? (
          <NoData text="No hay datos suficientes para calcular eficiencia." />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={diasGraficos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={fecha => format(new Date(fecha), 'd MMM')} 
                  fontSize={10} 
                />
                <YAxis fontSize={10} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value.toFixed(1)}%`,
                    name === 'eficiencia' ? 'Eficiencia de Rotación' : 'Tendencia'
                  ]} 
                  labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="eficiencia" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  dot={{ fill: '#10B981', r: 4 }} 
                  name="Eficiencia"
                />
          </LineChart>
        </ResponsiveContainer>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
                <span>Eficiencia de rotación diaria (%)</span>
              </div>
              <p className="text-xs text-gray-400">
                Meta: {'>'}20% diario
              </p>
            </div>
          </>
        )}
      </div>

      {/* Recomendaciones IA */}
      <div className="max-w-md mx-auto">
        <h2 className="text-base font-semibold text-gray-700 mb-2 flex items-center">
          <img src="/favicon.ico" alt="IA" className="w-5 h-5 mr-2" />
          Agente IAM Recomienda
          <Info className="w-4 h-4 ml-1 text-gray-300 cursor-pointer" data-tooltip-id="ia-ayuda" />
          <ReactTooltip id="ia-ayuda" place="top" content="Recomendaciones generadas automáticamente según el estado del inventario." />
        </h2>
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow p-4 flex items-center transition hover:shadow-lg">
            <span className="mr-3 text-2xl">⏳</span>
            <div>
              <h3 className="font-bold text-gray-800">Predicción de quiebre de stock</h3>
              <p className="text-xs text-gray-500">Quiebre de stock estimado<br />Cree que se agotará en aproximadamente 5 días si continúa la demanda actual.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex items-center transition hover:shadow-lg">
            <span className="mr-3 text-2xl">🐢</span>
            <div>
              <h3 className="font-bold text-gray-800">Baja rotación</h3>
              <p className="text-xs text-gray-500">Producto con baja rotación.<br />Checador ha tenido menor salida en los últimos 2 meses.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex items-center transition hover:shadow-lg">
            <span className="mr-3 text-2xl">📦</span>
            <div>
              <h3 className="font-bold text-gray-800">Sugerencia de reorden</h3>
              <p className="text-xs text-gray-500">Reabastecimiento recomendado.<br />Fresa con leche debería reponerse a 600 unidades antes del 4 de julio.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex items-center transition hover:shadow-lg">
            <span className="mr-3 text-2xl">✅</span>
            <div>
              <h3 className="font-bold text-gray-800">Crear Flyer</h3>
              <p className="text-xs text-gray-500">Genera un flyer y publícalo el viernes 10am.<br />Se sugiere promoción visual para "Sabores de temporada" para aumentar las ventas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Notificación de actualización automática */}
    {showUpdateNotification && (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Datos actualizados automáticamente</span>
        </div>
      </div>
    )}
    </>
  )
}
