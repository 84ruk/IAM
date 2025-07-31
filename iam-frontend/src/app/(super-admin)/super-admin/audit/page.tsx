'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { 
  Activity, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  Building,
  Package,
  Calendar,
  Info
} from 'lucide-react'

interface AuditLog {
  id: number
  userId: number
  userEmail: string
  userName: string
  action: string
  resource: string
  resourceId: number
  details: string
  ipAddress: string
  userAgent: string
  createdAt: string
  empresaId?: number
  empresaName?: string
}

interface AuditStats {
  totalLogs: number
  logsToday: number
  logsThisWeek: number
  logsThisMonth: number
  topActions: Array<{
    action: string
    count: number
    percentage: number
  }>
  topUsers: Array<{
    userId: number
    userName: string
    userEmail: string
    actionCount: number
  }>
  topResources: Array<{
    resource: string
    count: number
    percentage: number
  }>
}

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [dateRange, setDateRange] = useState('7d')
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const fetchAuditData = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrors([])

      // Cargar logs
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        range: dateRange,
        ...(searchTerm && { search: searchTerm }),
        ...(actionFilter && { action: actionFilter }),
        ...(resourceFilter && { resource: resourceFilter }),
        ...(userFilter && { user: userFilter })
      })

      const logsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/audit/logs?${queryParams}`, {
        credentials: 'include'
      })

      if (!logsResponse.ok) {
        throw new Error('Error al cargar logs de auditoría')
      }

      const logsData = await logsResponse.json()
      setLogs(logsData.logs || [])
      setPagination(logsData.pagination || pagination)

      // Cargar estadísticas
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/audit/stats?range=${dateRange}`, {
        credentials: 'include'
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error:', error)
      setErrors(['Error al cargar los datos de auditoría'])
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, dateRange, searchTerm, actionFilter, resourceFilter, userFilter, pagination])

  useEffect(() => {
    fetchAuditData()
  }, [fetchAuditData])

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'login':
        return 'bg-green-100 text-green-700'
      case 'update':
      case 'modify':
        return 'bg-blue-100 text-blue-700'
      case 'delete':
      case 'logout':
        return 'bg-red-100 text-red-700'
      case 'view':
      case 'read':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-purple-100 text-purple-700'
    }
  }

  const getResourceIcon = (resource: string) => {
    switch (resource.toLowerCase()) {
      case 'user':
      case 'users':
        return User
      case 'empresa':
      case 'empresas':
        return Building
      case 'producto':
      case 'productos':
        return Package
      case 'auth':
      case 'login':
      case 'logout':
        return User // Changed from Shield to User for consistency with other icons
      default:
        return Activity
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const exportAuditLogs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/audit/export?range=${dateRange}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error al exportar:', error)
      setErrors(['Error al exportar los logs'])
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoría del Sistema</h1>
          <p className="text-gray-600">Registro de todas las actividades y cambios en el sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="1d">Último día</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          <Button onClick={fetchAuditData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={exportAuditLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                En el período seleccionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.logsToday}</div>
              <p className="text-xs text-muted-foreground">
                Actividades registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.logsThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Actividades registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.logsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Actividades registradas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros y Búsqueda
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Búsqueda principal */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por usuario, acción, recurso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros avanzados */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Todas las acciones</option>
                    <option value="CREATE">Crear</option>
                    <option value="UPDATE">Actualizar</option>
                    <option value="DELETE">Eliminar</option>
                    <option value="LOGIN">Inicio de sesión</option>
                    <option value="LOGOUT">Cierre de sesión</option>
                    <option value="VIEW">Ver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurso</label>
                  <select
                    value={resourceFilter}
                    onChange={(e) => setResourceFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Todos los recursos</option>
                    <option value="USER">Usuario</option>
                    <option value="EMPRESA">Empresa</option>
                    <option value="PRODUCTO">Producto</option>
                    <option value="AUTH">Autenticación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <Input
                    placeholder="Email del usuario"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análisis */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top acciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Acciones Más Comunes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topActions.map((item) => (
                  <div key={item.action} className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(item.action)}`}>
                      {item.action}
                    </span>
                    <div className="text-right">
                      <div className="font-semibold">{item.count}</div>
                      <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top usuarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Usuarios Más Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topUsers.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{user.userName}</p>
                      <p className="text-xs text-gray-500">{user.userEmail}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{user.actionCount}</div>
                      <div className="text-xs text-gray-500">acciones</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top recursos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Recursos Más Accedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topResources.map((resource) => {
                  const ResourceIcon = getResourceIcon(resource.resource)
                  return (
                    <div key={resource.resource} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ResourceIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{resource.resource}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{resource.count}</div>
                        <div className="text-xs text-gray-500">{resource.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Logs de Auditoría ({pagination.total})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-red-800">{errors[0]}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recurso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => {
                  const ResourceIcon = getResourceIcon(log.resource)
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                            <div className="text-sm text-gray-500">{log.userEmail}</div>
                            {log.empresaName && (
                              <div className="text-xs text-gray-400">{log.empresaName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ResourceIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{log.resource}</span>
                          {log.resourceId && (
                            <span className="text-xs text-gray-500 ml-1">#{log.resourceId}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-700">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 