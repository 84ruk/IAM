'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
  ChevronDown
} from 'lucide-react'
import { useImportacionOptimized } from '@/hooks/useImportacionOptimized'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'
import { useFileValidation } from '@/hooks/useFileValidation'
import { getImportacionConfig, DEFAULT_IMPORTACION_OPTIONS, IMPORTACION_MESSAGES } from '@/config/importacion.config'
import ProgressBar from './ProgressBar'
import ImportTypeSelector from './ImportTypeSelector'
import ImportOptions from './ImportOptions'
import ErrorDisplay from '@/components/ui/ErrorDisplay'

interface UnifiedImportModalProps {
  isOpen: boolean
  onClose: () => void
}

const tipoConfig = {
  productos: {
    title: 'Productos',
    description: 'Importa tu catálogo de productos',
    icon: Package,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  proveedores: {
    title: 'Proveedores',
    description: 'Importa tu lista de proveedores',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  movimientos: {
    title: 'Movimientos',
    description: 'Importa movimientos de inventario',
    icon: Activity,
    color: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800'
  }
}

export default function UnifiedImportModal({ isOpen, onClose }: UnifiedImportModalProps) {
  const [selectedTipo, setSelectedTipo] = useState<TipoImportacion | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [opciones, setOpciones] = useState(DEFAULT_IMPORTACION_OPTIONS)
  const [showOptions, setShowOptions] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { validateFile, isNumbersFile, getFileSizeMB } = useFileValidation()
  
  const {
    isImporting,
    currentTrabajo,
    error,
    success,
    validationErrors,
    importarUnified,
    descargarPlantilla,
    clearError,
    clearSuccess,
    clearValidationErrors
  } = useImportacionOptimized()

  const handleTipoSelect = (tipo: TipoImportacion) => {
    setSelectedTipo(tipo)
    setArchivo(null)
    clearError()
    clearSuccess()
    clearValidationErrors()
  }

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
    
    if (!selectedTipo || !archivo) {
      return
    }

    try {
      await importarUnified(archivo, selectedTipo, opciones)
    } catch (error) {
      console.error('Error en importación:', error)
    }
  }

  const handleDescargarPlantilla = async () => {
    if (!selectedTipo) return
    await descargarPlantilla(selectedTipo)
  }

  const handleClose = () => {
    setSelectedTipo(null)
    setArchivo(null)
    setOpciones(DEFAULT_IMPORTACION_OPTIONS)
    setShowOptions(false)
    clearError()
    clearSuccess()
    clearValidationErrors()
    onClose()
  }

  if (!isOpen) return null

  // Renderizado de mensajes de éxito
  const renderSuccess = () => {
    if (typeof success === 'string' && success) {
      return (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )
    }
    // Si success es un objeto inesperado o undefined, mostrar mensaje genérico
    if (success && typeof success !== 'string') {
      console.error('Respuesta de éxito inesperada:', success)
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">¡Importación completada! (Respuesta inesperada del servidor)</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importar Datos</h2>
            <p className="text-gray-600 mt-1">
              Sube archivos Excel, Numbers o CSV para importar tus datos
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
          {/* Selector de Tipo */}
          {!selectedTipo && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ¿Qué tipo de datos quieres importar?
              </h3>
              <ImportTypeSelector onSelect={handleTipoSelect} />
            </div>
          )}

          {/* Formulario de Importación */}
          {selectedTipo && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header del tipo seleccionado */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className={`p-2 rounded-lg ${tipoConfig[selectedTipo].color}`}>
                  {React.createElement(tipoConfig[selectedTipo].icon, { 
                    className: "w-6 h-6 text-white" 
                  })}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {tipoConfig[selectedTipo].title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {tipoConfig[selectedTipo].description}
                  </p>
                </div>
                <Badge className={tipoConfig[selectedTipo].badgeColor}>
                  {selectedTipo}
                </Badge>
              </div>

              {/* Área de Subida de Archivo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    Seleccionar archivo
                  </Label>
                  <button
                    type="button"
                    onClick={handleDescargarPlantilla}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar plantilla
                  </button>
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
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Arrastra tu archivo aquí o haz clic para seleccionar
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Excel (.xlsx, .xls), Numbers (.numbers) o CSV
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
                <ErrorDisplay
                  error={error}
                  onClose={clearError}
                  onRetry={() => {
                    clearError()
                    // Aquí podrías agregar lógica para reintentar
                  }}
                  onDownloadTemplate={handleDescargarPlantilla}
                />
              )}

              {renderSuccess()}

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
                  disabled={!archivo || isImporting}
                  className="bg-gradient-to-r from-[#8E94F2] to-[#7278e0] hover:from-[#7278e0] hover:to-[#8E94F2]"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
          )}
        </div>
      </div>
    </div>
  )
} 