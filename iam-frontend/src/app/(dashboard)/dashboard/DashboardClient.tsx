'use client'

import useSWR from 'swr'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, AreaChart, Area } from 'recharts'
import { useMemo, useState, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { useAutoRefresh } from '@/lib/useAutoRefresh'
import { useAllKPIs } from '@/hooks/useKPIs'
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
  WifiOff,
  Target,
  Activity,
  TrendingDown,
  Upload,
  Plus,
  ArrowRight
} from 'lucide-react'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { Loader2 } from 'lucide-react'
import Select from '@/components/ui/Select'
import KPICard from '@/components/dashboard/KPICard'
import DailyMovementsChart from '@/components/dashboard/DailyMovementsChart'
import { formatCurrency, formatPercentage, getValueColor } from '@/lib/kpi-utils'
import ImportacionCard from '@/components/importacion/ImportacionCard'

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

const Badge = ({ text, color }: { text: string; color: string }) => (
  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{text}</span>
)

type ProductoKPI = {
  id: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
  precioVenta: number;
  precioCompra: number;
  etiqueta: string | null;
  movimientos: number;
  cantidadMovimientos: number;
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
    refreshInterval: 120000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  })
  
  const {
    kpis: advancedKpis,
    financial: financialKpis,
    isLoading: kpisLoading,
    error: kpisError
  } = useAllKPIs('mes', 'general', 30)
  
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
  
  const handleRefresh = useCallback(async (isAuto = false) => {
    setIsRefreshing(true)
    try {
      await mutate()
      setLastUpdate(new Date())
      
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

  const handleManualRefresh = useCallback(() => {
    handleRefresh(false)
  }, [handleRefresh])

  useAutoRefresh({
    interval: 120000,
    enabled: autoRefreshEnabled && isOnline,
    onRefresh: () => handleRefresh(true)
  })

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

  useEffect(() => {
    const handleFocus = () => {
      if (autoRefreshEnabled) {
        const timeSinceLastUpdate = Date.now() - lastUpdate.getTime()
        if (timeSinceLastUpdate > 30000) {
          handleRefresh()
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [autoRefreshEnabled, handleRefresh, lastUpdate])

  const kpisAdicionales = useMemo(() => {
    if (!productos || productos.length === 0) {
      return {
        totalProductos: 0,
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

    const totalProductos = productos.length
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
      totalProductos,
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

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value))
    setMonthLoading(true)
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

  const hasNoData = !kpis || !ventasPorDia || !stockPorCategoria || 
    (Array.isArray(ventasPorDia) && ventasPorDia.length === 0) ||
    (Array.isArray(stockPorCategoria) && stockPorCategoria.length === 0) ||
    (Array.isArray(productos) && productos.length === 0);

  if (hasNoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Análisis completo de tu inventario y ventas
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Función mejorada para scroll a la sección de importación
                  const scrollToImportacion = () => {
                    try {
                      // Intentar encontrar la sección por ID
                      const importacionSection = document.getElementById('importacion-section')
                      
                      if (importacionSection) {
                        // Si se encuentra, hacer scroll suave
                        importacionSection.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        })
                        return true
                      } else {
                        // Si no se encuentra por ID, buscar por texto
                        const sections = document.querySelectorAll('div')
                        const importacionDiv = Array.from(sections).find(section => 
                          section.textContent?.includes('Importación') || 
                          section.textContent?.includes('Importar')
                        )
                        
                        if (importacionDiv) {
                          importacionDiv.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          })
                          return true
                        }
                        
                        // Fallback: scroll hacia abajo
                        window.scrollTo({
                          top: document.body.scrollHeight * 0.8,
                          behavior: 'smooth'
                        })
                        return false
                      }
                    } catch (error) {
                      console.error('Error en scroll:', error)
                      // Fallback final: scroll hacia abajo
                      window.scrollTo({
                        top: document.body.scrollHeight * 0.8,
                        behavior: 'smooth'
                      })
                      return false
                    }
                  }
                  
                  // Ejecutar la función
                  const success = scrollToImportacion()
                  
                  // Mostrar feedback visual
                  if (!success) {
                    // Si no se pudo encontrar la sección, mostrar un mensaje temporal
                    const button = event?.target as HTMLButtonElement
                    if (button) {
                      const originalText = button.innerHTML
                      button.innerHTML = '<span>Buscando...</span>'
                      setTimeout(() => {
                        button.innerHTML = originalText
                      }, 1000)
                    }
                  }
                }}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#8E94F2] to-[#7278e0] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium text-base"
              >
                <Upload className="w-5 h-5" />
                <span>Importar Datos</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#8E94F2] to-[#7278e0] rounded-full flex items-center justify-center mb-6 shadow-lg">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No hay datos disponibles</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Tu dashboard aparecerá aquí una vez que agregues productos y realices movimientos de inventario.
            </p>
            
            <div className="w-full max-w-4xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Comienza aquí</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <a 
                  href="/dashboard/productos/nuevo" 
                  className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#8E94F2] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Agregar Producto</p>
                    <p className="text-sm text-gray-600">Registra tu primer producto</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#8E94F2] transition-colors ml-auto" />
                </a>

                <a 
                  href="/dashboard/proveedores" 
                  className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#8E94F2] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <ShoppingCart className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Proveedores</p>
                    <p className="text-sm text-gray-600">Gestiona tus proveedores</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#8E94F2] transition-colors ml-auto" />
                </a>

                <a 
                  href="/dashboard/movimientos/nuevo" 
                  className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#8E94F2] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Movimientos</p>
                    <p className="text-sm text-gray-600">Registra entradas y salidas</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#8E94F2] transition-colors ml-auto" />
                </a>

                <a 
                  href="/dashboard/kpis" 
                  className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#8E94F2] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">KPIs</p>
                    <p className="text-sm text-gray-600">Ver métricas detalladas</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#8E94F2] transition-colors ml-auto" />
                </a>

                <a 
                  href="/dashboard/daily-movements" 
                  className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#8E94F2] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <Activity className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Movimientos Diarios</p>
                    <p className="text-sm text-gray-600">Análisis detallado por día</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#8E94F2] transition-colors ml-auto" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Análisis completo de tu inventario y ventas
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                console.log('Botón Importar Datos clickeado')
                
                // Verificar si el elemento existe
                const importacionSection = document.getElementById('importacion-section')
                console.log('Elemento encontrado:', importacionSection)
                
                if (importacionSection) {
                  console.log('Haciendo scroll a la sección...')
                  importacionSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                  console.log('Scroll completado')
                } else {
                  console.log('Elemento no encontrado, haciendo scroll manual...')
                  // Scroll manual hacia abajo
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                  })
                }
              }}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#8E94F2] to-[#7278e0] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium text-base"
            >
              <Upload className="w-5 h-5" />
              <span>Importar Datos</span>
            </button>

            <Select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e as any)}
              options={MONTHS.map((month, index) => ({
                value: index.toString(),
                label: month
              }))}
              className="mb-0"
            />
          </div>
        </div>

        {showUpdateNotification && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Datos actualizados automáticamente</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Productos"
            value={advancedKpis?.totalProductos || kpisAdicionales.totalProductos || 0}
            icon={Package}
            iconColor="text-blue-600"
            isLoading={kpisLoading || isLoading}
            error={!!kpisError || !!error}
          />

          <KPICard
            title="Stock Crítico"
            value={advancedKpis?.productosStockBajo || kpisAdicionales.productosCriticos || 0}
            icon={AlertTriangle}
            iconColor="text-red-600"
            valueColor="text-red-600"
            isLoading={kpisLoading || isLoading}
            error={!!kpisError || !!error}
          />

          <KPICard
            title="Valor Inventario"
            value={formatCurrency(advancedKpis?.valorTotalInventario || kpisAdicionales.valorInventario || 0)}
            icon={DollarSign}
            iconColor="text-green-600"
            isLoading={kpisLoading || isLoading}
            error={!!kpisError || !!error}
          />

          <KPICard
            title="Ventas del Mes"
            value={formatCurrency(advancedKpis?.movimientosUltimoMes || kpisAdicionales.valorVentas || 0)}
            icon={TrendingUp}
            iconColor="text-blue-600"
            isLoading={kpisLoading || isLoading}
            error={!!kpisError || !!error}
          />
        </div>

        <div className="mb-8">
          <DailyMovementsChart 
            initialDays={7}
            showControls={true}
            showSummary={true}
            chartType="combined"
            height={350}
          />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Movimientos Diarios Detallados</h2>
              <p className="text-gray-600 mt-1">
                Análisis completo de entradas y salidas de inventario por día
              </p>
            </div>
            <a 
              href="/dashboard/daily-movements" 
              className="flex items-center gap-2 px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
            >
              <Activity className="w-4 h-4" />
              Ver Detalles Completos
            </a>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de 15 Días</h3>
                <DailyMovementsChart 
                  initialDays={15}
                  showControls={false}
                  showSummary={false}
                  chartType="line"
                  height={250}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de 30 Días</h3>
                <DailyMovementsChart 
                  initialDays={30}
                  showControls={false}
                  showSummary={false}
                  chartType="bar"
                  height={250}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {financialKpis && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Indicadores Financieros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Margen Bruto"
                value={formatPercentage(financialKpis.margenBruto || 0)}
                icon={PercentCircle}
                iconColor="text-blue-600"
                valueColor={getValueColor(financialKpis.margenBruto || 0, 20)}
                isLoading={kpisLoading}
                error={!!kpisError}
              />

              <KPICard
                title="Margen Neto"
                value={formatPercentage(financialKpis.margenNeto || 0)}
                icon={Target}
                iconColor="text-purple-600"
                valueColor={getValueColor(financialKpis.margenNeto || 0, 10)}
                isLoading={kpisLoading}
                error={!!kpisError}
              />

              <KPICard
                title="ROI Inventario"
                value={formatPercentage(financialKpis.roiInventario || 0)}
                icon={TrendingUp}
                iconColor="text-green-600"
                valueColor={getValueColor(financialKpis.roiInventario || 0, 15)}
                isLoading={kpisLoading}
                error={!!kpisError}
              />

              <KPICard
                title="Eficiencia Operativa"
                value={formatPercentage(financialKpis.eficienciaOperativa || 0)}
                icon={TrendingDown}
                iconColor="text-red-600"
                valueColor={getValueColor(financialKpis.eficienciaOperativa || 0, 80)}
                isLoading={kpisLoading}
                error={!!kpisError}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

        <div id="importacion-section" className="mb-8">
          <ImportacionCard />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Métricas Adicionales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard
              title="Movimientos del Mes"
              value={advancedKpis?.movimientosUltimoMes || 0}
              icon={Activity}
              iconColor="text-indigo-600"
              isLoading={kpisLoading || isLoading}
              error={!!kpisError || !!error}
            />

            <KPICard
              title="Margen Promedio"
              value={`${kpisAdicionales.margenPromedio.toFixed(2)}%`}
              icon={PercentCircle}
              iconColor="text-purple-600"
              valueColor={getValueColor(kpisAdicionales.margenPromedio, 20)}
              isLoading={isLoading}
              error={!!error}
            />

            <KPICard
              title="Total Productos"
              value={kpisAdicionales.totalProductos || 0}
              icon={Package}
              iconColor="text-blue-600"
              isLoading={isLoading}
              error={!!error}
            />
          </div>
        </div>
      </div>
    </div>
  )
}