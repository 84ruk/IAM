'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { 
  Download,
  Info,
  X,
  Upload
} from 'lucide-react'
import { useImportacion } from '@/hooks/useImportacion'
import { TipoImportacion } from '@/hooks/useImportacion'
import { ImportacionStatus } from './ImportacionStatus'
import { ImportacionNotifications } from './ImportacionNotifications'
import { ImportacionLoading } from './ImportacionLoading'
import { ValidationErrors } from './ValidationErrors'
import FileTypeInfo from './FileTypeInfo'
import NumbersFileNotification from './NumbersFileNotification'
import FileUploadArea from './FileUploadArea'
import { useFileValidation } from '@/hooks/useFileValidation'
import { getImportacionConfig, DEFAULT_IMPORTACION_OPTIONS, IMPORTACION_MESSAGES } from '@/config/importacion.config'

interface ImportacionFormProps {
  tipo: TipoImportacion
  onClose: () => void
}

// Configuración centralizada de importación

export default function ImportacionForm({ tipo, onClose }: ImportacionFormProps) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [opciones, setOpciones] = useState(DEFAULT_IMPORTACION_OPTIONS)

  const { validateFile, isNumbersFile, getFileSizeMB } = useFileValidation()
  
  const {
    isImporting,
    currentTrabajo,
    error,
    success,
    validationErrors,
    importarProductos,
    importarProveedores,
    importarMovimientos,
    descargarPlantilla,
    cancelarTrabajo,
    clearError,
    clearSuccess,
    clearValidationErrors
  } = useImportacion()

  const config = getImportacionConfig(tipo)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      if (validarArchivo(file)) {
        setArchivo(file)
      }
    }
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    if (validarArchivo(file)) {
      setArchivo(file)
    }
  }, [])

  const handleFileRemove = useCallback(() => {
    setArchivo(null)
  }, [])

  const validarArchivo = (file: File): boolean => {
    const result = validateFile(file)
    return result.isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!archivo) {
      alert(IMPORTACION_MESSAGES.NO_FILE_SELECTED)
      return
    }

    try {
      switch (tipo) {
        case 'productos':
          await importarProductos(archivo, opciones)
          break
        case 'proveedores':
          await importarProveedores(archivo, opciones)
          break
        case 'movimientos':
          await importarMovimientos(archivo, opciones)
          break
      }
      
      onClose()
    } catch (error) {
      console.error('Error al importar:', error)
    }
  }

  const handleDescargarPlantilla = async () => {
    await descargarPlantilla(tipo)
  }

  // Mostrar estado de carga si está importando
  if (isImporting && currentTrabajo) {
    return (
      <div className="space-y-4">
        <ImportacionStatus
          trabajo={currentTrabajo}
          isImporting={isImporting}
          onCancel={() => currentTrabajo && cancelarTrabajo(currentTrabajo.id)}
          onRefresh={() => {}} // TODO: Implementar refresh
        />
        <ImportacionLoading
          archivo={archivo!}
          progreso={currentTrabajo.progreso || 0}
          mensaje={currentTrabajo.mensaje || 'Procesando importación...'}
          onCancel={() => currentTrabajo && cancelarTrabajo(currentTrabajo.id)}
        />
      </div>
    )
  }

  // Mostrar errores de validación si existen
  if (validationErrors && validationErrors.length > 0) {
    return (
      <div className="space-y-4">
        <ImportacionNotifications
          success={success}
          error={error}
          validationErrors={validationErrors}
          onClearSuccess={clearSuccess}
          onClearError={clearError}
          onClearValidationErrors={clearValidationErrors}
        />
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
        <ImportacionNotifications
          success={success}
          error={error}
          validationErrors={validationErrors}
          onClearSuccess={clearSuccess}
          onClearError={clearError}
          onClearValidationErrors={clearValidationErrors}
          className="mb-6"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de archivo */}
          <div>
            <Label htmlFor="archivo" className="block mb-2">
              Seleccionar archivo
            </Label>
            
            {/* Notificación para archivos .numbers */}
            {archivo && isNumbersFile(archivo) && (
              <NumbersFileNotification 
                fileName={archivo.name} 
                className="mb-4"
              />
            )}
            
            <FileUploadArea
              file={archivo}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
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