'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  Calendar,
  BarChart3,
  Target,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Info,
  Filter,
  Download,
  Settings,
  Eye,
  EyeOff,
  ChevronLeft,
  FileText,
  Lock,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Box,
  Clock as ClockIcon,
  Turtle,
  Cake,
  Hourglass,
  Plus,
  Search,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus,
  Zap,
  Shield,
  Users,
  ShoppingCart,
  Truck,
  Warehouse,
  Thermometer,
  Droplets,
  Gauge,
  PieChart,
  LineChart,
  BarChart,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import Pagination from '@/components/ui/Pagination'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ComposedChart, AreaChart, Area, Legend } from 'recharts'
import { KPIData, FinancialKPIs, IndustryKPIs, PredictiveKPIs, KPICardData, TrendData, ProductDetail, Recommendation } from '@/types/kpis'
import { formatCurrency, formatPercentage, getValueColor } from '@/lib/kpi-utils'
import KPICard from '@/components/dashboard/KPICard'
import KPIGraph from '@/components/dashboard/KPIGraph'
import PredictionsPanel from '@/components/dashboard/PredictionsPanel'
import TopProductsList from '@/components/dashboard/TopProductsList'
import EmptyState from '@/components/ui/EmptyState'
import { usePagination } from '@/hooks/usePagination'
import { useProducts } from '@/hooks/useProducts'
import { useProviders } from '@/hooks/useProviders'
import { useMovements } from '@/hooks/useMovements'
import { getGraphConfig, createCustomGraphConfig } from '@/config/graph-config'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`)
    }
    return res.json()
  })

// Obtener configuración dinámica de la gráfica
const graphConfig = getGraphConfig('es') // Puedes cambiar 'es' por 'en' para inglés

// Función para obtener etiquetas dinámicas
function getGraphLabels() {
  return graphConfig.labels
}

// Función para obtener colores dinámicos
function getGraphColors() {
  return graphConfig.colors
}

// Función para obtener tooltips dinámicos
function getGraphTooltips() {
  return graphConfig.tooltips
}

// Utilidad para generar datos de gráfica basados en movimientos reales
function generateChartData(movements: any[], selectedMonth: string) {
  console.log('🔍 Debug - generateChartData iniciado:')
  console.log('movements:', movements)
  console.log('selectedMonth:', selectedMonth)
  
  if (!Array.isArray(movements) || movements.length === 0) {
    console.log('⚠️ No hay movimientos disponibles, generando datos de ejemplo')
    return generateSampleData(selectedMonth)
  }
  
  if (!selectedMonth) {
    console.log('⚠️ No hay mes seleccionado, generando datos de ejemplo')
    return generateSampleData(selectedMonth)
  }
  
  try {
    console.log('🔍 Debug - generateChartData procesando:')
    console.log('selectedMonth:', selectedMonth)
    console.log('movements count:', movements.length)
    console.log('movements sample:', movements.slice(0, 3))
    
    // Obtener el primer y último día del mes seleccionado
    const [monthName, year] = selectedMonth.split(' ')
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth()
    const yearNum = parseInt(year)
    const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate()
    
    console.log('monthName:', monthName, 'year:', year)
    console.log('monthIndex:', monthIndex, 'yearNum:', yearNum, 'daysInMonth:', daysInMonth)
    
    // Crear array de días del mes con datos inicializados
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      dia: i + 1,
      entradas: 0,
      salidas: 0,
      balance: 0
    }))
    
    let processedCount = 0
    let matchedCount = 0
    let validMovements = 0
    
    // Procesar movimientos del mes seleccionado
    movements.forEach(mov => {
      processedCount++
      
      // Validar que el movimiento tenga los campos necesarios
      if (!mov.fecha || !mov.cantidad || typeof mov.cantidad !== 'number') {
        console.log('❌ Movimiento inválido:', mov)
        return
      }
      
      validMovements++
      
      const date = new Date(mov.fecha)
      const movMonth = date.getMonth()
      const movYear = date.getFullYear()
      
      console.log(`Movimiento ${processedCount}:`, {
        fecha: mov.fecha,
        tipo: mov.tipo,
        cantidad: mov.cantidad,
        movMonth,
        movYear,
        monthIndex,
        yearNum,
        matches: movMonth === monthIndex && movYear === yearNum
      })
      
      // Verificar que el movimiento pertenece al mes seleccionado
      if (movMonth === monthIndex && movYear === yearNum) {
        matchedCount++
        const day = date.getDate() - 1
        if (day >= 0 && day < daysInMonth) {
          if (mov.tipo === 'ENTRADA') {
            dailyData[day].entradas += mov.cantidad
          } else if (mov.tipo === 'SALIDA') {
            dailyData[day].salidas += mov.cantidad
          }
        }
      }
    })
    
    console.log(`✅ Procesados: ${processedCount}, Válidos: ${validMovements}, Coinciden: ${matchedCount}`)
    
    // Si no hay movimientos coincidentes, usar datos de ejemplo
    if (matchedCount === 0) {
      console.log('⚠️ No hay movimientos para este mes, usando datos de ejemplo')
      return generateSampleData(selectedMonth)
    }
    
    // Calcular balance acumulado
    let balanceAcumulado = 0
    dailyData.forEach(day => {
      balanceAcumulado += day.entradas - day.salidas
      day.balance = balanceAcumulado
    })
    
    console.log('dailyData final:', dailyData)
    return dailyData
  } catch (error) {
    console.error('❌ Error generando datos de gráfica:', error)
    return generateSampleData(selectedMonth)
  }
}

// Función para generar datos de ejemplo cuando no hay movimientos reales
function generateSampleData(selectedMonth: string) {
  console.log('📊 Generando datos de ejemplo para:', selectedMonth)
  
  // Obtener el número de días del mes
  const [monthName, year] = selectedMonth.split(' ')
  const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth()
  const yearNum = parseInt(year)
  const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate()
  
  // Generar datos de ejemplo más realistas
  const sampleData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const baseEntradas = Math.floor(Math.random() * 50) + 10
    const baseSalidas = Math.floor(Math.random() * 30) + 5
    
    return {
      dia: day,
      entradas: baseEntradas,
      salidas: baseSalidas,
      balance: 0 // Se calculará después
    }
  })
  
  // Calcular balance acumulado
  let balanceAcumulado = 0
  sampleData.forEach(day => {
    balanceAcumulado += day.entradas - day.salidas
    day.balance = balanceAcumulado
  })
  
  console.log('📊 Datos de ejemplo generados:', sampleData)
  return sampleData
}

// Utilidad para obtener meses únicos de los movimientos/productos
function getAvailableMonths(movements: any[], products: any[]) {
  const monthsSet = new Set<string>()
  
  // Agregar mes actual si no hay datos
  const currentMonth = format(new Date(), 'MMMM yyyy')
  monthsSet.add(currentMonth)
  
  movements.forEach(m => {
    if (m.fecha) {
      const date = new Date(m.fecha)
      monthsSet.add(format(date, 'MMMM yyyy'))
    }
  })
  
  products.forEach(p => {
    if (p.creadoEn) {
      const date = new Date(p.creadoEn)
      monthsSet.add(format(date, 'MMMM yyyy'))
    }
  })
  
  return Array.from(monthsSet).sort((a, b) => {
    // Ordenar por fecha real
    const [ma, ya] = a.split(' ')
    const [mb, yb] = b.split(' ')
    const da = new Date(`${ya}-${ma}-01`)
    const db = new Date(`${yb}-${mb}-01`)
    return db.getTime() - da.getTime()
  })
}

export default function KPIsClient() {
  const router = useRouter()
  
  // Estados de filtros y configuración
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'año'>('mes')
  const [industria, setIndustria] = useState<string>('general')
  const [mostrarFinancieros, setMostrarFinancieros] = useState(true)
  const [mostrarPredictivos, setMostrarPredictivos] = useState(true)
  const [vistaDetallada, setVistaDetallada] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [vistaGrafico, setVistaGrafico] = useState<'line' | 'bar' | 'area'>('line')
  
  // Estados de ordenamiento
  const [sortField, setSortField] = useState<'producto' | 'inicio' | 'movimientos' | 'final' | 'estado'>('producto')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Obtener datos de KPIs básicos
  const { data: kpisData, isLoading: kpisLoading, error: kpisError, mutate: mutateKPIs } = useSWR<KPIData>(
    `/dashboard-cqrs/kpis?period=${periodo}`,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutos
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  // Obtener KPIs financieros (solo para ADMIN y SUPERADMIN)
  const { data: financialData, isLoading: financialLoading, error: financialError, mutate: mutateFinancial } = useSWR<FinancialKPIs>(
    mostrarFinancieros ? `/dashboard-cqrs/financial-kpis?period=${periodo}` : null,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  // Obtener KPIs de industria
  const { data: industryData, isLoading: industryLoading, error: industryError, mutate: mutateIndustry } = useSWR<IndustryKPIs>(
    `/dashboard-cqrs/industry-kpis?industry=${industria}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  // Obtener KPIs predictivos
  const { data: predictiveData, isLoading: predictiveLoading, error: predictiveError, mutate: mutatePredictive } = useSWR<PredictiveKPIs>(
    mostrarPredictivos ? `/dashboard-cqrs/predictive-kpis?days=30` : null,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  // Obtener datos reales del backend
  const { products: backendProducts, isLoading: productsLoading, error: productsError } = useProducts({
    page: 1,
    limit: 100, // Obtener más productos para análisis
    estado: 'ACTIVO'
  })

  const { providers, isLoading: providersLoading, error: providersError } = useProviders()
  const { movements, isLoading: movementsLoading, error: movementsError } = useMovements()

  // Debug: Log de datos del backend
  console.log('🔍 Debug - Datos del backend:')
  console.log('movements:', movements)
  console.log('movementsLoading:', movementsLoading)
  console.log('movementsError:', movementsError)
  console.log('backendProducts:', backendProducts)
  console.log('providers:', providers)

  // Estados de carga
  const isLoading = kpisLoading || financialLoading || industryLoading || predictiveLoading || 
                   productsLoading || providersLoading || movementsLoading
  const hasError = kpisError || financialError || industryError || predictiveError || 
                  productsError || providersError || movementsError

  // Datos transformados para el prototipo
  const inventoryData = useMemo(() => {
    if (!kpisData) return null
    
    // Verificar si tenemos datos suficientes
    const hasSufficientData = typeof kpisData.totalProductos === 'number' && 
                             typeof kpisData.movimientosUltimoMes === 'number' &&
                             typeof kpisData.productosStockBajo === 'number'
    
    if (!hasSufficientData) {
      return {
        inventarioInicial: null,
        unidadesVendidas: null,
        inventarioFinal: null,
        stockCritico: null,
        rotacion: null,
        margenPromedio: null,
        valorInventario: null,
        hasData: false
      }
    }
    
    return {
      inventarioInicial: kpisData.totalProductos,
      unidadesVendidas: kpisData.movimientosUltimoMes,
      inventarioFinal: kpisData.totalProductos - kpisData.productosStockBajo,
      stockCritico: kpisData.productosStockBajo,
      rotacion: kpisData.rotacionInventario ? (kpisData.rotacionInventario * 100).toFixed(2) : null,
      margenPromedio: kpisData.margenPromedio || null,
      valorInventario: kpisData.valorTotalInventario || null,
      hasData: true
    }
  }, [kpisData])

  // Obtener meses disponibles
  const availableMonths = useMemo(() => getAvailableMonths(movements, backendProducts), [movements, backendProducts])
  
  // Inicializar mes seleccionado con el más reciente disponible
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0])
    }
  }, [availableMonths, selectedMonth])

  // Datos para gráfica basados en movimientos reales del mes seleccionado
  const { chartData, isRealData } = useMemo(() => {
    console.log('🔍 Debug - Calculando datos para gráfica:')
    console.log('selectedMonth:', selectedMonth)
    console.log('movements:', movements)
    console.log('movements length:', movements?.length)
    
    if (!selectedMonth) {
      console.log('⚠️ No hay mes seleccionado')
      return { chartData: [], isRealData: false }
    }
    
    if (!Array.isArray(movements)) {
      console.log('⚠️ Movements no es un array válido')
      return { chartData: [], isRealData: false }
    }
    
    if (movements.length === 0) {
      console.log('⚠️ No hay movimientos disponibles')
      return { chartData: generateSampleData(selectedMonth), isRealData: false }
    }
    
    // Debug: Log de datos para diagnóstico
    console.log('🔍 Debug - Datos para gráfica:')
    console.log('selectedMonth:', selectedMonth)
    console.log('movements length:', movements.length)
    console.log('movements sample:', movements.slice(0, 3))
    
    const data = generateChartData(movements, selectedMonth)
    console.log('chartData generated:', data)
    
    // Determinar si los datos son reales o de demostración
    const hasRealMovements = movements.some(mov => {
      if (!mov.fecha || !mov.cantidad) return false
      const [monthName, year] = selectedMonth.split(' ')
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth()
      const yearNum = parseInt(year)
      const date = new Date(mov.fecha)
      return date.getMonth() === monthIndex && date.getFullYear() === yearNum
    })
    
    const isReal = hasRealMovements && data.some(day => day.entradas > 0 || day.salidas > 0)
    
    console.log('isRealData:', isReal, 'hasRealMovements:', hasRealMovements)
    
    return { chartData: data, isRealData: isReal }
  }, [movements, selectedMonth])

  // Datos de productos detallados basados en datos reales del backend
  const productDetails = useMemo(() => {
    if (!backendProducts.length || !Array.isArray(movements) || !selectedMonth) return []
    
    return backendProducts.map((product) => {
      // Filtrar movimientos por mes seleccionado
      const productMovements = movements.filter(m => {
        if (!m.fecha) return false
        const movementMonth = format(new Date(m.fecha), 'MMMM yyyy')
        return m.productoId === product.id && movementMonth === selectedMonth
      })
      
      const totalMovements = productMovements.reduce((sum, m) => {
        return sum + (m.tipo === 'SALIDA' ? m.cantidad : -m.cantidad)
      }, 0)
      
      const inicio = product.stock + totalMovements
      const final = product.stock
      
      let estado: 'optimal' | 'warning' | 'critical' = 'optimal'
      if (product.stockMinimo && final <= product.stockMinimo * 0.5) {
        estado = 'critical'
      } else if (product.stockMinimo && final <= product.stockMinimo) {
        estado = 'warning'
      }
      
      return {
        id: product.id,
        mes: selectedMonth,
        producto: product.nombre,
        inicio: inicio, // Mantener como número para ordenamiento
        movimientos: Math.abs(totalMovements),
        final: final, // Mantener como número para ordenamiento
        estado,
        categoria: product.tipoProducto || 'GENERICO',
        proveedor: product.proveedor?.nombre || 'Sin proveedor'
      }
    })
  }, [backendProducts, movements, selectedMonth])

  // Función para ordenar productos
  const sortedProducts = useMemo(() => {
    return [...productDetails].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      
      // Ordenamiento especial para estado
      if (sortField === 'estado') {
        const estadoOrder = { critical: 3, warning: 2, optimal: 1 }
        aValue = estadoOrder[a.estado]
        bValue = estadoOrder[b.estado]
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [productDetails, sortField, sortDirection])

  // Función para filtrar productos
  const filteredProducts = useMemo(() => {
    return sortedProducts.filter(product => {
      const categoriaMatch = !filtroCategoria || product.categoria === filtroCategoria
      const proveedorMatch = !filtroProveedor || product.proveedor === filtroProveedor
      const estadoMatch = !filtroEstado || product.estado === filtroEstado
      
      return categoriaMatch && proveedorMatch && estadoMatch
    })
  }, [sortedProducts, filtroCategoria, filtroProveedor, filtroEstado])

  // Hook de paginación
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    currentItems: currentProducts,
    setCurrentPage,
    setItemsPerPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    canGoToNextPage,
    canGoToPreviousPage
  } = usePagination({
    data: filteredProducts,
    itemsPerPage: 10,
    initialPage: 1
  })

  // Función para cambiar página
  const handlePageChange = (page: number) => {
    console.log('Cambiando página:', { page, totalPages })
    goToPage(page)
  }

  // Función para cambiar ordenamiento
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Función para limpiar filtros
  const handleClearFilters = () => {
    console.log('Limpiando filtros...')
    setFiltroCategoria('')
    setFiltroProveedor('')
    setFiltroEstado('')
    setCurrentPage(1)
  }

  // Recomendaciones basadas en datos predictivos
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = []
    
    if (predictiveData?.prediccionQuiebres && predictiveData.prediccionQuiebres.length > 0) {
      const quiebre = predictiveData.prediccionQuiebres[0]
      recs.push({
        type: 'stockout',
        icon: Hourglass,
        title: 'Predicción de quiebre de stock',
        description: `${quiebre.nombre} se agotará en aproximadamente ${Math.ceil((new Date(quiebre.fechaPrediccion).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        priority: 'high'
      })
    }
    
    if (kpisData && kpisData.productosStockBajo > 0) {
      recs.push({
        type: 'reorder',
        icon: Box,
        title: 'Reabastecimiento recomendado',
        description: `${kpisData.productosStockBajo} productos requieren reabastecimiento inmediato`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        priority: 'medium'
      })
    }
    
    if (predictiveData?.tendenciasVentas?.tendencia === 'DECRECIENTE') {
      recs.push({
        type: 'marketing',
        icon: TrendingDown,
        title: 'Tendencia de ventas decreciente',
        description: `Las ventas han disminuido un ${Math.abs(predictiveData.tendenciasVentas.porcentajeCambio)}% en el último período`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        priority: 'medium'
      })
    }
    
    if (financialData && financialData.eficienciaOperativa < 80) {
      recs.push({
        type: 'low-rotation',
        icon: Turtle,
        title: 'Eficiencia operativa baja',
        description: `La eficiencia operativa es del ${financialData.eficienciaOperativa.toFixed(1)}%, considera optimizar procesos`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        priority: 'low'
      })
    }
    
    return recs
  }, [predictiveData, kpisData, financialData])

  // Función para refrescar todos los datos
  const handleRefresh = async () => {
    try {
      await Promise.all([
        mutateKPIs(),
        mutateFinancial(),
        mutateIndustry(),
        mutatePredictive()
      ])
      setLastRefresh(new Date())
    } catch (error) {
      setError('Error al refrescar los datos')
      setTimeout(() => setError(null), 5000)
    }
  }

  // Función para generar plan de reabastecimiento
  const handleGenerateReplenishmentPlan = () => {
    console.log('Generando plan de reabastecimiento...')
  }

  // Función para recomendar precios
  const handleRecommendPrices = () => {
    console.log('Generando recomendaciones de precios...')
  }

  // Función para aplicar filtros
  const handleApplyFilters = () => {
    console.log('Aplicando filtros...', { filtroCategoria, filtroProveedor, filtroEstado })
  }

  // Función para exportar datos
  const handleExport = () => {
    const data = {
      kpis: kpisData,
      financial: financialData,
      industry: industryData,
      predictive: predictiveData,
      exportDate: new Date().toISOString(),
      periodo,
      industria
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kpis-${periodo}-${industria}-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error al cargar KPIs</div>
            <p className="text-red-500 text-sm mb-4">Por favor, intenta recargar la página</p>
            <button
              onClick={handleRefresh}
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
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header con navegación */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-[#8E94F2]" />
                Análisis de Inventario
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                KPIs en tiempo real basados en datos del sistema
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setVistaDetallada(!vistaDetallada)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200 text-sm"
              >
                {vistaDetallada ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">{vistaDetallada ? 'Vista Simple' : 'Vista Detallada'}</span>
                <span className="sm:hidden">{vistaDetallada ? 'Simple' : 'Detallada'}</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200 text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">📥</span>
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#8E94F2] text-white rounded-xl hover:bg-[#7278e0] transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Actualizar</span>
                <span className="sm:hidden">🔄</span>
              </button>
            </div>
          </div>

          {/* Información de última actualización */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mb-4 gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Última actualización: {format(lastRefresh, 'dd/MM/yyyy HH:mm')}
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Los datos se actualizan automáticamente cada 5 minutos</span>
              <span className="sm:hidden">Auto-actualización cada 5 min</span>
            </div>
          </div>
        </div>

        {/* KPIs Principales - Grid de 6 tarjetas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {/* Total Productos */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs border border-gray-200 rounded px-1 sm:px-2 py-1 bg-gray-50"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {kpisData?.totalProductos !== undefined ? kpisData.totalProductos : '--'}
              </div>
              <div className="text-xs text-gray-500">
                {kpisData?.totalProductos !== undefined ? 'Total Productos' : 'Datos insuficientes'}
              </div>
            </CardContent>
          </Card>

          {/* Productos Stock Bajo */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {kpisData?.productosStockBajo !== undefined ? kpisData.productosStockBajo : '--'}
              </div>
              <div className="text-xs text-gray-500">
                {kpisData?.productosStockBajo !== undefined ? 'Stock Crítico' : 'Datos insuficientes'}
              </div>
            </CardContent>
          </Card>

          {/* Movimientos Último Mes */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {kpisData?.movimientosUltimoMes !== undefined ? kpisData.movimientosUltimoMes : '--'}
              </div>
              <div className="text-xs text-gray-500">
                {kpisData?.movimientosUltimoMes !== undefined ? 'Movimientos del Mes' : 'Datos insuficientes'}
              </div>
            </CardContent>
          </Card>

          {/* Valor Total Inventario */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {kpisData?.valorTotalInventario !== undefined ? formatCurrency(kpisData.valorTotalInventario) : '--'}
              </div>
              <div className="text-xs text-gray-500">
                {kpisData?.valorTotalInventario !== undefined ? 'Valor Inventario' : 'Datos insuficientes'}
              </div>
            </CardContent>
          </Card>

          {/* Rotación Inventario */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {kpisData?.rotacionInventario !== undefined ? kpisData.rotacionInventario.toFixed(2) : '--'}
              </div>
              <div className="text-xs text-gray-500">
                {kpisData?.rotacionInventario !== undefined ? 'Rotación' : 'Datos insuficientes'}
              </div>
            </CardContent>
          </Card>

          {/* Margen Promedio */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {kpisData?.margenPromedio !== undefined ? formatCurrency(kpisData.margenPromedio) : '--'}
              </div>
              <div className="text-xs text-gray-500">
                {kpisData?.margenPromedio !== undefined ? 'Margen Promedio' : 'Datos insuficientes'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPIs Financieros */}
        {mostrarFinancieros && financialData && (
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Indicadores Financieros
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-green-600">
                    {formatPercentage(financialData.margenBruto)}
                  </div>
                  <div className="text-xs text-gray-500">Margen Bruto</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-blue-600">
                    {formatPercentage(financialData.margenNeto)}
                  </div>
                  <div className="text-xs text-gray-500">Margen Neto</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-purple-600">
                    {formatPercentage(financialData.roiInventario)}
                  </div>
                  <div className="text-xs text-gray-500">ROI Inventario</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-orange-600">
                    {financialData.eficienciaOperativa.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Eficiencia Operativa</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Gráfica Universal: Entradas vs Salidas */}
        <Card className="bg-white shadow-sm border-0 mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Flujo de Inventario: Entradas vs Salidas</h3>
                <p className="text-sm text-gray-600">Movimientos diarios del mes seleccionado</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-sm border border-gray-200 rounded px-2 sm:px-3 py-1 bg-gray-50"
                  >
                    {availableMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVistaGrafico('line')}
                    className={`p-2 rounded ${vistaGrafico === 'line' ? 'bg-[#8E94F2] text-white' : 'bg-gray-100 text-gray-600'}`}
                    title="Gráfica de líneas"
                  >
                    <LineChart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setVistaGrafico('bar')}
                    className={`p-2 rounded ${vistaGrafico === 'bar' ? 'bg-[#8E94F2] text-white' : 'bg-gray-100 text-gray-600'}`}
                    title="Gráfica de barras"
                  >
                    <BarChart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setVistaGrafico('area')}
                    className={`p-2 rounded ${vistaGrafico === 'area' ? 'bg-[#8E94F2] text-white' : 'bg-gray-100 text-gray-600'}`}
                    title="Gráfica de áreas"
                  >
                    <PieChart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Gráfica */}
            <div className="h-64 sm:h-80">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-base sm:text-lg font-medium mb-2">Sin datos disponibles</p>
                    <p className="text-sm">No hay movimientos registrados para {selectedMonth}</p>
                    <p className="text-xs text-gray-400 mt-2">Agrega movimientos de inventario para ver la gráfica</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {vistaGrafico === 'line' ? (
                    <RechartsLineChart data={chartData}>
                      <XAxis 
                        dataKey="dia" 
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: getGraphLabels().diaDelMes, position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: getGraphLabels().cantidad, angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: string) => [
                          `${value} ${getGraphLabels().unidades}`, 
                          name === 'entradas' ? getGraphTooltips().entradas : 
                          name === 'salidas' ? getGraphTooltips().salidas : 
                          getGraphTooltips().balance
                        ]}
                        labelFormatter={(label) => `Día ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="entradas" 
                        stroke={getGraphColors().entradas} 
                        strokeWidth={2}
                        name={getGraphTooltips().entradas}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="salidas" 
                        stroke={getGraphColors().salidas} 
                        strokeWidth={2}
                        name={getGraphTooltips().salidas}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke={getGraphColors().balance} 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name={getGraphTooltips().balance}
                      />
                    </RechartsLineChart>
                  ) : vistaGrafico === 'bar' ? (
                    <RechartsBarChart data={chartData}>
                      <XAxis 
                        dataKey="dia" 
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: getGraphLabels().diaDelMes, position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: getGraphLabels().cantidad, angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: string) => [
                          `${value} ${getGraphLabels().unidades}`, 
                          name === 'entradas' ? getGraphTooltips().entradas : 
                          name === 'salidas' ? getGraphTooltips().salidas : 
                          getGraphTooltips().balance
                        ]}
                        labelFormatter={(label) => `Día ${label}`}
                      />
                      <Bar dataKey="entradas" fill={getGraphColors().entradas} name={getGraphTooltips().entradas} />
                      <Bar dataKey="salidas" fill={getGraphColors().salidas} name={getGraphTooltips().salidas} />
                    </RechartsBarChart>
                  ) : (
                    <AreaChart data={chartData}>
                      <XAxis 
                        dataKey="dia" 
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: getGraphLabels().diaDelMes, position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: getGraphLabels().cantidad, angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: string) => [
                          `${value} ${getGraphLabels().unidades}`, 
                          name === 'entradas' ? getGraphTooltips().entradas : 
                          name === 'salidas' ? getGraphTooltips().salidas : 
                          getGraphTooltips().balance
                        ]}
                        labelFormatter={(label) => `Día ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="entradas" 
                        stackId="1"
                        stroke={getGraphColors().entradas} 
                        fill={getGraphColors().entradas}
                        fillOpacity={0.6}
                        name={getGraphTooltips().entradas}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="salidas" 
                        stackId="1"
                        stroke={getGraphColors().salidas} 
                        fill={getGraphColors().salidas}
                        fillOpacity={0.6}
                        name={getGraphTooltips().salidas}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Indicador de tipo de datos */}
            {chartData.length > 0 && (
              <div className="mt-4 text-center">
                {isRealData ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">Datos reales del sistema</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-yellow-600 font-medium">Datos de demostración</span>
                  </div>
                )}
              </div>
            )}

            {/* Leyenda personalizada */}
            <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getGraphColors().entradas }}></div>
                <span className="text-sm font-medium text-gray-700">{getGraphLabels().entradas}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getGraphColors().salidas }}></div>
                <span className="text-sm font-medium text-gray-700">{getGraphLabels().salidas}</span>
              </div>
            </div>

            {/* Resumen de datos */}
            {chartData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getGraphColors().entradas }}>
                    {chartData.reduce((sum, day) => sum + day.entradas, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total {getGraphLabels().entradas}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getGraphColors().salidas }}>
                    {chartData.reduce((sum, day) => sum + day.salidas, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total {getGraphLabels().salidas}</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${chartData[chartData.length - 1]?.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {chartData[chartData.length - 1]?.balance || 0}
                  </div>
                  <div className="text-sm text-gray-600">{getGraphLabels().balance} Final</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalles de Productos */}
        <Card className="bg-white shadow-sm border-0 mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Detalles de Productos</h3>
                <p className="text-sm text-gray-600">Análisis detallado del inventario por producto</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMostrarFinancieros(!mostrarFinancieros)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">Financieros</span>
                  <span className="sm:hidden">💰</span>
                </button>
                <button
                  onClick={() => setMostrarPredictivos(!mostrarPredictivos)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Predictivos</span>
                  <span className="sm:hidden">🎯</span>
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent text-sm"
                  >
                    <option value="">Todas las categorías</option>
                    {Array.from(new Set(backendProducts.map(p => p.tipoProducto).filter(Boolean))).map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <select
                    value={filtroProveedor}
                    onChange={(e) => setFiltroProveedor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent text-sm"
                  >
                    <option value="">Todos los proveedores</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.nombre}>{provider.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent text-sm"
                  >
                    <option value="">Todos los estados</option>
                    <option value="critical">Crítico</option>
                    <option value="warning">Advertencia</option>
                    <option value="optimal">Óptimo</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyFilters}
                    className="flex-1 px-3 sm:px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors text-sm"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th 
                      className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('producto')}
                    >
                      <div className="flex items-center gap-1">
                        <span className="hidden sm:inline">Nombre de producto</span>
                        <span className="sm:hidden">Producto</span>
                        {sortField === 'producto' && (
                          sortDirection === 'asc' ? 
                            <ArrowUpRight className="w-3 h-3" /> : 
                            <ArrowDownRight className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('inicio')}
                    >
                      <div className="flex items-center gap-1">
                        Inicio
                        {sortField === 'inicio' && (
                          sortDirection === 'asc' ? 
                            <ArrowUpRight className="w-3 h-3" /> : 
                            <ArrowDownRight className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('movimientos')}
                    >
                      <div className="flex items-center gap-1">
                        <span className="hidden sm:inline">Movimientos</span>
                        <span className="sm:hidden">Mov.</span>
                        {sortField === 'movimientos' && (
                          sortDirection === 'asc' ? 
                            <ArrowUpRight className="w-3 h-3" /> : 
                            <ArrowDownRight className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('final')}
                    >
                      <div className="flex items-center gap-1">
                        Final
                        {sortField === 'final' && (
                          sortDirection === 'asc' ? 
                            <ArrowUpRight className="w-3 h-3" /> : 
                            <ArrowDownRight className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('estado')}
                    >
                      <div className="flex items-center gap-1">
                        Estado
                        {sortField === 'estado' && (
                          sortDirection === 'asc' ? 
                            <ArrowUpRight className="w-3 h-3" /> : 
                            <ArrowDownRight className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">
                      <span className="hidden sm:inline">Categoría</span>
                      <span className="sm:hidden">Cat.</span>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">
                      <span className="hidden sm:inline">Proveedor</span>
                      <span className="sm:hidden">Prov.</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.length !== 0 && (
                    currentProducts.map((product, index) => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-900">
                          <span className="truncate block max-w-[120px] sm:max-w-none">{product.producto}</span>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">{product.inicio}</td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">{product.movimientos}</td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">{product.final}</td>
                        <td className="py-3 px-2 sm:px-4">
                          {product.estado === 'critical' && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                              <span className="text-xs text-red-600">Crítico</span>
                            </div>
                          )}
                          {product.estado === 'warning' && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                              <span className="text-xs text-yellow-600">Advertencia</span>
                            </div>
                          )}
                          {product.estado === 'optimal' && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                              <span className="text-xs text-green-600">Óptimo</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">
                          <span className="truncate block max-w-[80px] sm:max-w-none">{product.categoria}</span>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">
                          <span className="font-medium truncate block max-w-[100px] sm:max-w-none">{product.proveedor}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
                onItemsPerPageChange={setItemsPerPage}
                showItemsPerPage={true}
              />
            </div>

            {/* Estado vacío */}
            {currentProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-500">No se encontraron productos con los filtros aplicados</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-2 text-[#8E94F2] hover:text-[#7278e0] text-sm"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agente IAM Recomienda */}
        {recommendations.length > 0 && (
          <Card className="bg-white shadow-sm border-0 mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <Cake className="w-5 h-5 sm:w-6 sm:h-6 text-[#8E94F2]" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Agente IAM Recomienda</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className={`p-3 sm:p-4 rounded-lg border ${recommendation.bgColor}`}>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <recommendation.icon className={`w-5 h-5 sm:w-6 sm:h-6 mt-1 ${recommendation.color}`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{recommendation.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">{recommendation.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Predictivos */}
        {mostrarPredictivos && predictiveData && (
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              Análisis Predictivo
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {predictiveData.prediccionDemanda.length > 0 && (
                <Card className="bg-white shadow-sm border-0">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Predicción de Demanda</h3>
                    <div className="space-y-3">
                      {predictiveData.prediccionDemanda.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.nombre}</p>
                            <p className="text-xs sm:text-sm text-gray-600">Demanda estimada: {item.demandaEstimada}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-sm font-medium text-blue-600">{item.confianza}%</p>
                            <p className="text-xs text-gray-500">Confianza</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {predictiveData.prediccionQuiebres.length > 0 && (
                <Card className="bg-white shadow-sm border-0">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Riesgo de Quiebre</h3>
                    <div className="space-y-3">
                      {predictiveData.prediccionQuiebres.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.nombre}</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {format(new Date(item.fechaPrediccion), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-sm font-medium text-red-600">{item.probabilidad}%</p>
                            <p className="text-xs text-gray-500">Probabilidad</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handleGenerateReplenishmentPlan}
            className="flex-1 px-4 sm:px-6 py-3 bg-[#8E94F2] text-white rounded-xl hover:bg-[#7278e0] transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base"
          >
            Generar plan de reabastecimiento
          </button>
          <button
            onClick={handleRecommendPrices}
            className="flex-1 px-4 sm:px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-sm sm:text-base"
          >
            Recomendar precios
          </button>
        </div>
      </div>
    </div>
  )
} 