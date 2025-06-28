'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  AlertTriangle,
  Save,
  X
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { MovimientoDetalle } from '@/types/movimiento'
import VolverAtras from '@/components/ui/VolverAtras'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { requireAuth } from '@/lib/ssrAuth'

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

export default async function EditarMovimientoPage() {
  const user = await requireAuth()
  if (!user) return null

  const params = useParams()
  const router = useRouter()
  
  const [movimiento, setMovimiento] = useState<MovimientoDetalle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  
  // Formulario
  const [motivo, setMotivo] = useState('')
  const [descripcion, setDescripcion] = useState('')

  useEffect(() => {
    const cargarMovimiento = async () => {
      if (!params.id) return
      
      try {
        setIsLoading(true)
        const data = await fetcher(`${process.env.NEXT_PUBLIC_API_URL}/movimientos/${params.id}`)
        setMovimiento(data)
        setMotivo(data.motivo || '')
        setDescripcion(data.descripcion || '')
      } catch (error) {
        console.error('Error al cargar el movimiento:', error)
        setError('Error al cargar el movimiento')
      } finally {
        setIsLoading(false)
      }
    }

    cargarMovimiento()
  }, [params.id])

  const guardarCambios = async () => {
    if (!movimiento) return

    try {
      setGuardando(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos/${movimiento.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivo: motivo || null,
          descripcion: descripcion || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el movimiento')
      }

      router.push(`/dashboard/movimientos/${movimiento.id}`)
    } catch (error) {
      console.error('Error al guardar:', error)
      setError('Error al guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  const formatDate = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy HH:mm')
  }

  if (isLoading) {
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

  if (error || !movimiento) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar el movimiento</h2>
            <p className="text-gray-600 mb-4">{error || 'Movimiento no encontrado'}</p>
            <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <VolverAtras href={`/dashboard/movimientos/${movimiento.id}`} label="Volver al movimiento" />
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-800">Editar Movimiento #{movimiento.id}</h1>
            <p className="text-gray-600 mt-2">
              {movimiento.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} de {movimiento.cantidad} {movimiento.producto.unidad} de {movimiento.producto.nombre}
            </p>
            <p className="text-sm text-gray-500 mt-1">{formatDate(movimiento.fecha)}</p>
          </div>
        </div>

        {/* Alerta de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
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

        {/* Formulario */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Información del Movimiento</h2>
            
            <div className="space-y-6">
              <div>
                <Input
                  label="Motivo"
                  name="motivo"
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Compra a proveedor, Venta a cliente, Ajuste de inventario..."
                  className="w-full"
                  optional
                />
                <p className="text-sm text-gray-500 mt-1">
                  Razón principal del movimiento
                </p>
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles adicionales del movimiento..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Información adicional opcional
                </p>
              </div>
            </div>

            {/* Información de solo lectura */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Información que no se puede editar</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Tipo</p>
                  <p className="font-medium">{movimiento.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cantidad</p>
                  <p className="font-medium">{movimiento.cantidad} {movimiento.producto.unidad}</p>
                </div>
                <div>
                  <p className="text-gray-600">Producto</p>
                  <p className="font-medium">{movimiento.producto.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fecha</p>
                  <p className="font-medium">{formatDate(movimiento.fecha)}</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => router.push(`/dashboard/movimientos/${movimiento.id}`)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambios}
                disabled={guardando}
                className="flex items-center gap-2 px-6 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 