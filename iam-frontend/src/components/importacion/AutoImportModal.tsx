'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { 
  Upload,
  X,
  FileText,
  Package,
  ShoppingCart,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Info,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Brain,
  Target
} from 'lucide-react'
import { useImportacionSafe } from '@/hooks/useImportacionSafe'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'
import { useFileValidation } from '@/hooks/useFileValidation'
import { DEFAULT_IMPORTACION_OPTIONS, IMPORTACION_MESSAGES } from '@/config/importacion.config'
import ProgressBar from './ProgressBar'
import ImportOptions from './ImportOptions'

interface AutoImportModalProps {
  isOpen: boolean
  onClose: () => void
}

const tipoConfig = {
  productos: {
    title: 'Productos',
    description: 'Catálogo de productos',
    icon: Package,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  proveedores: {
    title: 'Proveedores',
    description: 'Lista de proveedores',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  movimientos: {
    title: 'Movimientos',
    description: 'Movimientos de inventario',
    icon: Activity,
    color: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800'
  }
}

export default function AutoImportModal({ isOpen, onClose }: AutoImportModalProps) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [opciones, setOpciones] = useState(DEFAULT_IMPORTACION_OPTIONS)
  const [showOptions, setShowOptions] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { validateFile, isNumbersFile, getFileSizeMB } = useFileValidation()
  
  const importacionData = useImportacionSafe()
  
  // Asegurar que todas las propiedades estén definidas
  const {
    isImporting = false,
    currentTrabajo = null,
    error = null,
    success = null,
    validationErrors = null,
    deteccionTipo = null,
    importarAuto = (() => Promise.resolve()),
    validarAuto = (() => Promise.resolve()),
    confirmarAuto = (() => Promise.resolve()),
    descargarPlantilla = (() => Promise.resolve()),
    clearError = (() => {}),
    clearSuccess = (() => {}),
    clearValidationErrors = (() => {}),
    clearDeteccionTipo = (() => {})
  } = importacionData || {}

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
        handleFileSelect(file)
      }
    }
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    if (validarArchivo(file)) {
      setArchivo(file)
      setIsValidating(true)
      clearError()
      clearSuccess()
      clearValidationErrors()
      clearDeteccionTipo()
      
      try {
        const resultado = await validarAuto(file)
        if (resultado) {
          setNeedsConfirmation(resultado.necesitaConfirmacion)
        }
      } catch (error) {
        console.error('Error al validar archivo:', error)
      } finally {
        setIsValidating(false)
      }
    }
  }, [validarAuto, clearError, clearSuccess, clearValidationErrors, clearDeteccionTipo])

  const handleFileRemove = useCallback(() => {
    setArchivo(null)
    setNeedsConfirmation(false)
    clearDeteccionTipo()
  }, [clearDeteccionTipo])

  const validarArchivo = (file: File): boolean => {
    const result = validateFile(file)
    return result.isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!archivo) {
      return
    }

    try {
      // Por ahora, siempre usar importación automática
      // TODO: Implementar confirmación cuando sea necesario
        await importarAuto(archivo, opciones)
    } catch (error) {
      console.error('Error en importación:', error)
    }
  }

  const handleDescargarPlantilla = async () => {
    if (deteccionTipo?.tipoDetectado) {
      await descargarPlantilla(deteccionTipo.tipoDetectado)
    }
  }

  const handleClose = () => {
    setArchivo(null)
    setOpciones(DEFAULT_IMPORTACION_OPTIONS)
    setShowOptions(false)
    setIsValidating(false)
    setNeedsConfirmation(false)
    clearError()
    clearSuccess()
    clearValidationErrors()
    clearDeteccionTipo()
    onClose()
  }

  const getConfianzaColor = (confianza: number) => {
    if (confianza >= 80) return 'text-green-600'
    if (confianza >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfianzaText = (confianza: number) => {
    if (confianza >= 80) return 'Alta'
    if (confianza >= 60) return 'Media'
    return 'Baja'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importación Inteligente</h2>
            <p className="text-gray-600 mt-1">
              Sube tu archivo y déjanos detectar automáticamente el tipo de datos
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Área de Subida de Archivo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Seleccionar archivo
                </Label>
                {deteccionTipo?.tipoDetectado && (
                  <button
                    type="button"
                    onClick={handleDescargarPlantilla}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar plantilla mejorada
                  </button>
                )}
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : archivo
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {archivo ? (
                  <div className="space-y-3">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <div>
                      <p className="font-medium text-gray-900">{archivo.name}</p>
                      <p className="text-sm text-gray-600">
                        {getFileSizeMB(archivo)} MB
                      </p>
                      {isNumbersFile(archivo) && (
                        <p className="text-sm text-blue-600 mt-1">
                          {IMPORTACION_MESSAGES.NUMBERS_FILE_DETECTED}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleFileRemove}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <Sparkles className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Arrastra tu archivo aquí o haz clic para seleccionar
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Detectaremos automáticamente el tipo de datos
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.numbers,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                className="hidden"
              />
            </div>

            {/* Detección de Tipo */}
            {isValidating && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div>
                    <p className="font-medium text-blue-900">Analizando archivo...</p>
                    <p className="text-sm text-blue-700">Detectando tipo de datos automáticamente</p>
                  </div>
                </div>
              </div>
            )}

            {deteccionTipo && !isValidating && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Tipo Detectado</h3>
                  </div>
                  
                  {deteccionTipo.tipoDetectado && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <div className={`p-2 rounded-lg ${tipoConfig[deteccionTipo.tipoDetectado].color}`}>
                        {React.createElement(tipoConfig[deteccionTipo.tipoDetectado].icon, { 
                          className: "w-5 h-5 text-white" 
                        })}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {tipoConfig[deteccionTipo.tipoDetectado].title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {tipoConfig[deteccionTipo.tipoDetectado].description}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={tipoConfig[deteccionTipo.tipoDetectado].badgeColor}>
                          {deteccionTipo.tipoDetectado}
                        </Badge>
                        <div className="mt-1">
                          <span className={`text-xs font-medium ${getConfianzaColor(deteccionTipo.confianza)}`}>
                            Confianza: {getConfianzaText(deteccionTipo.confianza)} ({deteccionTipo.confianza}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Razones de detección */}
                  {deteccionTipo.razones && deteccionTipo.razones.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Razones de detección:</p>
                      <ul className="space-y-1">
                        {deteccionTipo.razones.map((razon, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {razon}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Necesita confirmación */}
                  {needsConfirmation && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          La detección automática no es completamente segura. Por favor, confirma el tipo de datos.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sugerencias */}
                  {deteccionTipo.sugerencias && deteccionTipo.sugerencias.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Sugerencias:</p>
                      <ul className="space-y-1">
                        {deteccionTipo.sugerencias.map((sugerencia, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <Info className="w-3 h-3 text-blue-500" />
                            {sugerencia}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Opciones Avanzadas */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Info className="w-4 h-4" />
                Opciones avanzadas
                {showOptions ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showOptions && (
                <ImportOptions
                  opciones={opciones}
                  onOpcionesChange={setOpciones}
                />
              )}
            </div>

            {/* Barra de Progreso */}
            {isImporting && currentTrabajo && (
              <ProgressBar trabajo={currentTrabajo} />
            )}

            {/* Mensajes de Error/Success */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">{success}</span>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isImporting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!archivo || isImporting || isValidating}
                className="bg-gradient-to-r from-[#8E94F2] to-[#7278e0] hover:from-[#7278e0] hover:to-[#8E94F2]"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Importando...
                  </>
                ) : isValidating ? (
                  <>
                    <Brain className="w-4 h-4 animate-pulse mr-2" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Importar Automáticamente
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 