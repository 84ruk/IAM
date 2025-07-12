'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { 
  Users, 
  Building, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  overview: {
    totalUsers: number
    totalEmpresas: number
    activeUsers: number
    inactiveUsers: number
    activePercentage: number
    totalProductos: number
    totalMovimientos: number
  }
  usersByRole: Array<{
    rol: string
    count: number
    label: string
  }>
  empresasByIndustry: Array<{
    industry: string
    count: number
  }>
  recentUsers: Array<{
    id: number
    nombre: string
    email: string
    rol: string
    createdAt: string
    empresa: {
      id: number
      nombre: string
    }
  }>
  recentEmpresas: Array<{
    id: number
    nombre: string
    TipoIndustria: string
    fechaCreacion: string
  }>
  systemHealth: {
    status: 'healthy' | 'warning' | 'error'
    message: string
    uptime: string
    lastBackup: string
  }
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setErrors([])

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/dashboard-stats`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error:', error)
      setErrors(['Error al cargar las estadísticas del dashboard'])
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case 'SUPERADMIN':
        return 'bg-purple-100 text-purple-700'
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700'
      case 'EMPLEADO':
        return 'bg-green-100 text-green-700'
      case 'PROVEEDOR':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getIndustryColor = (industry: string) => {
    switch (industry) {
      case 'ROPA':
        return 'bg-pink-100 text-pink-700'
      case 'ALIMENTOS':
        return 'bg-green-100 text-green-700'
      case 'ELECTRONICA':
        return 'bg-blue-100 text-blue-700'
      case 'FARMACIA':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle }
      case 'warning':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle }
      case 'error':
        return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', icon: Activity }
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600">No se pudieron cargar las estadísticas</p>
          <Button onClick={fetchStats} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const healthStatus = getHealthStatus(stats.systemHealth.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Super Administrador</h1>
          <p className="text-gray-600">Vista general del sistema y estadísticas globales</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-500">Super Admin</span>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuarios, empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.activeUsers} activos ({stats.overview.activePercentage}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalEmpresas}</div>
            <p className="text-xs text-muted-foreground">
              Empresas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalProductos}</div>
            <p className="text-xs text-muted-foreground">
              Productos en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salud del Sistema</CardTitle>
            <healthStatus.icon className={`h-4 w-4 ${healthStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthStatus.color}`}>
              {stats.systemHealth.status === 'healthy' ? 'OK' : 'ATENCIÓN'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.systemHealth.message}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuarios por rol */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Usuarios por Rol
              </div>
              <Link href="/super-admin/users">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver todos
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.usersByRole.map((item) => (
                <div key={item.rol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(item.rol)}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Empresas por industria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Empresas por Industria
              </div>
              <Link href="/super-admin/empresas">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver todas
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.empresasByIndustry.map((item) => (
                <div key={item.industry} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIndustryColor(item.industry)}`}>
                      {item.industry}
                    </span>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usuarios y empresas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuarios recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Usuarios Recientes
              </div>
              <Link href="/super-admin/users">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.nombre}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">{user.empresa?.nombre}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.rol)}`}>
                      {user.rol}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Empresas recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Empresas Recientes
              </div>
              <Link href="/super-admin/empresas">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentEmpresas.map((empresa) => (
                <div key={empresa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{empresa.nombre}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIndustryColor(empresa.TipoIndustria)}`}>
                        {empresa.TipoIndustria}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(empresa.fechaCreacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Tiempo Activo</p>
              <p className="text-lg font-semibold">{stats.systemHealth.uptime}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Último Backup</p>
              <p className="text-lg font-semibold">{stats.systemHealth.lastBackup}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Estado</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${healthStatus.bg} ${healthStatus.color}`}>
                {stats.systemHealth.status === 'healthy' ? 'Saludable' : 'Atención'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 