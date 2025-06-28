"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { 
  ArrowLeft, 
  Trash2, 
  RotateCcw,
  AlertTriangle,
  X,
  Building2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Package,
  Search
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { CardSkeleton } from "@/components/ui/CardSkeleton"
import { Proveedor } from "@/types/proveedor"
import { useUser } from "@/lib/useUser"
import { cn } from "@/lib/utils"
import VolverAtras from '@/components/ui/VolverAtras'

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

export default function ProveedoresEliminadosPage() {
  const { data: user } = useUser()
  
  // Estados de UI
  const [pagina, setPagina] = useState(1)
  const [restaurandoId, setRestaurandoId] = useState<number | null>(null)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  // Obtener proveedores eliminados
  const { data: proveedores, isLoading, error: errorProveedores, mutate } = useSWR<Proveedor[]>("/proveedores/eliminados", fetcher)

  const itemsPorPagina = 12

  // Proveedores filtrados y paginados
  const proveedoresFiltrados = useMemo(() => {
    if (!proveedores) return []
    
    let filtrados = proveedores
    if (filtro) {
      filtrados = proveedores.filter(proveedor =>
        proveedor.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        (proveedor.email && proveedor.email.toLowerCase().includes(filtro.toLowerCase())) ||
        (proveedor.telefono && proveedor.telefono.includes(filtro))
      )
    }
    
    return filtrados.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina)
  }, [proveedores, filtro, pagina])

  // Calcular total de páginas
  const totalPaginas = useMemo(() => {
    if (!proveedores) return 1
    const filtrados = filtro ? proveedores.filter(proveedor =>
      proveedor.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      (proveedor.email && proveedor.email.toLowerCase().includes(filtro.toLowerCase())) ||
      (proveedor.telefono && proveedor.telefono.includes(filtro))
    ) : proveedores
    return Math.ceil(filtrados.length / itemsPorPagina)
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
    } catch (parseError) {
      mostrarError(`Error al ${accion}. Código de estado: ${response.status}`)
    }
  }

  const restaurarProveedor = async (id: number) => {
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
    } catch (error) {
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
    } catch (error) {
      mostrarError('Error al eliminar el proveedor. Intenta nuevamente.')
    } finally {
      setEliminandoId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar proveedores eliminados</h2>
          <p className="text-gray-600 mb-4">No se pudieron cargar los proveedores eliminados. Intenta recargar la página.</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <VolverAtras href="/dashboard/proveedores" label="Volver a proveedores" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Proveedores Eliminados</h1>
          <p className="text-gray-600 mt-1">
            {proveedores?.length || 0} proveedores eliminados
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de proveedores eliminados */}
      {proveedoresFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay proveedores eliminados</h3>
          <p className="text-gray-500 mb-6">Los proveedores que elimines aparecerán aquí y podrás restaurarlos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {proveedoresFiltrados.map((proveedor) => (
            <Card key={proveedor.id} className="hover:shadow-lg transition-shadow border-red-200 flex flex-col h-full">
              <CardContent className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">
                      {proveedor.nombre}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                        Eliminado
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="space-y-2 mb-4">
                  {proveedor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{proveedor.email}</span>
                    </div>
                  )}
                  {proveedor.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{proveedor.telefono}</span>
                    </div>
                  )}
                </div>

                {/* Productos asociados */}
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {proveedor.productos?.length || 0} producto(s) asociado(s)
                  </span>
                </div>

                {/* Acciones */}
                <div className="mt-auto flex flex-col items-center gap-2 w-full">
                  <div className="flex items-center justify-center gap-6 w-full">
                    <button
                      onClick={() => restaurarProveedor(proveedor.id)}
                      disabled={restaurandoId === proveedor.id}
                      className="flex items-center gap-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-700 disabled:text-gray-500 font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      {restaurandoId === proveedor.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      {restaurandoId === proveedor.id ? 'Restaurando...' : 'Restaurar'}
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