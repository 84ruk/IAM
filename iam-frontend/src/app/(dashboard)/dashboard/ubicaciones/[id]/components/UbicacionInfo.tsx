'use client'

import { useState } from 'react'
import { Ubicacion, UpdateUbicacionDto } from '@/types/sensor'
import { ubicacionService } from '@/lib/services/sensorService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import  Button  from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { 
  Edit, 
  MapPin, 
  Hash,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface UbicacionInfoProps {
  ubicacion: Ubicacion
}

export function UbicacionInfo({ ubicacion }: UbicacionInfoProps) {
  // const [isEditing, setIsEditing] = useState(false) // Comentado temporalmente hasta que se use
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState<UpdateUbicacionDto>({
    nombre: ubicacion.nombre,
    descripcion: ubicacion.descripcion || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEdit = () => {
    setFormData({
      nombre: ubicacion.nombre,
      descripcion: ubicacion.descripcion || '',
    })
    setShowEditModal(true)
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      await ubicacionService.actualizarUbicacion(ubicacion.id, formData)
      
      addToast({
        type: "success",
        title: "Ubicación actualizada",
        message: "La ubicación se ha actualizado correctamente",
      })
      
      setShowEditModal(false)
      // Recargar la página para mostrar los cambios
      window.location.reload()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo actualizar la ubicación",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Información General */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#8E94F2]" />
              Información General
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nombre</label>
              <p className="text-lg font-semibold text-gray-900">{ubicacion.nombre}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Estado</label>
              <div className="flex items-center gap-2 mt-1">
                {ubicacion.activa ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  ubicacion.activa ? 'text-green-600' : 'text-red-600'
                }`}>
                  {ubicacion.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>
          
          {ubicacion.descripcion && (
            <div>
              <label className="text-sm font-medium text-gray-600">Descripción</label>
              <p className="text-gray-900 mt-1">{ubicacion.descripcion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalles Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#8E94F2]" />
            Detalles Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">ID de Ubicación</label>
              <p className="text-lg font-mono text-gray-900">#{ubicacion.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">ID de Empresa</label>
              <p className="text-lg font-mono text-gray-900">#{ubicacion.empresaId}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
              <p className="text-gray-900">{formatDate(ubicacion.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Última Actualización</label>
              <p className="text-gray-900">{formatDate(ubicacion.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edición */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Ubicación</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nombre</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre de la ubicación"
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Descripción</label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la ubicación"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#8E94F2] text-white hover:bg-[#7278e0]"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 