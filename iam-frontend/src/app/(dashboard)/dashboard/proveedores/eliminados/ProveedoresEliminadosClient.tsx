"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { 
  ArrowLeft, 
  Trash2, 
  RotateCcw,
  AlertTriangle,
  Building2,
  CheckCircle,
  XCircle,
  Eye,
  Search
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { CardSkeleton } from "@/components/ui/CardSkeleton"
import { Proveedor } from "@/types/proveedor"
import { cn } from "@/lib/utils"
import VolverAtras from '@/components/ui/VolverAtras'
import Link from 'next/link'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((res) => {
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
    return res.json()
  })

export default function ProveedoresEliminadosClient() {
  
  // Estados de UI
  const [restaurandoId, setRestaurandoId] = useState<number | null>(null)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  // Obtener proveedores eliminados
  const { data: proveedores, isLoading, error: errorProveedores, mutate } = useSWR<Proveedor[]>("/proveedores/eliminados", fetcher)

  // Proveedores filtrados
  const proveedoresFiltrados = useMemo(() => {
    if (!proveedores) return []
    
    if (filtro) {
      return proveedores.filter(proveedor =>
        proveedor.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        (proveedor.email && proveedor.email.toLowerCase().includes(filtro.toLowerCase())) ||
        (proveedor.telefono && proveedor.telefono.includes(filtro))
      )
    }
    
    return proveedores
  }, [proveedores, filtro])

  // Función para mostrar errores
  const mostrarError = (mensaje: string) => {
    setError(mensaje)
    setTimeout(() => setError(null), 5000)
  }

  // Función para manejar errores de respuesta del backend
  const manejarErrorBackend = async (response: Response, accion: string) => {
    try {
      const errorData = await response.json()
      mostrarError(`Error al ${accion}: ${errorData.message || 'Error desconocido'}`)
    } catch {
      mostrarError(`Error al ${accion}. Código de estado: ${response.status}`)
    }
  }

  const restaurarProveedor = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas restaurar este proveedor?')) {
      return
    }

    try {
      setRestaurandoId(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores/${id}/restaurar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        await manejarErrorBackend(response, 'restaurar')
        return
      }

      mostrarError('Proveedor restaurado exitosamente.')
      mutate() // Recargar datos
    } catch {
      mostrarError('Error al restaurar el proveedor. Intenta nuevamente.')
    } finally {
      setRestaurandoId(null)
    }
  }

  const eliminarPermanentemente = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este proveedor? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setEliminandoId(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores/${id}/permanent`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        await manejarErrorBackend(response, 'eliminar permanentemente')
        return
      }

      mostrarError('Proveedor eliminado permanentemente.')
      mutate() // Recargar datos
    } catch {
      mostrarError('Error al eliminar el proveedor. Intenta nuevamente.')
    } finally {
      setEliminandoId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <VolverAtras href="/dashboard/proveedores" label="Volver a proveedores" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (errorProveedores) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <VolverAtras href="/dashboard/proveedores" label="Volver a proveedores" />
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar proveedores eliminados</h2>
          <p className="text-gray-600 mb-4">No se pudieron cargar los proveedores eliminados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <VolverAtras href="/dashboard/proveedores" label="Volver a proveedores" />
      </div>

      {/* Título y estadísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Papelera de Proveedores</h1>
          <p className="text-gray-600 mt-1">
            Proveedores eliminados que puedes restaurar
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/proveedores"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Proveedores
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Eliminados</p>
                <p className="text-2xl font-bold text-gray-900">{proveedores?.length || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disponibles para Restaurar</p>
                <p className="text-2xl font-bold text-gray-900">{proveedoresFiltrados.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <RotateCcw className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar proveedores eliminados..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
          />
        </div>
      </div>

      {/* Mostrar mensajes */}
      {error && (
        <div className={cn(
          "mb-6 border rounded-lg p-4",
          error.includes('exitosamente') 
            ? "bg-green-50 border-green-200" 
            : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-start gap-3">
            {error.includes('exitosamente') ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn(
                "text-sm",
                error.includes('exitosamente') ? "text-green-700" : "text-red-700"
              )}>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className={cn(
                "transition-colors",
                error.includes('exitosamente') 
                  ? "text-green-400 hover:text-green-600" 
                  : "text-red-400 hover:text-red-600"
              )}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de proveedores eliminados */}
      {proveedoresFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Trash2 className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filtro ? 'No se encontraron proveedores' : 'No hay proveedores eliminados'}
          </h3>
          <p className="text-gray-600 text-center">
            {filtro 
              ? 'Intenta con otros términos de búsqueda' 
              : 'Los proveedores que elimines aparecerán aquí para que puedas restaurarlos'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {proveedoresFiltrados.map((proveedor) => (
            <Card key={proveedor.id} className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
              <CardContent className="p-6 relative flex flex-col h-full">
                {/* Icono de proveedor en esquina superior derecha */}
                <div className="absolute top-4 right-4">
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between mb-4 pr-12">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">
                      {proveedor.nombre}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                        Eliminado
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="space-y-2 mb-4">
                  {proveedor.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium truncate ml-2">{proveedor.email}</span>
                    </div>
                  )}
                  {proveedor.telefono && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="font-medium">{proveedor.telefono}</span>
                    </div>
                  )}
                </div>

                {/* Productos asociados */}
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-600">Productos:</span>
                  <span className="font-medium">{proveedor.productos?.length || 0} asociados</span>
                </div>

                {/* Acciones */}
                <div className="mt-auto flex flex-col items-center gap-2 w-full">
                  {/* Primera fila: Ver y Restaurar */}
                  <div className="flex items-center justify-center gap-6 w-full">
                    <button
                      onClick={() => window.location.href = `/dashboard/proveedores/${proveedor.id}`}
                      className="flex items-center gap-1 text-sm text-[#8E94F2] hover:text-[#7278e0] hover:underline transition-colors"
                      title="Ver proveedor"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                    <button
                      onClick={() => restaurarProveedor(proveedor.id)}
                      disabled={restaurandoId === proveedor.id}
                      className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline transition-colors disabled:opacity-50"
                      title="Restaurar proveedor"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {restaurandoId === proveedor.id ? 'Restaurando...' : 'Restaurar'}
                    </button>
                  </div>
                  {/* Segunda fila: Eliminar permanentemente */}
                  <div className="flex items-center justify-center gap-6 w-full">
                    <button
                      onClick={() => eliminarPermanentemente(proveedor.id)}
                      disabled={eliminandoId === proveedor.id}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:underline transition-colors disabled:opacity-50"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                      {eliminandoId === proveedor.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 