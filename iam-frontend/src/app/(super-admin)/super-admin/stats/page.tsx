'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { 
  BarChart3, 
  Users, 
  Building, 
  Package,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  PieChart,
  LineChart,
  Target
} from 'lucide-react'
import Link from 'next/link'

interface SystemStats {
  overview: {
    totalUsers: number
    totalEmpresas: number
    totalProductos: number
    totalMovimientos: number
    activeUsers: number
    inactiveUsers: number
    activePercentage: number
  }
  growth: {
    usersGrowth: number
    empresasGrowth: number
    productosGrowth: number
    movimientosGrowth: number
  }
  usersByRole: Array<{
    rol: string
    count: number
    label: string
    percentage: number
  }>
  empresasByIndustry: Array<{
    industry: string
    count: number
    percentage: number
  }>
  activityByMonth: Array<{
    month: string
    users: number
    empresas: number
    productos: number
    movimientos: number
  }>
  topEmpresas: Array<{
    id: number
    nombre: string
    TipoIndustria: string
    totalUsers: number
    totalProductos: number
    totalMovimientos: number
  }>
  systemMetrics: {
    uptime: string
    responseTime: string
    errorRate: string
    lastBackup: string
    storageUsed: string
    storageTotal: string
  }
}

export default function SuperAdminStatsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [dateRange, setDateRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('users')

  useEffect(() => {
    fetchStats()
  }, [dateRange])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setErrors([])

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/stats?range=${dateRange}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error:', error)
      setErrors(['Error al cargar las estadísticas'])
    } finally {
      setIsLoading(false)
    }
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
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
          <Activity className="h-12 w-12 text-red-500 mx-auto mb-4" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas del Sistema</h1>
          <p className="text-gray-600">Métricas detalladas y análisis del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
          <Button onClick={fetchStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overview.totalUsers)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {React.createElement(getGrowthIcon(stats.growth.usersGrowth), {
                className: `h-3 w-3 mr-1 ${getGrowthColor(stats.growth.usersGrowth)}`
              })}
              <span className={getGrowthColor(stats.growth.usersGrowth)}>
                {formatPercentage(stats.growth.usersGrowth)}
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overview.totalEmpresas)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {React.createElement(getGrowthIcon(stats.growth.empresasGrowth), {
                className: `h-3 w-3 mr-1 ${getGrowthColor(stats.growth.empresasGrowth)}`
              })}
              <span className={getGrowthColor(stats.growth.empresasGrowth)}>
                {formatPercentage(stats.growth.empresasGrowth)}
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overview.totalProductos)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {React.createElement(getGrowthIcon(stats.growth.productosGrowth), {
                className: `h-3 w-3 mr-1 ${getGrowthColor(stats.growth.productosGrowth)}`
              })}
              <span className={getGrowthColor(stats.growth.productosGrowth)}>
                {formatPercentage(stats.growth.productosGrowth)}
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overview.totalMovimientos)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {React.createElement(getGrowthIcon(stats.growth.movimientosGrowth), {
                className: `h-3 w-3 mr-1 ${getGrowthColor(stats.growth.movimientosGrowth)}`
              })}
              <span className={getGrowthColor(stats.growth.movimientosGrowth)}>
                {formatPercentage(stats.growth.movimientosGrowth)}
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuarios por rol */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Distribución de Usuarios por Rol
              </div>
              <Link href="/super-admin/users">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver detalles
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.usersByRole.map((item) => (
                <div key={item.rol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(item.rol)}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.count}</div>
                    <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                  </div>
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
                <BarChart3 className="h-5 w-5 mr-2" />
                Empresas por Industria
              </div>
              <Link href="/super-admin/empresas">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver detalles
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.empresasByIndustry.map((item) => (
                <div key={item.industry} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIndustryColor(item.industry)}`}>
                      {item.industry}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.count}</div>
                    <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actividad por mes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="h-5 w-5 mr-2" />
            Actividad del Sistema por Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Mes</th>
                  <th className="text-right py-2">Usuarios</th>
                  <th className="text-right py-2">Empresas</th>
                  <th className="text-right py-2">Productos</th>
                  <th className="text-right py-2">Movimientos</th>
                </tr>
              </thead>
              <tbody>
                {stats.activityByMonth.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{item.month}</td>
                    <td className="text-right py-2">{formatNumber(item.users)}</td>
                    <td className="text-right py-2">{formatNumber(item.empresas)}</td>
                    <td className="text-right py-2">{formatNumber(item.productos)}</td>
                    <td className="text-right py-2">{formatNumber(item.movimientos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top empresas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Top Empresas por Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topEmpresas.map((empresa, index) => (
              <div key={empresa.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{empresa.nombre}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIndustryColor(empresa.TipoIndustria)}`}>
                      {empresa.TipoIndustria}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{empresa.totalUsers}</div>
                    <div className="text-gray-500">Usuarios</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{empresa.totalProductos}</div>
                    <div className="text-gray-500">Productos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{empresa.totalMovimientos}</div>
                    <div className="text-gray-500">Movimientos</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Métricas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.systemMetrics.uptime}</div>
              <p className="text-sm text-gray-500">Tiempo Activo</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.systemMetrics.responseTime}</div>
              <p className="text-sm text-gray-500">Tiempo de Respuesta</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.systemMetrics.errorRate}</div>
              <p className="text-sm text-gray-500">Tasa de Error</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.systemMetrics.lastBackup}</div>
              <p className="text-sm text-gray-500">Último Backup</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.systemMetrics.storageUsed}</div>
              <p className="text-sm text-gray-500">Almacenamiento Usado</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.systemMetrics.storageTotal}</div>
              <p className="text-sm text-gray-500">Almacenamiento Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 