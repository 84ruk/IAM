"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  MessageCircle,
  Eye,
  ArrowLeft,
  XCircle,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Movimiento } from '@/types/movimiento'
import { cn } from '@/lib/utils'
import VolverAtras from '@/components/ui/VolverAtras'
import { format } from 'date-fns'
import { pluralizarUnidad } from '@/lib/pluralization'

const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }).then((res) => {
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
    return res.json()
  })

export default function MovimientosEliminadosClient() {
  const router = useRouter()
  
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurandoId, setRestaurandoId] = useState<number | null>(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    const cargarMovimientos = async () => {
      try {
        setIsLoading(true)
        const data = await fetcher(`${process.env.NEXT_PUBLIC_API_URL}/movimientos/eliminados`)
        setMovimientos(data)
      } catch (error) {
        console.error('Error al cargar movimientos eliminados:', error)
        setError('Error al cargar movimientos eliminados')
      } finally {
        setIsLoading(false)
      }
    }

    cargarMovimientos()
  }, [])

  const restaurarMovimiento = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas restaurar este movimiento?')) {
      return
    }

    try {
      setRestaurandoId(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos/${id}/restaurar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al restaurar el movimiento')
      }

      // Remover el movimiento de la lista
      setMovimientos(prev => prev.filter(m => m.id !== id))
      
      // Mostrar mensaje de éxito
      setError('Movimiento restaurado correctamente')
      setTimeout(() => setError(null), 3000)
    } catch (error) {
      console.error('Error al restaurar:', error)
      setError('Error al restaurar el movimiento')
    } finally {
      setRestaurandoId(null)
    }
  }

  const formatDate = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy HH:mm')
  }

  const getTipoInfo = (tipo: 'ENTRADA' | 'SALIDA') => {
    return tipo === 'ENTRADA' 
      ? { 
          color: 'bg-green-100 text-green-700', 
          icon: ArrowDownLeft, 
          text: 'Entrada'
        }
      : { 
          color: 'bg-red-100 text-red-700', 
          icon: ArrowUpRight, 
          text: 'Salida'
        }
  }

  const movimientosFiltrados = movimientos.filter((m) =>
    m.producto?.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    m.producto?.etiquetas?.some(etiqueta => etiqueta.toLowerCase().includes(filtro.toLowerCase())) ||
    m.motivo?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error && !error.includes('restaurado correctamente')) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar movimientos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
      </div>

      {/* Título y estadísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Papelera de Movimientos</h1>
          <p className="text-gray-600 mt-1">
            Movimientos eliminados que puedes restaurar
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/movimientos"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Movimientos
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
                <p className="text-2xl font-bold text-gray-900">{movimientos.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{movimientosFiltrados.length}</p>
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
          <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar movimientos eliminados..."
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
          error.includes('correctamente') 
            ? "bg-green-50 border-green-200" 
            : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-start gap-3">
            {error.includes('correctamente') ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn(
                "text-sm",
                error.includes('correctamente') ? "text-green-700" : "text-red-700"
              )}>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className={cn(
                "transition-colors",
                error.includes('correctamente') 
                  ? "text-green-400 hover:text-green-600" 
                  : "text-red-400 hover:text-red-600"
              )}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de movimientos eliminados */}
      {movimientosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Trash2 className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filtro ? 'No se encontraron movimientos' : 'No hay movimientos eliminados'}
          </h3>
          <p className="text-gray-600 text-center">
            {filtro 
              ? 'Intenta con otros términos de búsqueda' 
              : 'Los movimientos que elimines aparecerán aquí para que puedas restaurarlos'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movimientosFiltrados.map((movimiento) => {
            const tipoInfo = getTipoInfo(movimiento.tipo)
            const TipoIcon = tipoInfo.icon
            const unidadPlural = pluralizarUnidad(movimiento.cantidad, movimiento.producto?.unidad || 'unidad')
            
            return (
              <Card key={movimiento.id} className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
                <CardContent className="p-6 relative flex flex-col h-full">
                  {/* Icono de tipo en esquina superior derecha */}
                  <div className="absolute top-4 right-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
                      tipoInfo.color
                    )}>
                      <TipoIcon className="w-3 h-3" />
                      {tipoInfo.text}
                    </span>
                  </div>

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 pr-16">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">
                        {movimiento.producto?.nombre || 'Producto no disponible'}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                          Eliminado
                        </span>
                        {movimiento.producto?.etiquetas && movimiento.producto.etiquetas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {movimiento.producto.etiquetas.map((etiqueta, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium border border-blue-200"
                              >
                                {etiqueta}
                          </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-700">
                      <Package className="w-3 h-3" />
                      {movimiento.cantidad} {unidadPlural}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">{formatDate(movimiento.fecha)}</span>
                    </div>
                    {movimiento.motivo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Motivo:</span>
                        <span className="font-medium truncate ml-2">{movimiento.motivo}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="mt-auto flex flex-col items-center gap-2 w-full">
                    {/* Primera fila: Ver y Restaurar */}
                    <div className="flex items-center justify-center gap-6 w-full">
                      <button
                        onClick={() => router.push(`/dashboard/movimientos/eliminados/${movimiento.id}`)}
                        className="flex items-center gap-1 text-sm text-[#8E94F2] hover:text-[#7278e0] hover:underline transition-colors"
                        title="Ver movimiento"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => restaurarMovimiento(movimiento.id)}
                        disabled={restaurandoId === movimiento.id}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline transition-colors disabled:opacity-50"
                        title="Restaurar movimiento"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {restaurandoId === movimiento.id ? 'Restaurando...' : 'Restaurar'}
                      </button>
                    </div>
                    {/* Segunda fila: Fecha */}
                    <div className="flex items-center justify-center gap-6 w-full">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatDate(movimiento.fecha)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 