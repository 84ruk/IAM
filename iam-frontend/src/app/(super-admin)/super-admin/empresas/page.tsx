'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { FormErrorAlert } from '@/components/ui/FormErrorAlert'
import { 
  Building, 
  Search, 
  Filter,
  Users,
  Package,
  TrendingUp,
  Calendar,
  Mail,
  BarChart3,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Empresa {
  id: number
  nombre: string
  rfc: string | null
  emailContacto: string | null
  TipoIndustria: string
  fechaCreacion: string
  _count: {
    usuarios: number
    productos: number
    movimientos: number
  }
}

interface EmpresaStats {
  empresa: {
    id: number
    nombre: string
    TipoIndustria: string
  }
  stats: {
    totalUsers: number
    activeUsers: number
    totalProductos: number
    totalMovimientos: number
    totalProveedores: number
  }
  usersByRole: Array<{
    rol: string
    count: number
    label: string
  }>
}

export default function SuperAdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')

  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/empresas`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Error al cargar empresas')
        }

        const data = await response.json()
        setEmpresas(data || [])
      } catch (error) {
        console.error('Error:', error)
        setErrors(['Error al cargar las empresas'])
      } finally {
        setIsLoading(false)
      }
    }

    cargarEmpresas()
  }, [])

  const handleViewEmpresaStats = async (empresaId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/empresas/${empresaId}/stats`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas de la empresa')
      }

      const data = await response.json()
      setSelectedEmpresa(data)
    } catch (error) {
      console.error('Error:', error)
      setErrors(['Error al cargar las estadísticas de la empresa'])
    }
  }

  const getIndustryColor = (industry: string) => {
    switch (industry) {
      case 'ROPA':
        return 'text-pink-600 bg-pink-100'
      case 'ALIMENTOS':
        return 'text-green-600 bg-green-100'
      case 'ELECTRONICA':
        return 'text-blue-600 bg-blue-100'
      case 'FARMACIA':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case 'SUPERADMIN':
        return 'text-purple-600 bg-purple-100'
      case 'ADMIN':
        return 'text-blue-600 bg-blue-100'
      case 'EMPLEADO':
        return 'text-green-600 bg-green-100'
      case 'PROVEEDOR':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy')
  }

  // Filtrar empresas
  const filteredEmpresas = empresas.filter(empresa => {
    const matchesSearch = empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (empresa.rfc && empresa.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesIndustry = !industryFilter || empresa.TipoIndustria === industryFilter
    
    return matchesSearch && matchesIndustry
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
          <p className="text-gray-600">Administra todas las empresas del sistema</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {empresas.length} empresas
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nombre o RFC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industria</label>
              <Select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <option value="">Todas las industrias</option>
                <option value="GENERICA">Genérica</option>
                <option value="ROPA">Ropa</option>
                <option value="ALIMENTOS">Alimentos</option>
                <option value="ELECTRONICA">Electrónica</option>
                <option value="FARMACIA">Farmacia</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmpresas.map((empresa) => (
          <Card key={empresa.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{empresa.nombre}</CardTitle>
                </div>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getIndustryColor(empresa.TipoIndustria))}>
                  {empresa.TipoIndustria}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {empresa.rfc && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">RFC:</span>
                    {empresa.rfc}
                  </div>
                )}
                
                {empresa.emailContacto && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {empresa.emailContacto}
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Registrada: {formatDate(empresa.fechaCreacion)}
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-500 mr-1" />
                    </div>
                    <div className="text-lg font-semibold">{empresa._count.usuarios}</div>
                    <div className="text-xs text-gray-500">Usuarios</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Package className="h-4 w-4 text-green-500 mr-1" />
                    </div>
                    <div className="text-lg font-semibold">{empresa._count.productos}</div>
                    <div className="text-xs text-gray-500">Productos</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                    </div>
                    <div className="text-lg font-semibold">{empresa._count.movimientos}</div>
                    <div className="text-xs text-gray-500">Movimientos</div>
                  </div>
                </div>

                <Button
                  className="w-full mt-3"
                  onClick={() => handleViewEmpresaStats(empresa.id)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Estadísticas
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de estadísticas de empresa */}
      {selectedEmpresa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEmpresa.empresa.nombre}</h2>
                  <p className="text-gray-600">Estadísticas detalladas</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedEmpresa(null)}
                >
                  Cerrar
                </Button>
              </div>

              {errors.length > 0 && <FormErrorAlert errors={errors} />}

              {/* Métricas principales */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{selectedEmpresa.stats.totalUsers}</div>
                      <div className="text-sm text-gray-500">Total Usuarios</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{selectedEmpresa.stats.activeUsers}</div>
                      <div className="text-sm text-gray-500">Usuarios Activos</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Package className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{selectedEmpresa.stats.totalProductos}</div>
                      <div className="text-sm text-gray-500">Productos</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{selectedEmpresa.stats.totalMovimientos}</div>
                      <div className="text-sm text-gray-500">Movimientos</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Building className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{selectedEmpresa.stats.totalProveedores}</div>
                      <div className="text-sm text-gray-500">Proveedores</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Usuarios por rol */}
              <Card>
                <CardHeader>
                  <CardTitle>Usuarios por Rol</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedEmpresa.usersByRole.map((item) => (
                      <div key={item.rol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getRoleColor(item.rol))}>
                            {item.label}
                          </span>
                        </div>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 