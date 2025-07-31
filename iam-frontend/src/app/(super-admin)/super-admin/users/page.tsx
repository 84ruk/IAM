'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { FormErrorAlert } from '@/components/ui/FormErrorAlert'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  User,
  Mail,
  Shield,
  Calendar,
  Building,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminUser, RoleOption } from '@/types/admin'
import { format } from 'date-fns'

interface UserWithEmpresa extends Omit<AdminUser, 'empresa'> {
  empresa?: {
    id: number
    nombre: string
    TipoIndustria: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserWithEmpresa[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [empresas, setEmpresas] = useState<Array<{id: number, nombre: string}>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [empresaFilter, setEmpresaFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoading(true)
        
        // Cargar usuarios con paginación
        const queryParams = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(roleFilter && { role: roleFilter }),
          ...(statusFilter && { status: statusFilter }),
          ...(empresaFilter && { empresaId: empresaFilter })
        })

        const responseUsers = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/users?${queryParams}`, { 
          credentials: 'include' 
        })
        
        if (!responseUsers.ok) {
          throw new Error('Error al cargar usuarios')
        }
        
        const dataUsers = await responseUsers.json()
        setUsers(dataUsers.users || [])
        setPagination(dataUsers.pagination || pagination)

        // Cargar roles
        const responseRoles = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, { 
          credentials: 'include' 
        })
        
        if (responseRoles.ok) {
          const dataRoles = await responseRoles.json()
          setRoles(dataRoles || [])
        }

        // Cargar empresas para el filtro
        const responseEmpresas = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/empresas`, { 
          credentials: 'include' 
        })
        
        if (responseEmpresas.ok) {
          const dataEmpresas = await responseEmpresas.json()
          setEmpresas(dataEmpresas || [])
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
        setErrors(['Error al cargar los datos. Intenta recargar la página.'])
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [pagination, searchTerm, roleFilter, statusFilter, empresaFilter])

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el usuario')
      }

      // Recargar la lista
      setPagination(prev => ({ ...prev, page: 1 }))
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      setErrors(['Error al eliminar el usuario'])
    }
  }

  const handleToggleStatus = async (userId: number, currentStatus: boolean, userName: string) => {
    const action = currentStatus ? 'desactivar' : 'activar'
    
    if (!confirm(`¿Estás seguro de que deseas ${action} al usuario "${userName}"?`)) {
      return
    }

    try {
      const endpoint = currentStatus ? 'deactivate' : 'activate'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/users/${userId}/${endpoint}`, {
        method: 'PATCH',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Error al ${action} el usuario`)
      }

      // Recargar la lista
      setPagination(prev => ({ ...prev, page: 1 }))
    } catch (error) {
      console.error(`Error al ${action} usuario:`, error)
      setErrors([`Error al ${action} el usuario`])
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getRoleInfo = (rol: string) => {
    switch (rol) {
      case 'SUPERADMIN':
        return { color: 'bg-purple-100 text-purple-700', icon: Shield, label: 'Super Admin' }
      case 'ADMIN':
        return { color: 'bg-blue-100 text-blue-700', icon: Shield, label: 'Admin' }
      case 'EMPLEADO':
        return { color: 'bg-green-100 text-green-700', icon: User, label: 'Empleado' }
      case 'PROVEEDOR':
        return { color: 'bg-orange-100 text-orange-700', icon: User, label: 'Proveedor' }
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: User, label: rol }
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm')
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Gestión Global de Usuarios</h1>
          <p className="text-gray-600">Administra todos los usuarios del sistema</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Todos los roles</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <Select
                value={empresaFilter}
                onChange={(e) => setEmpresaFilter(e.target.value)}
              >
                <option value="">Todas las empresas</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id.toString()}>
                    {empresa.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Usuarios ({pagination.total})
            </div>
            <div className="text-sm text-gray-500">
              Página {pagination.page} de {pagination.pages}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length > 0 && <FormErrorAlert errors={errors} />}

          <div className="space-y-4">
            {users.map((user) => {
              const roleInfo = getRoleInfo(user.rol)
              return (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{user.nombre}</h3>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", roleInfo.color)}>
                          {roleInfo.label}
                        </span>
                        {user.activo ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {user.email}
                        </div>
                        {user.empresa && (
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            {user.empresa.nombre}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user.id, user.activo, user.nombre)}
                    >
                      {user.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteUser(user.id, user.nombre)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuarios
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
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