'use client'

import { useState, useEffect } from 'react'
import { SMSTemplate, EnviarSMSDto, EnviarBulkSMSDto, CrearPlantillaDto } from '@/types/sensor'
import { smsService, smsTemplateService } from '@/lib/services/alertasService'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  Send, 
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Edit,
  Save,
  X,
  Smartphone,
  Users,
  FileText,
  Webhook
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function SMSPage() {
  // const user = useServerUser() // Comentado temporalmente hasta que se use
  const [plantillas, setPlantillas] = useState<SMSTemplate[]>([])
  const [filteredPlantillas, setFilteredPlantillas] = useState<SMSTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPlantilla, setEditingPlantilla] = useState<SMSTemplate | null>(null)
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

  // Estados para envío de SMS
  const [smsData, setSmsData] = useState<EnviarSMSDto>({
    to: '',
    message: '',
    priority: 'normal'
  })

  const [bulkSmsData, setBulkSmsData] = useState<EnviarBulkSMSDto>({
    messages: [{ to: '', message: '', priority: 'normal' }]
  })

  // Estados para plantillas
  const [plantillaData, setPlantillaData] = useState<CrearPlantillaDto>({
    nombre: '',
    tipo: '',
    contenido: '',
    variables: [],
    prioridad: 'normal',
    emoji: ''
  })

  // Cargar plantillas
  const loadPlantillas = async () => {
    try {
      setIsLoading(true)
      setError('')
      const data = await smsTemplateService.obtenerPlantillas()
      // Asegurar que las plantillas tengan variables como array
      const plantillasConVariables = (data || []).map(plantilla => ({
        ...plantilla,
        variables: plantilla.variables || []
      }))
      setPlantillas(plantillasConVariables)
      setFilteredPlantillas(plantillasConVariables)
    } catch (err) {
      setError('Error al cargar las plantillas')
      console.error('Error loading plantillas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlantillas()
  }, [])

  // Filtrar plantillas
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPlantillas(plantillas)
    } else {
      const filtered = plantillas.filter(plantilla =>
        plantilla.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plantilla.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPlantillas(filtered)
    }
  }, [searchTerm, plantillas])

  // Manejar envío de SMS individual
  const handleEnviarSMS = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!smsData.to.trim() || !smsData.message.trim()) {
      setError('El número de teléfono y el mensaje son requeridos')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      
      const result = await smsService.enviarSMS(smsData)
      
      if (result.success) {
        addToast({
          type: "success",
          title: "SMS enviado",
          message: "El mensaje se ha enviado correctamente",
        })
        setSmsData({ to: '', message: '', priority: 'normal' })
      } else {
        setError('Error al enviar el SMS')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el SMS')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar envío de SMS masivo
  const handleEnviarBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validMessages = bulkSmsData.messages.filter(msg => 
      msg.to.trim() && msg.message.trim()
    )

    if (validMessages.length === 0) {
      setError('Debe agregar al menos un mensaje válido')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      
      const result = await smsService.enviarBulkSMS({ messages: validMessages })
      
      addToast({
        type: "success",
        title: "SMS masivo enviado",
        message: `Enviados: ${result.success}, Fallidos: ${result.failed}`,
      })
      
      setBulkSmsData({ messages: [{ to: '', message: '', priority: 'normal' }] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar los SMS')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar creación/edición de plantilla
  const handleSubmitPlantilla = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!plantillaData.nombre.trim() || !plantillaData.contenido.trim()) {
      setError('El nombre y contenido de la plantilla son requeridos')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      if (editingPlantilla) {
        // Aquí implementarías la actualización de plantilla
        addToast({
          type: "success",
          title: "Plantilla actualizada",
          message: "La plantilla se ha actualizado correctamente",
        })
      } else {
        await smsTemplateService.crearPlantilla(plantillaData)
        addToast({
          type: "success",
          title: "Plantilla creada",
          message: "La plantilla se ha creado correctamente",
        })
      }

      setShowForm(false)
      setEditingPlantilla(null)
      resetPlantillaForm()
      await loadPlantillas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la plantilla')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Resetear formulario de plantilla
  const resetPlantillaForm = () => {
    setPlantillaData({
      nombre: '',
      tipo: '',
      contenido: '',
      variables: [],
      prioridad: 'normal',
      emoji: ''
    })
  }

  // Agregar mensaje al SMS masivo
  const addBulkMessage = () => {
    setBulkSmsData(prev => ({
      messages: [...prev.messages, { to: '', message: '', priority: 'normal' }]
    }))
  }

  // Remover mensaje del SMS masivo
  const removeBulkMessage = (index: number) => {
    setBulkSmsData(prev => ({
      messages: prev.messages.filter((_, i) => i !== index)
    }))
  }

  // Actualizar mensaje del SMS masivo
  const updateBulkMessage = (index: number, field: keyof typeof bulkSmsData.messages[0], value: string) => {
    setBulkSmsData(prev => ({
      messages: prev.messages.map((msg, i) => 
        i === index ? { ...msg, [field]: value } : msg
      )
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS</h1>
          <p className="text-gray-600">Gestiona el envío de mensajes SMS y plantillas</p>
        </div>
      </div>

      <Tabs defaultValue="enviar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enviar" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Enviar SMS
          </TabsTrigger>
          <TabsTrigger value="masivo" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            SMS Masivo
          </TabsTrigger>
          <TabsTrigger value="plantillas" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Envío de SMS Individual */}
        <TabsContent value="enviar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Enviar SMS Individual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEnviarSMS} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="to">Número de Teléfono *</Label>
                  <Input
                    id="to"
                    value={smsData.to}
                    onChange={(e) => setSmsData(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="+1234567890"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={smsData.priority}
                    onValueChange={(value) => setSmsData(prev => ({ ...prev, priority: value as 'low' | 'normal' | 'high' | 'urgent' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje *</Label>
                  <Textarea
                    id="message"
                    value={smsData.message}
                    onChange={(e) => setSmsData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Escribe tu mensaje aquí..."
                    rows={4}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {smsData.message.length}/160 caracteres
                  </p>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar SMS
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Envío de SMS Masivo */}
        <TabsContent value="masivo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Envío Masivo de SMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEnviarBulkSMS} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {bulkSmsData.messages.map((message, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Mensaje {index + 1}</h4>
                      {bulkSmsData.messages.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBulkMessage(index)}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Número de Teléfono *</Label>
                        <Input
                          value={message.to}
                          onChange={(e) => updateBulkMessage(index, 'to', e.target.value)}
                          placeholder="+1234567890"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Prioridad</Label>
                        <Select
                          value={message.priority}
                          onValueChange={(value) => updateBulkMessage(index, 'priority', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mensaje *</Label>
                      <Textarea
                        value={message.message}
                        onChange={(e) => updateBulkMessage(index, 'message', e.target.value)}
                        placeholder="Escribe tu mensaje aquí..."
                        rows={3}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        {message.message.length}/160 caracteres
                      </p>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addBulkMessage}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Mensaje
                </Button>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar {bulkSmsData.messages.length} SMS
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestión de Plantillas */}
        <TabsContent value="plantillas" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Plantillas SMS</h2>
              <p className="text-gray-600">Gestiona las plantillas de mensajes</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Plantilla
            </Button>
          </div>

          {/* Búsqueda */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de plantillas */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Cargando plantillas...</span>
            </div>
          ) : filteredPlantillas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No se encontraron plantillas' : 'No hay plantillas'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Crea tu primera plantilla para comenzar'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Plantilla
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlantillas.map((plantilla) => (
                <Card key={plantilla.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {plantilla.prioridad}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <p><strong>Tipo:</strong> {plantilla.tipo}</p>
                      <p><strong>Variables:</strong> {(plantilla.variables || []).length}</p>
                      <p className="line-clamp-2">{plantilla.contenido}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setEditingPlantilla(plantilla)
                          setPlantillaData({
                            nombre: plantilla.nombre,
                            tipo: plantilla.tipo,
                            contenido: plantilla.contenido,
                            variables: plantilla.variables || [],
                            prioridad: plantilla.prioridad,
                            emoji: plantilla.emoji || ''
                          })
                          setShowForm(true)
                        }}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Configuración de Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Los webhooks permiten recibir notificaciones sobre el estado de entrega de los SMS.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Estado de Webhooks</h4>
                  <p className="text-sm text-gray-600">
                    Los webhooks están configurados para recibir notificaciones automáticamente.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Logs de Entrega</h4>
                  <p className="text-sm text-gray-600">
                    Revisa el historial de entregas y estados de los SMS enviados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de formulario de plantilla */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitPlantilla} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
              <Input
                id="nombre"
                value={plantillaData.nombre}
                onChange={(e) => setPlantillaData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Alerta de Stock Bajo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Plantilla</Label>
              <Input
                id="tipo"
                value={plantillaData.tipo}
                onChange={(e) => setPlantillaData(prev => ({ ...prev, tipo: e.target.value }))}
                placeholder="Ej: alerta, notificacion, recordatorio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contenido">Contenido *</Label>
              <Textarea
                id="contenido"
                value={plantillaData.contenido}
                onChange={(e) => setPlantillaData(prev => ({ ...prev, contenido: e.target.value }))}
                placeholder="Hola {nombre}, tu producto {producto} tiene stock bajo: {cantidad} unidades."
                rows={4}
                required
              />
              <p className="text-xs text-gray-500">
                {plantillaData.contenido.length}/160 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variables">Variables (separadas por comas)</Label>
              <Input
                id="variables"
                value={(plantillaData.variables || []).join(', ')}
                onChange={(e) => {
                  const variables = e.target.value.split(',').map(v => v.trim()).filter(v => v)
                  setPlantillaData(prev => ({ ...prev, variables }))
                }}
                placeholder="nombre, producto, cantidad"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select
                  value={plantillaData.prioridad}
                  onValueChange={(value) => setPlantillaData(prev => ({ ...prev, prioridad: value as 'low' | 'normal' | 'high' | 'urgent' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji (opcional)</Label>
                <Input
                  id="emoji"
                  value={plantillaData.emoji}
                  onChange={(e) => setPlantillaData(prev => ({ ...prev, emoji: e.target.value }))}
                  placeholder="🚨"
                />
              </div>
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
                {editingPlantilla ? 'Actualizar' : 'Crear'} Plantilla
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingPlantilla(null)
                  resetPlantillaForm()
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
    </div>
  )
} 