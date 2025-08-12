'use client'

import { Ubicacion } from '@/types/sensor'
import { SensoresTiempoReal } from '@/components/ui/sensores-tiempo-real'

interface TiempoRealTabProps {
  ubicacion: Ubicacion
}

export function TiempoRealTab({ ubicacion }: TiempoRealTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Monitoreo en Tiempo Real</h2>
        <p className="text-gray-600 mt-1">
          Visualización en tiempo real de los sensores de {ubicacion.nombre}
        </p>
      </div>

      {/* Componente WebSocket */}
      <SensoresTiempoReal ubicacionId={ubicacion.id} />
    </div>
  )
} 