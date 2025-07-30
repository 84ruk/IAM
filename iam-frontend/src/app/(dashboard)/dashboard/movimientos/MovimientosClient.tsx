'use client'

import { MovimientosResponse } from '@/types/movimiento'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { formatearCantidadConUnidad } from '@/lib/pluralization'
import { 
  Plus, 
  Search, 
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  RotateCcw,
  MessageCircle,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import Select from '@/components/ui/Select'

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

// Función para formatear fecha en español
const formatearFechaEspanol = (fecha: string): string => {
  return format(new Date(fecha), 'dd/MM/yyyy HH:mm')
}

export default function MovimientosClient() {
  const { data: response, error, isLoading, mutate } = useSWR<MovimientosResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/movimientos`,
    fetcher
  )

  const router = useRouter()
  const [filtro, setFiltro] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SALIDA'>('TODOS')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [movimientosExpandidos, setMovimientosExpandidos] = useState<Set<number>>(new Set())

  // Extraer estadísticas de la respuesta
  const estadisticas = response?.estadisticas || { total: 0, entradas: 0, salidas: 0, hoy: 0 }
  
  // Memoizar fecha de hoy para evitar recálculos
  const fechaHoy = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])
  
  // Memoizar estados de filtros activos para optimizar renders
  const filtrosActivos = useMemo(() => ({
    total: filtro === '' && filtroTipo === 'TODOS' && filtroFecha === '',
    entradas: filtroTipo === 'ENTRADA' && filtro === '' && filtroFecha === '',
    salidas: filtroTipo === 'SALIDA' && filtro === '' && filtroFecha === '',
    hoy: filtroFecha === fechaHoy && filtro === '' && filtroTipo === 'TODOS'
  }), [filtro, filtroTipo, filtroFecha, fechaHoy])

  // Filtrar movimientos
  const movimientosFiltrados = useMemo(() => {
    const movimientosData = response?.movimientos || []
    
    return movimientosData.filter(movimiento => {
      const cumpleFiltroTexto = filtro === '' || 
        movimiento.producto?.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        movimiento.motivo?.toLowerCase().includes(filtro.toLowerCase()) ||
        movimiento.descripcion?.toLowerCase().includes(filtro.toLowerCase())
      
      const cumpleFiltroTipo = filtroTipo === 'TODOS' || movimiento.tipo === filtroTipo
      
      const cumpleFiltroFecha = filtroFecha === '' || 
        format(new Date(movimiento.fecha), 'yyyy-MM-dd') === filtroFecha
      
      return cumpleFiltroTexto && cumpleFiltroTipo && cumpleFiltroFecha
    })
  }, [response?.movimientos, filtro, filtroTipo, filtroFecha])

  // KPIs dinámicos basados en filtros aplicados
  const kpisFiltrados = useMemo(() => {
    if (!movimientosFiltrados.length) return { totalUnidades: 0, productoMasMovido: null }
    
    const totalUnidades = movimientosFiltrados.reduce((acc, mov) => acc + mov.cantidad, 0)
    
    // Producto más movido
    const productosCount = movimientosFiltrados.reduce((acc, mov) => {
      const key = mov.producto?.nombre || 'Producto no disponible'
      acc[key] = (acc[key] || 0) + mov.cantidad
      return acc
    }, {} as Record<string, number>)
    
    const productoMasMovido = Object.entries(productosCount).reduce((max, [producto, cantidad]) => 
      cantidad > max.cantidad ? { producto, cantidad } : max
    , { producto: '', cantidad: 0 })
    
    return {
      totalUnidades,
      productoMasMovido: productoMasMovido.cantidad > 0 ? productoMasMovido : null
    }
  }, [movimientosFiltrados])

  // Función para alternar expansión de movimiento
  const toggleExpansion = (movimientoId: number) => {
    const newSet = new Set(movimientosExpandidos)
    if (newSet.has(movimientoId)) {
      newSet.delete(movimientoId)
    } else {
      newSet.add(movimientoId)
    }
    setMovimientosExpandidos(newSet)
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
            <div className="text-red-600 text-lg font-medium mb-2">Error al cargar movimientos</div>
            <p className="text-red-500 text-sm">Por favor, intenta recargar la página</p>
            <button
              onClick={() => mutate()}
              className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Movimientos</h1>
              <p className="text-gray-600 mt-1">
                Gestiona el flujo de inventario de tu empresa
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard/movimientos/eliminados"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Papelera</span>
                <span className="sm:hidden">🗑️</span>
              </Link>
              <button
                onClick={() => router.push('/dashboard/movimientos/nuevo')}
                className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-[#8E94F2] text-white rounded-xl hover:bg-[#7278e0] transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Nuevo Movimiento</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <button
              onClick={() => {
                setFiltro('')
                setFiltroTipo('TODOS')
                setFiltroFecha('')
              }}
              className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                filtrosActivos.total
                  ? 'bg-[#8E94F2] text-white border-[#8E94F2] shadow-lg'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#8E94F2] hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">TOTAL</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">{estadisticas.total}</div>
              <div className="text-xs opacity-75">movimientos</div>
            </button>

            <button
              onClick={() => {
                setFiltro('')
                setFiltroTipo('ENTRADA')
                setFiltroFecha('')
              }}
              className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                filtrosActivos.entradas
                  ? 'bg-green-500 text-white border-green-500 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-green-500 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">ENTRADAS</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">{estadisticas.entradas}</div>
              <div className="text-xs opacity-75">ingresos</div>
            </button>

            <button
              onClick={() => {
                setFiltro('')
                setFiltroTipo('SALIDA')
                setFiltroFecha('')
              }}
              className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                filtrosActivos.salidas
                  ? 'bg-red-500 text-white border-red-500 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-red-500 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">SALIDAS</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">{estadisticas.salidas}</div>
              <div className="text-xs opacity-75">egresos</div>
            </button>

            <button
              onClick={() => {
                setFiltro('')
                setFiltroTipo('TODOS')
                setFiltroFecha(fechaHoy)
              }}
              className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                filtrosActivos.hoy
                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">HOY</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">{estadisticas.hoy}</div>
              <div className="text-xs opacity-75">movimientos</div>
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
            <div className="space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por producto, motivo o descripción..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent text-sm"
                />
              </div>
              
              {/* Filtros secundarios */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as 'TODOS' | 'ENTRADA' | 'SALIDA')}
                  options={[
                    { value: 'TODOS', label: 'Todos los tipos' },
                    { value: 'ENTRADA', label: 'Entradas' },
                    { value: 'SALIDA', label: 'Salidas' }
                  ]}
                  className="mb-0 flex-1"
                />
                
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent text-sm flex-1"
                />
                
                <button
                  onClick={() => {
                    setFiltro('')
                    setFiltroTipo('TODOS')
                    setFiltroFecha('')
                  }}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm whitespace-nowrap"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* KPIs de filtros aplicados */}
          {(filtro !== '' || filtroTipo !== 'TODOS' || filtroFecha !== '') && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Resultados del filtro:</h3>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">Movimientos encontrados:</span>
                  <span className="font-semibold text-blue-800">{movimientosFiltrados.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">Total unidades:</span>
                  <span className="font-semibold text-blue-800">{kpisFiltrados.totalUnidades}</span>
                </div>
                {kpisFiltrados.productoMasMovido && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">Producto más movido:</span>
                    <span className="font-semibold text-blue-800">
                      {kpisFiltrados.productoMasMovido.producto} ({kpisFiltrados.productoMasMovido.cantidad} unidades)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lista de movimientos */}
        <div className="space-y-3 sm:space-y-4">
          {movimientosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Trash2 className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filtro ? 'No se encontraron movimientos' : 'No hay movimientos eliminados'}
              </h3>
              <p className="text-gray-600 text-center">
                {filtro 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'Los movimientos que elimines aparecerán aquí para que puedas restaurarlos'
                }
              </p>
            </div>
          ) : (
            movimientosFiltrados.map((movimiento) => (
              <div
                key={movimiento.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        movimiento.tipo === 'ENTRADA' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {movimiento.tipo === 'ENTRADA' ? (
                          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {movimiento.producto?.nombre || 'Producto no disponible'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatearCantidadConUnidad(movimiento.cantidad, movimiento.producto?.unidad || 'unidad')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {formatearFechaEspanol(movimiento.fecha)}
                        </p>
                        <p className={`text-xs px-2 py-1 rounded-full ${
                          movimiento.tipo === 'ENTRADA'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {movimiento.tipo}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => toggleExpansion(movimiento.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {movimientosExpandidos.has(movimiento.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Detalles expandidos */}
                  {movimientosExpandidos.has(movimiento.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Detalles del movimiento</h4>
                          <div className="space-y-2 text-sm">
                            {movimiento.motivo && (
                              <div className="flex items-start gap-2">
                                <MessageCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="font-medium text-gray-600">Motivo:</span>
                                  <p className="text-gray-800 break-words">{movimiento.motivo}</p>
                                </div>
                              </div>
                            )}
                            {movimiento.descripcion && (
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="font-medium text-gray-600">Descripción:</span>
                                  <p className="text-gray-800 break-words">{movimiento.descripcion}</p>
                                </div>
                              </div>
                            )}
                            {movimiento.producto?.proveedor && (
                              <div className="flex items-start gap-2">
                                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="font-medium text-gray-600">Proveedor:</span>
                                  <p className="text-gray-800 break-words">{movimiento.producto.proveedor.nombre}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Acciones</h4>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Link
                              href={`/dashboard/movimientos/${movimiento.id}`}
                              className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver detalles
                            </Link>
                            <Link
                              href={`/dashboard/movimientos/${movimiento.id}/editar`}
                              className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Editar
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 