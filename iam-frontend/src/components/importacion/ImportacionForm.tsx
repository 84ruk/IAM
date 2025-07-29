'use client'

import { useState, useCallback, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { 
  Download,
  Info,
  X,
  Upload
} from 'lucide-react'
import { useImportacionUnified } from '@/hooks/useImportacionUnified'
import { useFileDrop } from '@/hooks/useFileDrop'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'
import ImportacionStatus from './ImportacionStatus'
import { ImportacionLoading } from './ImportacionLoading'
import { ValidationErrors } from './ValidationErrors'
import FileTypeInfo from './FileTypeInfo'
import NumbersFileNotification from './NumbersFileNotification'
import FileUploadArea from './base/FileUploadArea'
import { getImportacionConfig, DEFAULT_IMPORTACION_OPTIONS, IMPORTACION_MESSAGES } from '@/config/importacion.config'

interface ImportacionFormProps {
  tipo: TipoImportacion
  onClose: () => void
}

// Configuración centralizada de importación

const OPCIONES_INICIALES = {
  sobrescribirExistentes: false,
  validarSolo: false,
  notificarEmail: false,
  emailNotificacion: '',
  configuracionEspecifica: {}
};

export default function ImportacionForm({ tipo, onClose }: ImportacionFormProps) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [opciones, setOpciones] = useState(OPCIONES_INICIALES)

  // Hook unificado de importación
  const {
    isImporting,
    currentTrabajo,
    error,
    success,
    validationErrors,
    isConnected,
    importarNormal,
    descargarPlantilla,
    cancelarTrabajo,
    clearError,
    clearSuccess,
    clearValidationErrors,
    subscribeToTrabajo
  } = useImportacionUnified()

  const config = getImportacionConfig(tipo)

  // Definir handleFileSelect ANTES de usarlo en useFileDrop
  const handleFileSelect = useCallback((file: File) => {
    setArchivo(file)
  }, [])
  
  // Hook de drag & drop (ahora handleFileSelect ya está definido)
  const {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useFileDrop({
    onFileSelect: handleFileSelect,
    accept: '.xlsx,.xls,.numbers,.csv',
    maxSize: 10
  })

  // Suscribirse al trabajo actual cuando esté disponible
  useEffect(() => {
    if (currentTrabajo?.id) {
      subscribeToTrabajo(currentTrabajo.id)
    }
  }, [currentTrabajo?.id, subscribeToTrabajo])

  const handleFileRemove = useCallback(() => {
    setArchivo(null)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!archivo) {
      alert(IMPORTACION_MESSAGES.ERROR.NO_FILE_SELECTED)
      return
    }

    try {
      await importarNormal(archivo, tipo, opciones)
      onClose()
    } catch (error) {
      console.error('Error al importar:', error)
    }
  }

  const handleDescargarPlantilla = async () => {
    await descargarPlantilla(tipo)
  }

  const handleClose = useCallback(() => {
    setArchivo(null)
    setOpciones(OPCIONES_INICIALES)
    clearError()
    clearSuccess()
    clearValidationErrors()
    onClose()
  }, [onClose, clearError, clearSuccess, clearValidationErrors])

  // Mostrar estado de carga si está importando
  if (isImporting && currentTrabajo) {
    return (
      <div className="space-y-4">
        <ImportacionStatus
          trabajo={currentTrabajo}
          onCancel={() => {}} // TODO: Implementar cancelación
          onRefresh={() => {}} // TODO: Implementar refresh
        />
        <ImportacionLoading
          archivo={archivo!}
          progreso={currentTrabajo.progreso || 0}
          mensaje={currentTrabajo.mensaje || 'Procesando importación...'}
          onCancel={() => {}} // TODO: Implementar cancelación
        />
      </div>
    )
  }

  // Mostrar errores de validación si existen
  if (validationErrors && validationErrors.length > 0) {
    return (
      <div className="space-y-4">
        <ValidationErrors
          errors={validationErrors}
          totalRegistros={currentTrabajo?.totalRegistros || 0}
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <CardTitle>Importar {config.title}</CardTitle>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Notificaciones */}
        

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de archivo */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Seleccionar archivo
            </h3>
            
            <FileUploadArea
              file={archivo}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              accept=".xlsx,.xls,.numbers,.csv"
              maxSize={10}
              showFileInfo={true}
            />
          </div>

          {/* Información de campos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">Campos requeridos</h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {config.camposRequeridos.map((campo) => (
                <Badge key={campo} variant="secondary" className="bg-red-100 text-red-800">
                  {campo}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Campos opcionales</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.camposOpcionales.map((campo) => (
                <Badge key={campo} variant="outline">
                  {campo}
                </Badge>
              ))}
            </div>
          </div>

          {/* Información de tipos de archivo */}
          <FileTypeInfo />

          {/* Opciones de importación */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Opciones de importación</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sobrescribirExistentes"
                  checked={opciones.sobrescribirExistentes}
                  onCheckedChange={(checked) => 
                    setOpciones(prev => ({ ...prev, sobrescribirExistentes: !!checked }))
                  }
                />
                <Label htmlFor="sobrescribirExistentes">
                  Sobrescribir registros existentes
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validarSolo"
                  checked={opciones.validarSolo}
                  onCheckedChange={(checked) => 
                    setOpciones(prev => ({ ...prev, validarSolo: !!checked }))
                  }
                />
                <Label htmlFor="validarSolo">
                  Solo validar (no importar)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notificarEmail"
                  checked={opciones.notificarEmail}
                  onCheckedChange={(checked) => 
                    setOpciones(prev => ({ ...prev, notificarEmail: !!checked }))
                  }
                />
                <Label htmlFor="notificarEmail">
                  Recibir notificación por email
                </Label>
              </div>

              {opciones.notificarEmail && (
                <div>
                  <Label htmlFor="emailNotificacion" className="block mb-1">
                    Email para notificación
                  </Label>
                  <Input
                    id="emailNotificacion"
                    type="email"
                    placeholder="tu@email.com"
                    value={opciones.emailNotificacion}
                    onChange={(e) => 
                      setOpciones(prev => ({ ...prev, emailNotificacion: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDescargarPlantilla}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar plantilla
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Cancelar
              </Button>
            </div>
            
            <Button
              type="submit"
              disabled={!archivo || isImporting}
              className="min-w-[120px]"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 