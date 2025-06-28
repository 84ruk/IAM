// src/app/dashboard/movimientos/page.tsx
'use client'

import useSWR from 'swr'
import { Movimiento, MovimientosResponse } from '@/types/movimiento'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import { pluralizarUnidad, formatearCantidadConUnidad } from '@/lib/pluralization'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
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

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

// Función para formatear fecha en español
const formatearFechaEspanol = (fecha: string): string => {
  return format(new Date(fecha), 'dd/MM/yyyy HH:mm')
}

export default function MovimientosPage() {
  const { data: response, error, isLoading, mutate } = useSWR<MovimientosResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/movimientos`,
    fetcher
  )

  const router = useRouter()
  const [filtro, setFiltro] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SALIDA'>('TODOS')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [movimientosExpandidos, setMovimientosExpandidos] = useState<Set<number>>(new Set())

  // Extraer movimientos y estadísticas de la respuesta
  const movimientos = response?.movimientos || []
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
    if (!movimientos) return []
    

    
    return movimientos.filter(movimiento => {
      const cumpleFiltroTexto = filtro === '' || 
        movimiento.producto.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        movimiento.motivo?.toLowerCase().includes(filtro.toLowerCase()) ||
        movimiento.descripcion?.toLowerCase().includes(filtro.toLowerCase())
      
      const cumpleFiltroTipo = filtroTipo === 'TODOS' || movimiento.tipo === filtroTipo
      
      const cumpleFiltroFecha = filtroFecha === '' || 
        format(new Date(movimiento.fecha), 'yyyy-MM-dd') === filtroFecha
      
      return cumpleFiltroTexto && cumpleFiltroTipo && cumpleFiltroFecha
    })
  }, [movimientos, filtro, filtroTipo, filtroFecha])

  // KPIs dinámicos basados en filtros aplicados
  const kpisFiltrados = useMemo(() => {
    if (!movimientosFiltrados.length) return { totalUnidades: 0, productoMasMovido: null }
    
    const totalUnidades = movimientosFiltrados.reduce((acc, mov) => acc + mov.cantidad, 0)
    
    // Producto más movido
    const productosCount = movimientosFiltrados.reduce((acc, mov) => {
      const key = mov.producto.nombre
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
    <div className="min-h-screen ">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Movimientos</h1>
              <p className="text-gray-600 mt-1">
                Gestiona el flujo de inventario de tu empresa
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/movimientos/eliminados"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200"
              >
                <Trash2 className="w-4 h-4" />
                Papelera
              </Link>
              <button
                onClick={() => router.push('/dashboard/movimientos/nuevo')}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#8E94F2] text-white rounded-xl hover:bg-[#7278e0] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Nuevo Movimiento</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => {
                setFiltro('')
                setFiltroTipo('TODOS')
                setFiltroFecha('')
              }}
              className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border transition-all duration-200 text-left group ${
                filtrosActivos.total
                  ? 'border-blue-300 shadow-md bg-blue-50'
                  : 'border-gray-100 hover:shadow-md hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg transition-colors ${
                  filtrosActivos.total ? 'bg-blue-200' : 'bg-blue-100 group-hover:bg-blue-200'
                }`}>
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">{estadisticas.total}</span>
              </div>
              <h3 className={`text-xs sm:text-sm font-medium transition-colors ${
                filtrosActivos.total ? 'text-blue-700' : 'text-gray-600 group-hover:text-blue-700'
              }`}>Total Movimientos</h3>
            </button>

            <button
              onClick={() => {
                setFiltro('')
                setFiltroTipo('ENTRADA')
                setFiltroFecha('')
              }}
              className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border transition-all duration-200 text-left group ${
                filtrosActivos.entradas
                  ? 'border-green-300 shadow-md bg-green-50'
                  : 'border-gray-100 hover:shadow-md hover:border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg transition-colors ${
                  filtrosActivos.entradas ? 'bg-green-200' : 'bg-green-100 group-hover:bg-green-200'
                }`}>
                  <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">{estadisticas.entradas}</span>
              </div>
              <h3 className={`text-xs sm:text-sm font-medium transition-colors ${
                filtrosActivos.entradas ? 'text-green-700' : 'text-gray-600 group-hover:text-green-700'
              }`}>Entradas</h3>
            </button>

            <button
              onClick={() => {
                setFiltro('')
                setFiltroTipo('SALIDA')
                setFiltroFecha('')
              }}
              className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border transition-all duration-200 text-left group ${
                filtrosActivos.salidas
                  ? 'border-red-300 shadow-md bg-red-50'
                  : 'border-gray-100 hover:shadow-md hover:border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg transition-colors ${
                  filtrosActivos.salidas ? 'bg-red-200' : 'bg-red-100 group-hover:bg-red-200'
                }`}>
                  <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">{estadisticas.salidas}</span>
              </div>
              <h3 className={`text-xs sm:text-sm font-medium transition-colors ${
                filtrosActivos.salidas ? 'text-red-700' : 'text-gray-600 group-hover:text-red-700'
              }`}>Salidas</h3>
            </button>

            <button
              onClick={() => {
                setFiltro('')
                setFiltroTipo('TODOS')
                setFiltroFecha(fechaHoy)
              }}
              className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border transition-all duration-200 text-left group ${
                filtrosActivos.hoy
                  ? 'border-purple-300 shadow-md bg-purple-50'
                  : 'border-gray-100 hover:shadow-md hover:border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg transition-colors ${
                  filtrosActivos.hoy ? 'bg-purple-200' : 'bg-purple-100 group-hover:bg-purple-200'
                }`}>
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">{estadisticas.hoy}</span>
              </div>
              <h3 className={`text-xs sm:text-sm font-medium transition-colors ${
                filtrosActivos.hoy ? 'text-purple-700' : 'text-gray-600 group-hover:text-purple-700'
              }`}>Hoy</h3>
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por producto, motivo..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Movimiento
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as 'TODOS' | 'ENTRADA' | 'SALIDA')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
                >
                  <option value="TODOS">Todos</option>
                  <option value="ENTRADA">Entradas</option>
                  <option value="SALIDA">Salidas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    placeholder="dd/mm/aaaa"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {(filtro || filtroTipo !== 'TODOS' || filtroFecha) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setFiltro('')
                    setFiltroTipo('TODOS')
                    setFiltroFecha('')
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 hover:underline cursor-pointer transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KPIs Dinámicos */}
        {(filtro || filtroTipo !== 'TODOS' || filtroFecha) && movimientosFiltrados.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Resumen de filtros aplicados
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Total de unidades</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-900">{kpisFiltrados.totalUnidades}</span>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Movimientos filtrados</span>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{movimientosFiltrados.length}</span>
                </div>
                
                {kpisFiltrados.productoMasMovido && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Producto más movido</span>
                    </div>
                    <div className="text-sm font-semibold text-purple-900 truncate">
                      {kpisFiltrados.productoMasMovido.producto}
                    </div>
                    <div className="text-xs text-purple-700">
                      {kpisFiltrados.productoMasMovido.cantidad} unidades
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Movimientos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Movimientos Recientes ({movimientosFiltrados.length})
            </h3>
          </div>

          {movimientosFiltrados.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay movimientos
              </h3>
              <p className="text-gray-500 mb-6">
                {filtro || filtroTipo !== 'TODOS' || filtroFecha 
                  ? 'No se encontraron movimientos con los filtros aplicados.'
                  : 'Aún no tienes movimientos registrados. ¡Crea tu primer movimiento!'
                }
              </p>
              {!filtro && filtroTipo === 'TODOS' && !filtroFecha && (
                <button
                  onClick={() => router.push('/dashboard/movimientos/nuevo')}
                  className="flex items-center gap-2 mx-auto bg-[#8E94F2] hover:bg-[#7278e0] text-white font-medium px-6 py-3 rounded-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Registrar Primer Movimiento
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {movimientosFiltrados.map((movimiento) => {
                const isExpanded = movimientosExpandidos.has(movimiento.id)
                const unidadPlural = pluralizarUnidad(movimiento.cantidad, movimiento.producto.unidad)
                
                return (
                <Link 
                  key={movimiento.id} 
                  href={`/dashboard/movimientos/${movimiento.id}`}
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Información principal */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        {/* Icono del tipo de movimiento */}
                      <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                        movimiento.tipo === 'ENTRADA' 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                                                                         {movimiento.tipo === 'ENTRADA' ? (
                          <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        )}
                      </div>
                      
                                              <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                            <h4 className="text-lg font-bold text-gray-900 truncate">
                              {movimiento.producto.nombre}
                            </h4>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
                              movimiento.tipo === 'ENTRADA'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {movimiento.tipo}
                            </span>
                          </div>
                        
                          {/* Información adicional en móvil */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 lg:hidden">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                              <span className="font-medium">{movimiento.cantidad} {unidadPlural}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{formatearFechaEspanol(movimiento.fecha)}</span>
                            </div>
                            
                            {movimiento.producto.etiqueta && (
                              <div className="flex items-center gap-2 sm:col-span-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                                  {movimiento.producto.etiqueta}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Panel derecho mejorado - solo en pantallas grandes */}
                      <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-3 lg:min-w-0 lg:w-80">
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-2 text-base text-gray-700">
                            <Package className="w-5 h-5" />
                            <span className="font-bold">{movimiento.cantidad} {unidadPlural}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                             <Clock className="w-4 h-4" />
                            <span>{formatearFechaEspanol(movimiento.fecha)}</span>
                           </div>
                          
                          {movimiento.producto.etiqueta && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                              {movimiento.producto.etiqueta}
                              </span>
                          )}
                          
                          {/* Acciones rápidas */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                              <Eye className="w-3 h-3" />
                              Ver detalles
                            </span>
                          </div>
                            </div>
                      </div>
                        </div>
                        
                    {/* Motivo mejorado - siempre visible */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-start gap-2 mb-3">
                        <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-gray-500 block">Motivo:</span>
                          <p className="text-sm text-gray-700 font-medium">
                            {movimiento.motivo || '—'}
                          </p>
                                </div>
                              </div>
                            
                      {/* Detalles expandibles */}
                      {isExpanded && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {movimiento.descripcion && (
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-xs font-medium text-gray-500 block">Descripción detallada:</span>
                                  <p className="text-sm text-gray-700 break-words italic">{movimiento.descripcion}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Información adicional que se podría agregar */}
                            <div className="flex items-start gap-2">
                              <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="text-xs font-medium text-gray-500 block">ID del movimiento:</span>
                                <p className="text-sm text-gray-700 font-mono">#{movimiento.id}</p>
                              </div>
                            </div>
                          </div>
                          </div>
                        )}
                      </div>
                    
                    {/* Botón expandir en móvil */}
                    <div className="lg:hidden mt-3 flex justify-center">
                      <span className="flex items-center gap-2 px-3 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <ChevronDown className="w-4 h-4" />
                        Ver detalles
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
