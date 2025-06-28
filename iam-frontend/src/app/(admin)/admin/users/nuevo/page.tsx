'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { FormErrorAlert } from '@/components/ui/FormErrorAlert'
import VolverAtras from '@/components/ui/VolverAtras'
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Building,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateUserAdminDto, RoleOption } from '@/types/admin'
import { useUser } from '@/lib/useUser'

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const { data: currentUser } = useUser()
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Formulario
  const [formData, setFormData] = useState<CreateUserAdminDto>({
    nombre: '',
    email: '',
    password: '',
    rol: 'EMPLEADO',
    empresaId: undefined,
  })

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoadingData(true)
        
        // Cargar roles
        const responseRoles = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, { 
          credentials: 'include' 
        })
        
        if (!responseRoles.ok) {
          throw new Error('Error al cargar roles')
        }
        
        const dataRoles = await responseRoles.json()
        setRoles(dataRoles || [])

        // Cargar empresas (solo para SUPERADMIN)
        if (currentUser?.rol === 'SUPERADMIN') {
          const responseEmpresas = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/empresas`, { 
            credentials: 'include' 
          })
          
          if (responseEmpresas.ok) {
            const dataEmpresas = await responseEmpresas.json()
            setEmpresas(dataEmpresas || [])
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
        setErrors(['Error al cargar los datos. Intenta recargar la página.'])
      } finally {
        setIsLoadingData(false)
      }
    }

    cargarDatos()
  }, [currentUser?.rol])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.email || !formData.password || !formData.rol) {
      setErrors(['Por favor, completa todos los campos requeridos.'])
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`
        setErrors([errorMessage])
        return
      }

      setShowSuccess(true)
      setTimeout(() => {
        router.push('/admin/users')
      }, 2000)
    } catch (error) {
      console.error('Error al crear usuario:', error)
      setErrors(['Error de conexión. Verifica tu conexión a internet.'])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateUserAdminDto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getRoleInfo = (rol: string) => {
    switch (rol) {
      case 'SUPERADMIN':
        return { color: 'bg-purple-100 text-purple-700', icon: Shield, label: 'Super Administrador' }
      case 'ADMIN':
        return { color: 'bg-blue-100 text-blue-700', icon: Shield, label: 'Administrador' }
      case 'EMPLEADO':
        return { color: 'bg-green-100 text-green-700', icon: User, label: 'Empleado' }
      case 'PROVEEDOR':
        return { color: 'bg-orange-100 text-orange-700', icon: User, label: 'Proveedor' }
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: User, label: rol }
    }
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
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingData) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(formData.rol)
  const RoleIcon = roleInfo.icon

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <VolverAtras href="/admin/users" label="Volver a usuarios" />
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-800">Nuevo Usuario</h1>
            <p className="text-gray-600 mt-1">Crea un nuevo usuario en el sistema</p>
          </div>
        </div>

        <FormErrorAlert errors={errors} />

        {/* Formulario */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    label="Nombre completo"
                    name="nombre"
                    type="text"
                    placeholder="Ingresa el nombre completo..."
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    label="Contraseña"
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres..."
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10"
                    minLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <Select
                  value={formData.rol}
                  onChange={(e) => handleInputChange('rol', e.target.value as any)}
                  options={roles.map(role => ({ 
                    value: role.value, 
                    label: role.label 
                  }))}
                  required
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
                    roleInfo.color
                  )}>
                    <RoleIcon className="w-3 h-3" />
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              {/* Empresa (solo para SUPERADMIN) */}
              {currentUser?.rol === 'SUPERADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Select
                      value={formData.empresaId || ''}
                      onChange={(e) => handleInputChange('empresaId', e.target.value)}
                      options={[
                        { value: '', label: 'Seleccionar empresa...' },
                        ...empresas.map(empresa => ({ 
                          value: String(empresa.id), 
                          label: empresa.nombre 
                        }))
                      ]}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Deja vacío para usar la empresa actual
                  </p>
                </div>
              )}

              {/* Información de permisos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Información de permisos</h3>
                <div className="space-y-1 text-xs text-blue-700">
                  <p>• <strong>Super Administrador:</strong> Acceso completo a todas las empresas</p>
                  <p>• <strong>Administrador:</strong> Gestión completa de su empresa</p>
                  <p>• <strong>Empleado:</strong> Acceso básico al sistema</p>
                  <p>• <strong>Proveedor:</strong> Acceso limitado a información de productos</p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 rounded-lg py-3 text-base font-semibold transition-all duration-200 shadow-sm",
                    isLoading
                      ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#8E94F2] to-[#7278e0] text-white hover:from-[#7278e0] hover:to-[#5a60d0] shadow-md hover:shadow-lg"
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Crear Usuario
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/users')}
                  className="px-6 py-3 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Toast visual de éxito */}
        {showSuccess && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2">
            <CheckCircle className="w-5 h-5" />
            <div>
              <div className="font-medium">¡Usuario creado exitosamente!</div>
              <div className="text-sm opacity-90">Redirigiendo a usuarios...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 