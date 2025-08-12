'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Ubicacion, CreateUbicacionDto, UpdateUbicacionDto } from '@/types/sensor'
import { ubicacionService } from '@/lib/services/sensorService'
import { UbicacionCard } from '@/components/ui/ubicacion-card'
import { UbicacionForm } from '@/components/ui/ubicacion-form'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { 
  Plus, 
  Search, 
  MapPin, 
  Radio, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function UbicacionesPage() {
  // const user = useServerUser() // Comentado temporalmente hasta que se use
  const router = useRouter()
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [filteredUbicaciones, setFilteredUbicaciones] = useState<Ubicacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null)
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

  // Cargar ubicaciones
  const loadUbicaciones = async () => {
    try {
      setIsLoading(true)
      setError('')
      console.log('🔍 Ubicaciones: Iniciando carga de ubicaciones...')
      
      const data = await ubicacionService.obtenerUbicaciones()
      console.log('🔍 Ubicaciones: Datos recibidos:', data)
      
      // Asegurar que data sea un array
      const ubicacionesArray = Array.isArray(data) ? data : []
      console.log('🔍 Ubicaciones: Array procesado:', ubicacionesArray)
      
      setUbicaciones(ubicacionesArray)
      setFilteredUbicaciones(ubicacionesArray)
    } catch (err) {
      setError('Error al cargar las ubicaciones')
      console.error('❌ Error loading ubicaciones:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUbicaciones()
  }, [])

  // Filtrar ubicaciones por término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUbicaciones(ubicaciones)
    } else {
      const filtered = ubicaciones.filter(ubicacion =>
        ubicacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ubicacion.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUbicaciones(filtered)
    }
  }, [searchTerm, ubicaciones])

  // Manejar creación/edición de ubicación
  const handleSubmit = async (data: CreateUbicacionDto | UpdateUbicacionDto) => {
    try {
      setIsSubmitting(true)
      setError('')

      if (editingUbicacion) {
        await ubicacionService.actualizarUbicacion(editingUbicacion.id, data as UpdateUbicacionDto)
        addToast({
          type: "success",
          title: "Ubicación actualizada",
          message: "La ubicación se ha actualizado correctamente",
        })
      } else {
        await ubicacionService.crearUbicacion(data as CreateUbicacionDto)
        addToast({
          type: "success",
          title: "Ubicación creada",
          message: "La ubicación se ha creado correctamente",
        })
      }

      setShowForm(false)
      setEditingUbicacion(null)
      await loadUbicaciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la ubicación')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar eliminación de ubicación
  const handleDelete = async (ubicacionId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta ubicación?')) {
      return
    }

    try {
      await ubicacionService.eliminarUbicacion(ubicacionId)
      addToast({
        type: "success",
        title: "Ubicación eliminada",
        message: "La ubicación se ha eliminado correctamente",
      })
      await loadUbicaciones()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo eliminar la ubicación",
      })
    }
  }

  // Manejar edición - navegar a página de detalles
  const handleEdit = (ubicacion: Ubicacion) => {
    router.push(`/dashboard/ubicaciones/${ubicacion.id}`)
  }

  // Manejar creación
  const handleCreate = () => {
    setEditingUbicacion(null)
    setShowForm(true)
  }

  // Estadísticas
  const stats = {
    total: ubicaciones.length,
    activas: ubicaciones.filter(u => u.activa).length,
    totalSensores: ubicaciones.reduce((sum, u) => sum + (u._count?.sensores || 0), 0),
    totalProductos: ubicaciones.reduce((sum, u) => sum + (u._count?.productos || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ubicaciones</h1>
          <p className="text-gray-600 mt-1">Gestiona las ubicaciones de tu empresa</p>
        </div>
        <Button 
          onClick={handleCreate} 
          className="flex items-center gap-2 bg-[#8E94F2] text-white hover:bg-[#7278e0] px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Ubicación</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ubicaciones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ubicaciones Activas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activas}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sensores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSensores}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Radio className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
                placeholder="Buscar ubicaciones por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
            />
            </div>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                className="px-4 py-3 rounded-lg"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Lista de ubicaciones */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#8E94F2]" />
          <span className="ml-2 text-gray-600">Cargando ubicaciones...</span>
        </div>
      ) : filteredUbicaciones.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron ubicaciones' : 'No hay ubicaciones'}
            </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm 
              ? 'Intenta con otros términos de búsqueda o verifica la ortografía'
              : 'Comienza creando tu primera ubicación para organizar mejor tu inventario'
              }
            </p>
            {!searchTerm && (
            <Button 
              onClick={handleCreate}
              className="bg-[#8E94F2] text-white hover:bg-[#7278e0] px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Primera Ubicación
              </Button>
            )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Ubicaciones ({filteredUbicaciones.length})
            </h2>
            {searchTerm && (
              <p className="text-sm text-gray-500">
                Resultados para: &quot;{searchTerm}&quot;
              </p>
            )}
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUbicaciones.map((ubicacion) => (
            <UbicacionCard
              key={ubicacion.id}
              ubicacion={ubicacion}
              onEdit={handleEdit}
                onDelete={(ubicacion) => handleDelete(ubicacion.id)}
            />
          ))}
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingUbicacion ? 'Editar Ubicación' : 'Nueva Ubicación'}
            </DialogTitle>
          </DialogHeader>
          <UbicacionForm
            ubicacion={editingUbicacion}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditingUbicacion(null)
            }}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 