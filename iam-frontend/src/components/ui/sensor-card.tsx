'use client'

import { Sensor, SensorTipo } from '@/types/sensor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Edit, Trash2, Activity, Thermometer, Droplets, Gauge, Weight } from 'lucide-react'

interface SensorCardProps {
  sensor: Sensor
  onEdit?: (sensor: Sensor) => void
  onDelete?: (sensorId: number) => void
  onViewDetails?: (sensor: Sensor) => void
}

const getSensorIcon = (tipo: SensorTipo) => {
  switch (tipo) {
    case SensorTipo.TEMPERATURA:
      return <Thermometer className="w-4 h-4" />
    case SensorTipo.HUMEDAD:
      return <Droplets className="w-4 h-4" />
    case SensorTipo.PRESION:
      return <Gauge className="w-4 h-4" />
    case SensorTipo.PESO:
      return <Weight className="w-4 h-4" />
    default:
      return <Activity className="w-4 h-4" />
  }
}

const getSensorColor = (tipo: SensorTipo) => {
  switch (tipo) {
    case SensorTipo.TEMPERATURA:
      return 'bg-red-100 text-red-800 border-red-200'
    case SensorTipo.HUMEDAD:
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case SensorTipo.PRESION:
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case SensorTipo.PESO:
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function SensorCard({ sensor, onEdit, onDelete, onViewDetails }: SensorCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSensorIcon(sensor.tipo)}
            <CardTitle className="text-lg">{sensor.nombre}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={sensor.activo ? "default" : "secondary"}
              className={sensor.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
            >
              {sensor.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
        <Badge className={getSensorColor(sensor.tipo)}>
          {sensor.tipo}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600">
          <p><strong>Ubicación:</strong> {sensor.ubicacion?.nombre || 'Sin ubicación'}</p>
          <p><strong>ID:</strong> {sensor.id}</p>
          <p><strong>Creado:</strong> {new Date(sensor.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div className="flex gap-2">
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(sensor)}
              className="flex-1"
            >
              <Activity className="w-4 h-4 mr-1" />
              Ver Detalles
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(sensor)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(sensor.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 