'use client'

import { useRouter } from 'next/navigation'
import { Ubicacion } from '@/types/sensor'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Edit, Trash2, MapPin, Radio, Package, Calendar, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UbicacionCardProps {
  ubicacion: Ubicacion
  onEdit?: (ubicacion: Ubicacion) => void
  onDelete?: (ubicacion: Ubicacion) => void
  onViewSensores?: (ubicacion: Ubicacion) => void
  onViewProductos?: (ubicacion: Ubicacion) => void
}

export function UbicacionCard({ 
  ubicacion, 
  onEdit, 
  onDelete, 
  onViewSensores, 
  onViewProductos 
}: UbicacionCardProps) {
  const router = useRouter()
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleCardClick = () => {
    router.push(`/dashboard/ubicaciones/${ubicacion.id}`)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full" onClick={handleCardClick}>
      <CardContent className="p-6 relative flex flex-col h-full">
        {/* Icono de ubicación en esquina superior derecha */}
        <div className="absolute top-4 right-4">
          <div className={cn(
            "p-2 rounded-lg",
            ubicacion.activa 
              ? "bg-green-100 text-green-600" 
              : "bg-gray-100 text-gray-600"
          )}>
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 pr-12">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">
              {ubicacion.nombre}
            </h3>
        {ubicacion.descripcion && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {ubicacion.descripcion}
              </p>
        )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
                ubicacion.activa 
                  ? "bg-green-100 text-green-700" 
                  : "bg-gray-100 text-gray-600"
              )}>
                {ubicacion.activa ? 'Activa' : 'Inactiva'}
              </span>
          </div>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-700">
            <Radio className="w-3 h-3" />
            {ubicacion._count?.sensores || 0} sensores
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-700">
            <Package className="w-3 h-3" />
            {ubicacion._count?.productos || 0} productos
          </span>
        </div>

        {/* Información adicional */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Creada:</span>
            <span className="font-medium">{formatDate(ubicacion.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ID:</span>
            <span className="font-medium">#{ubicacion.id}</span>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="mt-auto flex flex-col items-center gap-2 w-full">
          {/* Primera fila: Editar y Eliminar */}
          <div className="flex items-center justify-center gap-6 w-full">
          {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(ubicacion)
                }}
                className="flex items-center gap-1 text-sm text-[#8E94F2] hover:text-[#7278e0] hover:underline transition-colors"
                title="Editar ubicación"
            >
              <Edit className="w-4 h-4" />
                Editar
              </button>
          )}
          {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(ubicacion)
                }}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 hover:underline transition-colors"
                title="Eliminar ubicación"
            >
              <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
          )}
          </div>
          
          {/* Segunda fila: Sensores y Productos */}
          <div className="flex items-center justify-center gap-6 w-full">
            {onViewSensores && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewSensores(ubicacion)
                }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                title="Ver sensores"
              >
                <Radio className="w-4 h-4" />
                Sensores
              </button>
            )}
            {onViewProductos && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewProductos(ubicacion)
                }}
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
                title="Ver productos"
              >
                <Package className="w-4 h-4" />
                Productos
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 