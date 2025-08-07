'use client'

import { useState, useEffect } from 'react'
import { Ubicacion, CreateUbicacionDto, UpdateUbicacionDto } from '@/types/sensor'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, X } from 'lucide-react'

interface UbicacionFormProps {
  ubicacion?: Ubicacion | null
  onSubmit: (data: CreateUbicacionDto | UpdateUbicacionDto) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function UbicacionForm({ 
  ubicacion, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: UbicacionFormProps) {
  const [formData, setFormData] = useState<CreateUbicacionDto>({
    nombre: '',
    descripcion: ''
  })
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (ubicacion) {
      setFormData({
        nombre: ubicacion.nombre,
        descripcion: ubicacion.descripcion || ''
      })
    }
  }, [ubicacion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nombre.trim()) {
      setError('El nombre de la ubicación es requerido')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la ubicación')
    }
  }

  const handleInputChange = (field: keyof CreateUbicacionDto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {ubicacion ? 'Editar Ubicación' : 'Crear Nueva Ubicación'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Ubicación *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Ej: Almacén Principal, Refrigerador 1, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Descripción detallada de la ubicación, características especiales, etc."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Información adicional sobre la ubicación (opcional)
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {ubicacion ? 'Actualizar' : 'Crear'} Ubicación
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 