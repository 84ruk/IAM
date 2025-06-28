"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { 
  Plus, 
  Trash2, 
  AlertTriangle,
  X,
  Building2
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/CardSkeleton"
import { Proveedor } from "@/types/proveedor"
import { User } from "@/types/user"
import ProveedorFormModal from "@/components/ui/ProveedorFormModal"
import ProveedorCard from "@/components/proveedores/ProveedorCard"
import ProveedorFilters from "@/components/proveedores/ProveedorFilters"
import EmptyState from "@/components/proveedores/EmptyState"
import Pagination from "@/components/ui/Pagination"
import { useUser } from "@/lib/useUser"
import { requireAuth } from '@/lib/ssrAuth'

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

export default async function ProveedoresPage() {
  const user = await requireAuth()
  if (!user) return null
  
  const { data: userData } = useUser()
  
  // Estados de filtros
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVO' | 'INACTIVO' | ''>('')
  
  // Estados de UI
  const [pagina, setPagina] = useState(1)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [proveedorEdit, setProveedorEdit] = useState<Proveedor | null>(null)

  // Construir URL con filtros
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (filtroTexto) params.set('search', filtroTexto)
    if (filtroEstado) params.set('estado', filtroEstado)
    
    const queryString = params.toString()
    return `/proveedores${queryString ? `?${queryString}` : ''}`
  }

  // Obtener proveedores con filtros aplicados en el backend
  const { data: proveedores, isLoading, error: errorProveedores, mutate } = useSWR<Proveedor[]>(buildUrl(), fetcher)

  const itemsPorPagina = 12

  // Proveedores filtrados y paginados
  const proveedoresFiltrados = useMemo(() => {
    if (!proveedores) return []
    return proveedores.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina)
  }, [proveedores, pagina])

  // Calcular total de páginas
  const totalPaginas = useMemo(() => {
    if (!proveedores) return 1
    return Math.ceil(proveedores.length / itemsPorPagina)
  }, [proveedores])

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroTexto('')
    setFiltroEstado('')
    setPagina(1)
  }

  // Verificar si hay filtros activos
  const hayFiltrosActivos = Boolean(filtroTexto || filtroEstado)

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

  const eliminarProveedor = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor? Esta acción lo ocultará del sistema pero podrás restaurarlo desde la papelera.')) {
      return
    }

    try {
      setEliminandoId(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        await manejarErrorBackend(response, 'eliminar')
        return
      }

      mostrarError('Proveedor eliminado correctamente. Puedes restaurarlo desde la papelera.')
      mutate() // Recargar datos
    } catch (error) {
      mostrarError('Error al eliminar el proveedor. Intenta nuevamente.')
    } finally {
      setEliminandoId(null)
    }
  }

  const activarProveedor = async (id: number) => {
    try {
      setEliminandoId(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores/${id}/reactivar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        await manejarErrorBackend(response, 'activar')
        return
      }

      mostrarError('Proveedor activado correctamente.')
      mutate() // Recargar datos
    } catch (error) {
      mostrarError('Error al activar el proveedor. Intenta nuevamente.')
    } finally {
      setEliminandoId(null)
    }
  }

  const desactivarProveedor = async (id: number) => {
    try {
      setEliminandoId(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores/${id}/desactivar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        await manejarErrorBackend(response, 'desactivar')
        return
      }

      mostrarError('Proveedor desactivado correctamente.')
      mutate() // Recargar datos
    } catch (error) {
      mostrarError('Error al desactivar el proveedor. Intenta nuevamente.')
    } finally {
      setEliminandoId(null)
    }
  }

  const handleSuccess = () => {
    setShowModal(false)
    setProveedorEdit(null)
    mutate()
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (errorProveedores) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar proveedores</h2>
            <p className="text-gray-600 mb-4">{errorProveedores.message}</p>
            <button
              onClick={() => mutate()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Proveedores</h1>
              <p className="text-gray-600 mt-1">
                Gestiona tus proveedores ({proveedores?.length || 0} proveedores)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/proveedores/eliminados"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200"
              >
                <Trash2 className="w-4 h-4" />
                Papelera
              </Link>
              <button
                onClick={() => {
                  setProveedorEdit(null)
                  setShowModal(true)
                }}
                className="flex items-center gap-2 px-6 py-3 bg-[#8E94F2] text-white rounded-xl hover:bg-[#7278e0] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Nuevo proveedor
              </button>
            </div>
          </div>

          {/* Alerta de error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filtros */}
          <ProveedorFilters
            filtroTexto={filtroTexto}
            setFiltroTexto={setFiltroTexto}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            mostrarFiltros={mostrarFiltros}
            setMostrarFiltros={setMostrarFiltros}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiarFiltros={limpiarFiltros}
          />
        </div>

        {/* Contenido principal */}
        {!proveedores || proveedores.length === 0 ? (
          <EmptyState
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiarFiltros={limpiarFiltros}
            onAgregarProveedor={() => {
              setProveedorEdit(null)
              setShowModal(true)
            }}
          />
        ) : (
          <>
            {/* Vista de tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {proveedoresFiltrados.map((proveedor) => (
                <ProveedorCard
                  key={proveedor.id}
                  proveedor={proveedor}
                  onEliminar={eliminarProveedor}
                  eliminandoId={eliminandoId}
                  userRol={userData?.rol || 'EMPLEADO'}
                  onEdit={(p) => {
                    setProveedorEdit(p)
                    setShowModal(true)
                  }}
                />
              ))}
            </div>

            {/* Paginación */}
            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              onPageChange={setPagina}
            />
          </>
        )}
      </div>

      {/* Modal del formulario de proveedores */}
      <ProveedorFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setProveedorEdit(null)
        }}
        onSuccess={handleSuccess}
        proveedor={proveedorEdit}
      />
    </div>
  )
} 