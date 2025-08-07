'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Ubicacion } from '@/types/sensor'
import { ubicacionService } from '@/lib/services/sensorService'
import { UbicacionDetalleClient } from './UbicacionDetalleClient'
import { Loader2 } from 'lucide-react'

export default function UbicacionDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const ubicacionId = Number(params?.id || 0)

  useEffect(() => {
    const loadUbicacion = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        const data = await ubicacionService.obtenerUbicacion(ubicacionId)
        setUbicacion(data)
      } catch (err) {
        setError('Error al cargar la ubicación')
        console.error('❌ Error loading ubicacion:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (ubicacionId) {
      loadUbicacion()
    }
  }, [ubicacionId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#8E94F2]" />
          <p className="text-gray-600">Cargando ubicación...</p>
        </div>
      </div>
    )
  }

  if (error || !ubicacion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">
            {error || 'No se pudo cargar la ubicación'}
          </p>
          <button
            onClick={() => router.push('/dashboard/ubicaciones')}
            className="bg-[#8E94F2] text-white px-4 py-2 rounded-lg hover:bg-[#7278e0] transition-colors"
          >
            Volver a Ubicaciones
          </button>
        </div>
      </div>
    )
  }

  return <UbicacionDetalleClient ubicacion={ubicacion} />
} 