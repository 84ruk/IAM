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
  Eye
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Movimiento } from '@/types/movimiento'
import { cn } from '@/lib/utils'
import VolverAtras from '@/components/ui/VolverAtras'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
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

  if (isLoading) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !error.includes('restaurado correctamente')) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar movimientos</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
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
          <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Papelera de Movimientos</h1>
              <p className="text-gray-600 mt-1">
                Movimientos eliminados ({movimientos.length} movimientos)
              </p>
            </div>
            <Link
              href="/dashboard/movimientos"
              className="flex items-center gap-2 px-6 py-3 bg-[#8E94F2] text-white rounded-xl hover:bg-[#7278e0] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Eye className="w-5 h-5" />
              Ver Movimientos Activos
            </Link>
          </div>

          {/* Alerta de éxito */}
          {error && error.includes('restaurado correctamente') && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-green-700">{error}</span>
            </div>
          )}
        </div>

        {/* Contenido */}
        {movimientos.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay movimientos eliminados
              </h3>
              <p className="text-gray-500 mb-6">
                La papelera está vacía. Los movimientos eliminados aparecerán aquí.
              </p>
              <Link
                href="/dashboard/movimientos"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E94F2] text-white rounded-xl hover:bg-[#7278e0] transition-all duration-200"
              >
                <Eye className="w-5 h-5" />
                Ver Movimientos Activos
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movimientos.map((movimiento) => {
              const tipoInfo = getTipoInfo(movimiento.tipo)
              const TipoIcon = tipoInfo.icon
              const unidadPlural = pluralizarUnidad(movimiento.cantidad, movimiento.producto.unidad)
              
              return (
                <Card 
                  key={movimiento.id} 
                  className="border-2 border-red-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/dashboard/movimientos/eliminados/${movimiento.id}`)}
                >
                  <CardContent className="p-6">
                    {/* Header con tipo y acciones */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full font-medium",
                        tipoInfo.color
                      )}>
                        <TipoIcon className="w-4 h-4" />
                        {tipoInfo.text}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/movimientos/eliminados/${movimiento.id}`);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            restaurarMovimiento(movimiento.id);
                          }}
                          disabled={restaurandoId === movimiento.id}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Información del producto */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-800 text-lg mb-2 truncate group-hover:text-blue-600 transition-colors">
                        {movimiento.producto.nombre}
                      </h3>
                      {movimiento.producto.etiqueta && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                          {movimiento.producto.etiqueta}
                        </span>
                      )}
                    </div>

                    {/* Detalles del movimiento */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">{movimiento.cantidad} {unidadPlural}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(movimiento.fecha)}</span>
                      </div>
                      
                      {movimiento.motivo && (
                        <div className="flex items-start gap-2 text-sm">
                          <MessageCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-gray-500 block">Motivo:</span>
                            <p className="text-gray-700 font-medium truncate">{movimiento.motivo}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Estado eliminado */}
                    <div className="mt-4 pt-4 border-t border-red-100">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                        <Trash2 className="w-3 h-3" />
                        Eliminado
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 