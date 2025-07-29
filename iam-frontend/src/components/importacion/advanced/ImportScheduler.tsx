'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { 
  Clock,
  Calendar,
  Play,
  Pause,
  Trash2,
  Edit,
  Plus,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText,
  Package,
  ShoppingCart,
  Activity,
  Bell,
  Settings,
  Info,
  Zap,
  CalendarDays,
  Repeat,
  StopCircle
} from 'lucide-react'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'

interface ScheduledImport {
  id: string
  nombre: string
  tipo: TipoImportacion
  archivoPath: string
  opciones: any
  frecuencia: 'diaria' | 'semanal' | 'mensual' | 'personalizada'
  hora: string
  dias: string[]
  activo: boolean
  ultimaEjecucion?: string
  proximaEjecucion: string
  totalEjecuciones: number
  exitosas: number
  conError: number
  fechaCreacion: string
}

interface ImportSchedulerProps {
  className?: string
}

export default function ImportScheduler({ className = '' }: ImportSchedulerProps) {
  const [scheduledImports, setScheduledImports] = useState<ScheduledImport[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingImport, setEditingImport] = useState<ScheduledImport | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'productos' as TipoImportacion,
    frecuencia: 'diaria' as 'diaria' | 'semanal' | 'mensual' | 'personalizada',
    hora: '09:00',
    dias: [] as string[],
    opciones: {}
  })

  // Días de la semana
  const diasSemana = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ]

  // Cargar importaciones programadas (simulado)
  useEffect(() => {
    // Simular datos de importaciones programadas
    const mockData: ScheduledImport[] = [
      {
        id: '1',
        nombre: 'Importación diaria de productos',
        tipo: 'productos',
        archivoPath: '/uploads/plantillas/productos-diarios.xlsx',
        opciones: { sobrescribirExistentes: false },
        frecuencia: 'diaria',
        hora: '08:00',
        dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
        activo: true,
        ultimaEjecucion: '2024-01-15T08:00:00Z',
        proximaEjecucion: '2024-01-16T08:00:00Z',
        totalEjecuciones: 45,
        exitosas: 42,
        conError: 3,
        fechaCreacion: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        nombre: 'Actualización semanal de proveedores',
        tipo: 'proveedores',
        archivoPath: '/uploads/plantillas/proveedores-semanal.xlsx',
        opciones: { validarSolo: false },
        frecuencia: 'semanal',
        hora: '10:00',
        dias: ['lunes'],
        activo: true,
        ultimaEjecucion: '2024-01-15T10:00:00Z',
        proximaEjecucion: '2024-01-22T10:00:00Z',
        totalEjecuciones: 12,
        exitosas: 11,
        conError: 1,
        fechaCreacion: '2024-01-01T00:00:00Z'
      }
    ]
    setScheduledImports(mockData)
  }, [])

  // Manejar cambio en el formulario
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // Manejar selección de días
  const handleDayToggle = useCallback((dia: string) => {
    setFormData(prev => ({
      ...prev,
      dias: prev.dias.includes(dia)
        ? prev.dias.filter(d => d !== dia)
        : [...prev.dias, dia]
    }))
  }, [])

  // Crear nueva importación programada
  const handleCreateScheduledImport = useCallback(async () => {
    if (!selectedFile || !formData.nombre.trim()) return

    const newImport: ScheduledImport = {
      id: Date.now().toString(),
      nombre: formData.nombre,
      tipo: formData.tipo,
      archivoPath: `/uploads/scheduled/${selectedFile.name}`,
      opciones: formData.opciones,
      frecuencia: formData.frecuencia,
      hora: formData.hora,
      dias: formData.dias,
      activo: true,
      proximaEjecucion: calculateNextExecution(formData.frecuencia, formData.hora, formData.dias),
      totalEjecuciones: 0,
      exitosas: 0,
      conError: 0,
      fechaCreacion: new Date().toISOString()
    }

    setScheduledImports(prev => [...prev, newImport])
    setShowCreateForm(false)
    setFormData({
      nombre: '',
      tipo: 'productos',
      frecuencia: 'diaria',
      hora: '09:00',
      dias: [],
      opciones: {}
    })
    setSelectedFile(null)
  }, [formData, selectedFile])

  // Calcular próxima ejecución
  const calculateNextExecution = (frecuencia: string, hora: string, dias: string[]): string => {
    const now = new Date()
    const [hours, minutes] = hora.split(':').map(Number)
    
    let nextDate = new Date(now)
    nextDate.setHours(hours, minutes, 0, 0)
    
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1)
    }
    
    return nextDate.toISOString()
  }

  // Toggle estado de importación programada
  const toggleImportStatus = useCallback((id: string) => {
    setScheduledImports(prev => prev.map(imp => 
      imp.id === id ? { ...imp, activo: !imp.activo } : imp
    ))
  }, [])

  // Eliminar importación programada
  const deleteScheduledImport = useCallback((id: string) => {
    setScheduledImports(prev => prev.filter(imp => imp.id !== id))
  }, [])

  // Editar importación programada
  const editScheduledImport = useCallback((importacion: ScheduledImport) => {
    setEditingImport(importacion)
    setFormData({
      nombre: importacion.nombre,
      tipo: importacion.tipo,
      frecuencia: importacion.frecuencia,
      hora: importacion.hora,
      dias: importacion.dias,
      opciones: importacion.opciones
    })
    setShowCreateForm(true)
  }, [])

  // Obtener icono por tipo
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'productos':
        return <Package className="h-4 w-4" />
      case 'proveedores':
        return <ShoppingCart className="h-4 w-4" />
      case 'movimientos':
        return <Activity className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Obtener color del badge por estado
  const getStatusBadgeVariant = (activo: boolean) => {
    return activo ? 'default' as const : 'secondary' as const
  }

  // Obtener icono por frecuencia
  const getFrecuenciaIcon = (frecuencia: string) => {
    switch (frecuencia) {
      case 'diaria':
        return <CalendarDays className="h-4 w-4" />
      case 'semanal':
        return <Calendar className="h-4 w-4" />
      case 'mensual':
        return <Calendar className="h-4 w-4" />
      case 'personalizada':
        return <Settings className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Programador de Importaciones</CardTitle>
                <p className="text-sm text-gray-600">
                  Configura importaciones automáticas programadas
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Programación</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de importaciones programadas */}
      <div className="space-y-4">
        {scheduledImports.map((importacion) => (
          <Card key={importacion.id} className="border-l-4 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    {getTipoIcon(importacion.tipo)}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{importacion.nombre}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center space-x-1">
                        {getFrecuenciaIcon(importacion.frecuencia)}
                        <span className="capitalize">{importacion.frecuencia}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{importacion.hora}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{importacion.dias.length} días</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Próxima ejecución</div>
                    <div className="font-medium">
                      {new Date(importacion.proximaEjecucion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <Badge variant={getStatusBadgeVariant(importacion.activo)}>
                    {importacion.activo ? 'Activo' : 'Pausado'}
                  </Badge>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleImportStatus(importacion.id)}
                      className={importacion.activo ? 'text-yellow-600' : 'text-green-600'}
                    >
                      {importacion.activo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editScheduledImport(importacion)}
                      className="text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScheduledImport(importacion.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Estadísticas */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{importacion.totalEjecuciones}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{importacion.exitosas}</div>
                    <div className="text-sm text-gray-600">Exitosas</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">{importacion.conError}</div>
                    <div className="text-sm text-gray-600">Con Error</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {importacion.totalEjecuciones > 0 
                        ? ((importacion.exitosas / importacion.totalEjecuciones) * 100).toFixed(1)
                        : '0'
                      }%
                    </div>
                    <div className="text-sm text-gray-600">Tasa Éxito</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {scheduledImports.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay importaciones programadas
              </h3>
              <p className="text-gray-600 mb-4">
                Crea tu primera importación programada para automatizar tus procesos
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Programación
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de creación/edición */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingImport ? 'Editar Programación' : 'Nueva Importación Programada'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingImport(null)
                    setFormData({
                      nombre: '',
                      tipo: 'productos',
                      frecuencia: 'diaria',
                      hora: '09:00',
                      dias: [],
                      opciones: {}
                    })
                    setSelectedFile(null)
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre de la programación</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleFormChange('nombre', e.target.value)}
                    placeholder="Ej: Importación diaria de productos"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de importación</Label>
                    <select
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) => handleFormChange('tipo', e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="productos">Productos</option>
                      <option value="proveedores">Proveedores</option>
                      <option value="movimientos">Movimientos</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="hora">Hora de ejecución</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={formData.hora}
                      onChange={(e) => handleFormChange('hora', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Frecuencia */}
              <div className="space-y-4">
                <Label>Frecuencia de ejecución</Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'diaria', label: 'Diaria', icon: <CalendarDays className="h-4 w-4" /> },
                    { value: 'semanal', label: 'Semanal', icon: <Calendar className="h-4 w-4" /> },
                    { value: 'mensual', label: 'Mensual', icon: <Calendar className="h-4 w-4" /> },
                    { value: 'personalizada', label: 'Personalizada', icon: <Settings className="h-4 w-4" /> }
                  ].map((freq) => (
                    <button
                      key={freq.value}
                      onClick={() => handleFormChange('frecuencia', freq.value)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        formData.frecuencia === freq.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {freq.icon}
                        <span className="font-medium">{freq.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Días de la semana */}
              {(formData.frecuencia === 'semanal' || formData.frecuencia === 'personalizada') && (
                <div className="space-y-3">
                  <Label>Días de la semana</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {diasSemana.map((dia) => (
                      <div key={dia.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={dia.value}
                          checked={formData.dias.includes(dia.value)}
                          onCheckedChange={() => handleDayToggle(dia.value)}
                        />
                        <Label htmlFor={dia.value} className="text-sm">
                          {dia.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archivo */}
              <div className="space-y-3">
                <Label>Archivo a importar</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-green-600" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Cambiar archivo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-gray-600">
                        Arrastra un archivo aquí o haz clic para seleccionar
                      </p>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" size="sm">
                          Seleccionar archivo
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingImport(null)
                  }}
                >
                  Cancelar
                </Button>
                
                <Button
                  onClick={handleCreateScheduledImport}
                  disabled={!selectedFile || !formData.nombre.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingImport ? 'Actualizar' : 'Crear'} Programación
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 