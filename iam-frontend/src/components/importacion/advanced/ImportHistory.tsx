'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { 
  History,
  Filter,
  Download,
  RefreshCw,
  Search,
  Calendar,
  FileText,
  Package,
  ShoppingCart,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  CalendarDays,
  ArrowUpDown,
  X
} from 'lucide-react'
import { useImportacionGlobal } from '@/context/ImportacionGlobalContext'
import { TrabajoImportacion } from '@/lib/api/importacion'
import { format } from 'date-fns'

interface ImportHistoryProps {
  className?: string
}

interface FilterState {
  tipo: string
  estado: string
  fechaInicio: string
  fechaFin: string
  usuario: string
  searchTerm: string
}

export default function ImportHistory({ className = '' }: ImportHistoryProps) {
  const { state, loadTrabajos } = useImportacionGlobal()
  const [filters, setFilters] = useState<FilterState>({
    tipo: '',
    estado: '',
    fechaInicio: '',
    fechaFin: '',
    usuario: '',
    searchTerm: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'fecha' | 'estado' | 'tipo'>('fecha')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedTrabajo, setSelectedTrabajo] = useState<TrabajoImportacion | null>(null)

  // Cargar trabajos al montar el componente
  useEffect(() => {
    loadTrabajos(true)
  }, [loadTrabajos])

  // Aplicar filtros
  const filteredTrabajos = useMemo(() => {
    let filtered = state.trabajos

    if (filters.tipo) {
      filtered = filtered.filter(trabajo => trabajo.tipo === filters.tipo)
    }

    if (filters.estado) {
      filtered = filtered.filter(trabajo => trabajo.estado === filters.estado)
    }

    if (filters.fechaInicio) {
      filtered = filtered.filter(trabajo => 
        new Date(trabajo.fechaCreacion) >= new Date(filters.fechaInicio)
      )
    }

    if (filters.fechaFin) {
      filtered = filtered.filter(trabajo => 
        new Date(trabajo.fechaCreacion) <= new Date(filters.fechaFin)
      )
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(trabajo =>
        trabajo.archivoOriginal.toLowerCase().includes(searchLower) ||
        trabajo.tipo.toLowerCase().includes(searchLower) ||
        trabajo.estado.toLowerCase().includes(searchLower)
      )
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'fecha':
          aValue = new Date(a.fechaCreacion)
          bValue = new Date(b.fechaCreacion)
          break
        case 'estado':
          aValue = a.estado
          bValue = b.estado
          break
        case 'tipo':
          aValue = a.tipo
          bValue = b.tipo
          break
        default:
          aValue = new Date(a.fechaCreacion)
          bValue = new Date(b.fechaCreacion)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [state.trabajos, filters, sortBy, sortOrder])

  // Estadísticas
  const stats = useMemo(() => {
    const total = state.trabajos.length
    const completados = state.trabajos.filter(t => t.estado === 'completado').length
    const conError = state.trabajos.filter(t => t.estado === 'error').length
    const enProgreso = state.trabajos.filter(t => t.estado === 'procesando').length
    const pendientes = state.trabajos.filter(t => t.estado === 'pendiente').length

    return {
      total,
      completados,
      conError,
      enProgreso,
      pendientes,
      porcentajeExito: total > 0 ? (completados / total) * 100 : 0
    }
  }, [state.trabajos])

  // Obtener icono por tipo
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
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

  // Obtener color del badge por estado
  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'default' as const
      case 'error':
        return 'destructive' as const
      case 'procesando':
        return 'secondary' as const
      case 'pendiente':
        return 'outline' as const
      default:
        return 'outline' as const
    }
  }

  // Obtener icono por estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="h-4 w-4" />
      case 'error':
        return <XCircle className="h-4 w-4" />
      case 'procesando':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'pendiente':
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      tipo: '',
      estado: '',
      fechaInicio: '',
      fechaFin: '',
      usuario: '',
      searchTerm: ''
    })
  }, [])

  // Exportar historial
  const exportHistory = useCallback(() => {
    const csvContent = [
      ['Fecha', 'Tipo', 'Archivo', 'Estado', 'Total Registros', 'Exitosos', 'Con Error', 'Progreso'],
      ...filteredTrabajos.map(trabajo => [
        format(new Date(trabajo.fechaCreacion), 'dd/MM/yyyy HH:mm'),
        trabajo.tipo,
        trabajo.archivoOriginal,
        trabajo.estado,
        trabajo.totalRegistros.toString(),
        trabajo.registrosExitosos.toString(),
        trabajo.registrosConError.toString(),
        `${trabajo.progreso}%`
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial-importacion-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, [filteredTrabajos])

  // Cambiar orden de clasificación
  const toggleSort = useCallback((field: 'fecha' | 'estado' | 'tipo') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }, [sortBy, sortOrder])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Historial de Importaciones</CardTitle>
                <p className="text-sm text-gray-600">
                  {stats.total} importaciones realizadas
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTrabajos(true)}
                disabled={state.isLoadingTrabajos}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${state.isLoadingTrabajos ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportHistory}
                disabled={filteredTrabajos.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.completados}</div>
              <div className="text-sm text-green-700">Completados</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.conError}</div>
              <div className="text-sm text-red-700">Con Error</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.enProgreso}</div>
              <div className="text-sm text-blue-700">En Progreso</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
              <div className="text-sm text-yellow-700">Pendientes</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.porcentajeExito.toFixed(1)}%</div>
              <div className="text-sm text-purple-700">Tasa de Éxito</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtros</span>
                </Button>
                
                {(filters.tipo || filters.estado || filters.fechaInicio || filters.fechaFin || filters.searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-800"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar en archivos, tipos, estados..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-64"
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="tipo-filter">Tipo</Label>
                  <select
                    id="tipo-filter"
                    value={filters.tipo}
                    onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="productos">Productos</option>
                    <option value="proveedores">Proveedores</option>
                    <option value="movimientos">Movimientos</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="estado-filter">Estado</Label>
                  <select
                    id="estado-filter"
                    value={filters.estado}
                    onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">Todos los estados</option>
                    <option value="completado">Completado</option>
                    <option value="error">Error</option>
                    <option value="procesando">Procesando</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
                  <Input
                    id="fecha-inicio"
                    type="date"
                    value={filters.fechaInicio}
                    onChange={(e) => setFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="fecha-fin">Fecha Fin</Label>
                  <Input
                    id="fecha-fin"
                    type="date"
                    value={filters.fechaFin}
                    onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tabla de historial */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">
                    <button
                      onClick={() => toggleSort('fecha')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>Fecha</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-3">
                    <button
                      onClick={() => toggleSort('tipo')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>Tipo</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-3">Archivo</th>
                  <th className="text-left p-3">
                    <button
                      onClick={() => toggleSort('estado')}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>Estado</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-3">Registros</th>
                  <th className="text-left p-3">Progreso</th>
                  <th className="text-left p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrabajos.map((trabajo) => (
                  <tr key={trabajo.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="text-sm">
                        {format(new Date(trabajo.fechaCreacion), 'dd/MM/yyyy')}
                      </div>
                                              <div className="text-xs text-gray-500">
                          {format(new Date(trabajo.fechaCreacion), 'HH:mm')}
                        </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        {getTipoIcon(trabajo.tipo)}
                        <span className="capitalize">{trabajo.tipo}</span>
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="text-sm font-medium truncate max-w-xs">
                        {trabajo.archivoOriginal}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <Badge variant={getEstadoBadgeVariant(trabajo.estado)}>
                        <div className="flex items-center space-x-1">
                          {getEstadoIcon(trabajo.estado)}
                          <span className="capitalize">{trabajo.estado}</span>
                        </div>
                      </Badge>
                    </td>
                    
                    <td className="p-3">
                      <div className="text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">{trabajo.registrosExitosos}</span>
                          <span className="text-gray-400">/</span>
                          <span>{trabajo.totalRegistros}</span>
                          {trabajo.registrosConError > 0 && (
                            <>
                              <span className="text-gray-400">|</span>
                              <span className="text-red-600">{trabajo.registrosConError}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${trabajo.progreso}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {trabajo.progreso}%
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTrabajo(trabajo)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTrabajos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron importaciones con los filtros aplicados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles del trabajo */}
      {selectedTrabajo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalles de Importación</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTrabajo(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Archivo</Label>
                  <p className="text-sm">{selectedTrabajo.archivoOriginal}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                  <div className="flex items-center space-x-2">
                    {getTipoIcon(selectedTrabajo.tipo)}
                    <span className="text-sm capitalize">{selectedTrabajo.tipo}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Estado</Label>
                  <Badge variant={getEstadoBadgeVariant(selectedTrabajo.estado)}>
                    <div className="flex items-center space-x-1">
                      {getEstadoIcon(selectedTrabajo.estado)}
                      <span className="capitalize">{selectedTrabajo.estado}</span>
                    </div>
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                  <p className="text-sm">
                    {format(new Date(selectedTrabajo.fechaCreacion), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Estadísticas</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{selectedTrabajo.registrosExitosos}</div>
                    <div className="text-xs text-gray-500">Exitosos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{selectedTrabajo.registrosConError}</div>
                    <div className="text-xs text-gray-500">Con Error</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{selectedTrabajo.totalRegistros}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 