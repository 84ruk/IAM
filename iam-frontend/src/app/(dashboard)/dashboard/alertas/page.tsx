'use client'

import { useState, useEffect } from 'react'
import { AlertaConfiguracion, ConfigurarAlertaDto, Ubicacion } from '@/types/sensor'
import { alertasService } from '@/lib/services/alertasService'
import { ubicacionService } from '@/lib/services/sensorService'
import { SistemaAlertasConfig } from '@/components/ui/sistema-alertas-config'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Search, 
  Bell, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function AlertasPage() {
  // const user = useServerUser() // Comentado temporalmente hasta que se use
  const [alertas, setAlertas] = useState<AlertaConfiguracion[]>([])
  const [filteredAlertas, setFilteredAlertas] = useState<AlertaConfiguracion[]>([])
  const [, setUbicaciones] = useState<Ubicacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [showSistemaConfig, setShowSistemaConfig] = useState(false)
  const [editingAlerta, setEditingAlerta] = useState<AlertaConfiguracion | null>(null)
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

  // Formulario
  const [formData, setFormData] = useState<ConfigurarAlertaDto>({
    tipoAlerta: '',
    activo: true,
    destinatarios: [],
    frecuencia: 'inmediata',
    ventanaEsperaMinutos: 0,
    umbralCritico: {}
  })

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const [alertasData, ubicacionesData] = await Promise.all([
        alertasService.obtenerConfiguracionesAlertas(),
        ubicacionService.obtenerUbicaciones()
      ])
      
      // Asegurar que las alertas tengan destinatarios como array
      const alertasConDestinatarios = (alertasData || []).map(alerta => ({
        ...alerta,
        destinatarios: alerta.destinatarios || []
      }))
      
      setAlertas(alertasConDestinatarios)
      setFilteredAlertas(alertasConDestinatarios)
      setUbicaciones(ubicacionesData || [])
    } catch {
      setError('Error al cargar las alertas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtrar alertas
  useEffect(() => {
    let filtered = alertas

    if (searchTerm.trim()) {
      filtered = filtered.filter(alerta =>
        alerta.tipoAlerta.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedTipo) {
      filtered = filtered.filter(alerta => alerta.tipoAlerta === selectedTipo)
    }

    setFilteredAlertas(filtered)
  }, [searchTerm, selectedTipo, alertas])

  // Manejar creación/edición de alerta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.tipoAlerta.trim()) {
      setError('El tipo de alerta es requerido')
      return
    }

    if (formData.destinatarios.length === 0) {
      setError('Debe agregar al menos un destinatario')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      if (editingAlerta) {
        await alertasService.actualizarConfiguracionAlerta(editingAlerta.id, formData)
        addToast({
          type: "success",
          title: "Alerta actualizada",
          message: "La configuración de alerta se ha actualizado correctamente",
        })
      } else {
        await alertasService.configurarAlerta(formData)
        addToast({
          type: "success",
          title: "Alerta configurada",
          message: "La alerta se ha configurado correctamente",
        })
      }

      setShowForm(false)
      setEditingAlerta(null)
      resetForm()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la alerta')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar eliminación de alerta
  const handleDelete = async (alertaId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta configuración de alerta?')) {
      return
    }

    try {
      await alertasService.eliminarConfiguracionAlerta(alertaId)
      addToast({
        type: "success",
        title: "Alerta eliminada",
        message: "La configuración de alerta se ha eliminado correctamente",
      })
      await loadData()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo eliminar la alerta",
      })
    }
  }

  // Manejar edición
  const handleEdit = (alerta: AlertaConfiguracion) => {
    setEditingAlerta(alerta)
    setFormData({
      tipoAlerta: alerta.tipoAlerta,
      activo: alerta.activo,
      destinatarios: alerta.destinatarios,
      frecuencia: alerta.frecuencia,
      ventanaEsperaMinutos: alerta.ventanaEsperaMinutos,
      umbralCritico: alerta.umbralCritico || {}
    })
    setShowForm(true)
  }

  // Manejar creación
  const handleCreate = () => {
    setEditingAlerta(null)
    resetForm()
    setShowForm(true)
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      tipoAlerta: '',
      activo: true,
      destinatarios: [],
      frecuencia: 'inmediata',
      ventanaEsperaMinutos: 0,
      umbralCritico: {}
    })
  }

  // Manejar destinatarios
  const handleDestinatariosChange = (value: string) => {
    const emails = value.split(',').map(email => email.trim()).filter(email => email)
    setFormData(prev => ({
      ...prev,
      destinatarios: emails
    }))
  }

  // Estadísticas
  const stats = {
    total: alertas.length,
    activas: alertas.filter(a => a.activo).length,
    inactivas: alertas.filter(a => !a.activo).length,
    tipos: [...new Set(alertas.map(a => a.tipoAlerta))].length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alertas Avanzadas</h1>
          <p className="text-gray-600">Configura y gestiona las alertas de tu sistema</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = '/dashboard/alertas-activas'} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <AlertTriangle className="w-4 h-4" />
            Alertas Activas
          </Button>
          <Button 
            onClick={() => setShowSistemaConfig(true)} 
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <Settings className="w-4 h-4" />
            Configuración del Sistema
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Alerta
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Alertas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Alertas Activas</p>
                <p className="text-2xl font-bold">{stats.activas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Alertas Inactivas</p>
                <p className="text-2xl font-bold">{stats.inactivas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Tipos Diferentes</p>
                <p className="text-2xl font-bold">{stats.tipos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar alertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                {[...new Set(alertas.map(a => a.tipoAlerta))].map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de alertas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Cargando alertas...</span>
        </div>
      ) : filteredAlertas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedTipo ? 'No se encontraron alertas' : 'No hay alertas configuradas'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedTipo 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Configura tu primera alerta para comenzar'
              }
            </p>
            {!searchTerm && !selectedTipo && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Configurar Alerta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlertas.map((alerta) => (
            <Card key={alerta.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-lg">{alerta.tipoAlerta}</CardTitle>
                  </div>
                  <Badge 
                    variant={alerta.activo ? "default" : "secondary"}
                    className={alerta.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                  >
                    {alerta.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p><strong>Frecuencia:</strong> {alerta.frecuencia}</p>
                                        <p><strong>Destinatarios:</strong> {(alerta.destinatarios || []).length}</p>
                  {alerta.ventanaEsperaMinutos && (
                    <p><strong>Ventana:</strong> {alerta.ventanaEsperaMinutos} min</p>
                  )}
                  <p><strong>Creada:</strong> {new Date(alerta.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(alerta)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(alerta.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAlerta ? 'Editar Alerta' : 'Nueva Alerta'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="tipoAlerta">Tipo de Alerta *</Label>
              <Input
                id="tipoAlerta"
                value={formData.tipoAlerta}
                onChange={(e) => setFormData(prev => ({ ...prev, tipoAlerta: e.target.value }))}
                placeholder="Ej: Temperatura Crítica, Stock Bajo, etc."
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
              />
              <Label htmlFor="activo">Alerta Activa</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinatarios">Destinatarios (emails separados por comas) *</Label>
              <Input
                id="destinatarios"
                value={formData.destinatarios.join(', ')}
                onChange={(e) => handleDestinatariosChange(e.target.value)}
                placeholder="email1@ejemplo.com, email2@ejemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frecuencia">Frecuencia</Label>
              <Select
                value={formData.frecuencia}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frecuencia: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inmediata">Inmediata</SelectItem>
                  <SelectItem value="diaria">Diaria</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ventanaEspera">Ventana de Espera (minutos)</Label>
              <Input
                id="ventanaEspera"
                type="number"
                value={formData.ventanaEsperaMinutos || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  ventanaEsperaMinutos: parseInt(e.target.value) || 0 
                }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="umbralCritico">Umbral Crítico (JSON opcional)</Label>
              <Textarea
                id="umbralCritico"
                value={JSON.stringify(formData.umbralCritico, null, 2)}
                onChange={(e) => {
                  try {
                    const umbral = JSON.parse(e.target.value)
                    setFormData(prev => ({ ...prev, umbralCritico: umbral }))
                  } catch {
                    // Ignorar errores de JSON mientras el usuario escribe
                  }
                }}
                placeholder='{"temperaturaMax": 30, "humedadMin": 40}'
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingAlerta ? 'Actualizar' : 'Crear'} Alerta
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingAlerta(null)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de configuración del sistema de alertas */}
      <Dialog open={showSistemaConfig} onOpenChange={setShowSistemaConfig}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuración del Sistema de Alertas</DialogTitle>
          </DialogHeader>
          <SistemaAlertasConfig
            onComplete={() => {
              setShowSistemaConfig(false)
              addToast({
                title: 'Configuración guardada exitosamente',
                message: 'La configuración del sistema de alertas se ha actualizado',
                type: 'success'
              })
            }}
            onCancel={() => setShowSistemaConfig(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 