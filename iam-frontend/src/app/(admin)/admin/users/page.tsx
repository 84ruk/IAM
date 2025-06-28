'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
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
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminUser, RoleOption } from '@/types/admin'
import { useUser } from '@/lib/useUser'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AdminUsersPage() {
  const router = useRouter()
  const { data: currentUser } = useUser()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoading(true)
        
        // Cargar usuarios
        const responseUsers = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, { 
          credentials: 'include' 
        })
        
        if (!responseUsers.ok) {
          throw new Error('Error al cargar usuarios')
        }
        
        const dataUsers = await responseUsers.json()
        setUsers(dataUsers || [])

        // Cargar roles
        const responseRoles = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, { 
          credentials: 'include' 
        })
        
        if (!responseRoles.ok) {
          throw new Error('Error al cargar roles')
        }
        
        const dataRoles = await responseRoles.json()
        setRoles(dataRoles || [])
      } catch (error) {
        console.error('Error cargando datos:', error)
        setErrors(['Error al cargar los datos. Intenta recargar la página.'])
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [])

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el usuario')
      }

      // Actualizar la lista de usuarios
      setUsers(users.filter(user => user.id !== userId))
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/${endpoint}`, {
        method: 'PATCH',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Error al ${action} el usuario`)
      }

      // Actualizar el estado del usuario en la lista
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, activo: !currentStatus }
          : user
      ))
    } catch (error) {
      console.error(`Error al ${action} usuario:`, error)
      setErrors([`Error al ${action} el usuario`])
    }
  }

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || user.rol === roleFilter
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'activo' && user.activo) ||
                         (statusFilter === 'inactivo' && !user.activo)
    
    return matchesSearch && matchesRole && matchesStatus
  })

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
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
  }

  // Verificar permisos de administrador
  if (!currentUser || (currentUser.rol !== 'ADMIN' && currentUser.rol !== 'SUPERADMIN')) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta sección.</p>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
            >
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Administración de Usuarios</h1>
              <p className="text-gray-600 mt-1">Gestiona usuarios y permisos del sistema</p>
            </div>
            <Link
              href="/admin/users/nuevo"
              className="flex items-center gap-2 px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Usuario
            </Link>
          </div>
        </div>

        <FormErrorAlert errors={errors} />

        {/* Filtros */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Todos los roles' },
                    ...roles.map(role => ({ value: role.value, label: role.label }))
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'activo', label: 'Activos' },
                    { value: 'inactivo', label: 'Inactivos' }
                  ]}
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setRoleFilter('')
                    setStatusFilter('')
                  }}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const roleInfo = getRoleInfo(user.rol)
            const RoleIcon = roleInfo.icon
            
            return (
              <Card key={user.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{user.nombre}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
                      roleInfo.color
                    )}>
                      <RoleIcon className="w-3 h-3" />
                      {roleInfo.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{user.empresa.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Creado: {formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {user.activo ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={user.activo ? "text-green-600" : "text-red-600"}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Link>
                    <Link
                      href={`/admin/users/${user.id}/editar`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.activo, user.nombre)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors"
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors",
                        user.activo
                          ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      )}
                    >
                      {user.activo ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Activar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.nombre)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredUsers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || roleFilter || statusFilter 
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Aún no hay usuarios registrados en el sistema.'
              }
            </p>
            {!searchTerm && !roleFilter && !statusFilter && (
              <Link
                href="/admin/users/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear primer usuario
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 